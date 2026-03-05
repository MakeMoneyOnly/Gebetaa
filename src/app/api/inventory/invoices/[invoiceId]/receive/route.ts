import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const ParamsSchema = z.object({
    invoiceId: z.string().uuid(),
});

const InvoiceLineItemSchema = z.object({
    description: z.string().trim().min(1).max(200),
    normalized_description: z.string().trim().min(1).max(220).optional(),
    qty: z.coerce.number().positive().max(100000).nullable().optional(),
    unit_price: z.coerce.number().min(0).max(100000000).nullable().optional(),
    line_total: z.coerce.number().min(0).max(100000000).nullable().optional(),
    uom: z.string().trim().min(1).max(24).nullable().optional(),
    inventory_item_id: z.string().uuid().nullable().optional(),
    inventory_item_name: z.string().trim().min(1).max(140).nullable().optional(),
    match_confidence: z.coerce.number().min(0).max(1).optional(),
    match_method: z.enum(['exact', 'contains', 'token_overlap', 'none']).optional(),
});

const HIGH_PROVIDER_CONFIDENCE_MIN = 0.9;
const HIGH_MATCH_CONFIDENCE_MIN = 0.88;
const HIGH_MAPPED_RATIO_MIN = 0.85;

type ReceiveExceptionCode = 'UNMATCHED_ITEM' | 'LOW_CONFIDENCE' | 'INVALID_QTY';
type ReceiveException = {
    line_index: number;
    code: ReceiveExceptionCode;
    description: string;
    detail: string;
};

function toRecord(value: Json | null | undefined) {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return {} as Record<string, unknown>;
    }
    return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    return fallback;
}

function asString(value: unknown) {
    return typeof value === 'string' ? value : null;
}

function buildReceiveExceptions(
    lineItems: Array<z.infer<typeof InvoiceLineItemSchema>>
): ReceiveException[] {
    const exceptions: ReceiveException[] = [];
    lineItems.forEach((item, index) => {
        if (!item.inventory_item_id) {
            exceptions.push({
                line_index: index,
                code: 'UNMATCHED_ITEM',
                description: item.description,
                detail: 'Line item is not mapped to inventory.',
            });
            return;
        }

        if (!item.qty || item.qty <= 0) {
            exceptions.push({
                line_index: index,
                code: 'INVALID_QTY',
                description: item.description,
                detail: 'Line item quantity is missing or invalid.',
            });
            return;
        }

        const confidence = asNumber(item.match_confidence, 0);
        if (confidence < HIGH_MATCH_CONFIDENCE_MIN) {
            exceptions.push({
                line_index: index,
                code: 'LOW_CONFIDENCE',
                description: item.description,
                detail: `Match confidence ${confidence.toFixed(2)} is below ${HIGH_MATCH_CONFIDENCE_MIN}.`,
            });
        }
    });
    return exceptions;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const resolvedParams = await params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
        return apiError('Invalid invoice id', 400, 'INVALID_INVOICE_ID');
    }
    const invoiceId = parsedParams.data.invoiceId;

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const db = context.supabase;

    const { data: invoice, error: invoiceError } = await db
        .from('supplier_invoices')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .eq('id', invoiceId)
        .maybeSingle();

    if (invoiceError) {
        return apiError(
            'Failed to load invoice',
            500,
            'SUPPLIER_INVOICE_FETCH_FAILED',
            invoiceError.message
        );
    }
    if (!invoice) {
        return apiError('Invoice not found', 404, 'SUPPLIER_INVOICE_NOT_FOUND');
    }

    const invoiceMetadata = toRecord(invoice.metadata as Json | null | undefined);
    const receiving = toRecord(invoiceMetadata.receiving as Json | null | undefined);

    if (asString(receiving.last_idempotency_key) === idempotencyKey) {
        return apiSuccess({
            invoice_id: invoiceId,
            idempotency_key: idempotencyKey,
            already_processed: true,
            receive_summary: receiving.summary ?? null,
        });
    }

    const { data: existingMovements, error: movementsLookupError } = await db
        .from('stock_movements')
        .select('id')
        .eq('restaurant_id', context.restaurantId)
        .eq('reference_type', 'invoice')
        .eq('reference_id', invoiceId)
        .limit(1);

    if (movementsLookupError) {
        return apiError(
            'Failed to verify previous receive operations',
            500,
            'INVOICE_RECEIVE_LOOKUP_FAILED',
            movementsLookupError.message
        );
    }

    if ((existingMovements ?? []).length > 0) {
        return apiSuccess({
            invoice_id: invoiceId,
            idempotency_key: idempotencyKey,
            already_processed: true,
            receive_summary: receiving.summary ?? null,
        });
    }

    const rawLineItems = invoiceMetadata.line_items;
    const parsedLineItems = z.array(InvoiceLineItemSchema).safeParse(rawLineItems);
    if (!parsedLineItems.success || parsedLineItems.data.length === 0) {
        return apiError(
            'Invoice has no valid mapped line items to receive',
            409,
            'INVOICE_RECEIVE_NO_LINE_ITEMS'
        );
    }

    const lineItems = parsedLineItems.data;
    const exceptions = buildReceiveExceptions(lineItems);
    const mappedCount = lineItems.filter(item => item.inventory_item_id && (item.qty ?? 0) > 0).length;
    const mappedRatio = lineItems.length === 0 ? 0 : mappedCount / lineItems.length;
    const computedAverageMatchConfidence =
        lineItems.length === 0
            ? 0
            : lineItems.reduce((sum, item) => sum + asNumber(item.match_confidence, 0), 0) /
              lineItems.length;

    const ocrSource = toRecord(invoiceMetadata.ocr_source as Json | null | undefined);
    const ingestion = toRecord(invoiceMetadata.ingestion as Json | null | undefined);
    const providerConfidence = asNumber(
        ocrSource.provider_confidence ?? ingestion.provider_confidence,
        asNumber(ocrSource.average_match_confidence, computedAverageMatchConfidence)
    );
    const averageMatchConfidence = asNumber(
        ocrSource.average_match_confidence,
        computedAverageMatchConfidence
    );

    const highConfidenceAutoReceive =
        providerConfidence >= HIGH_PROVIDER_CONFIDENCE_MIN &&
        mappedRatio >= HIGH_MAPPED_RATIO_MIN &&
        averageMatchConfidence >= HIGH_MATCH_CONFIDENCE_MIN &&
        exceptions.length === 0;

    if (!highConfidenceAutoReceive) {
        const nextMetadata = {
            ...invoiceMetadata,
            receive_exceptions: exceptions,
            receiving: {
                ...receiving,
                last_idempotency_key: idempotencyKey,
                last_attempt_at: new Date().toISOString(),
                mode: 'human_review',
                summary: {
                    mapped_ratio: Number(mappedRatio.toFixed(2)),
                    provider_confidence: Number(providerConfidence.toFixed(2)),
                    average_match_confidence: Number(averageMatchConfidence.toFixed(2)),
                    exceptions_count: exceptions.length,
                    auto_receive_eligible: false,
                },
            },
        };

        const { data: updatedInvoice, error: updateError } = await db
            .from('supplier_invoices')
            .update({
                status: 'pending_review',
                metadata: nextMetadata as Json,
            })
            .eq('restaurant_id', context.restaurantId)
            .eq('id', invoiceId)
            .select('*')
            .single();

        if (updateError) {
            return apiError(
                'Failed to persist receive exceptions',
                500,
                'INVOICE_RECEIVE_EXCEPTION_UPDATE_FAILED',
                updateError.message
            );
        }

        await writeAuditLog(context.supabase, {
            restaurant_id: context.restaurantId,
            user_id: auth.user.id,
            action: 'supplier_invoice_receive_queued_review',
            entity_type: 'supplier_invoice',
            entity_id: invoiceId,
            metadata: {
                source: 'merchant_dashboard',
                idempotency_key: idempotencyKey,
            },
            new_value: {
                status: updatedInvoice.status,
                exceptions_count: exceptions.length,
                mapped_ratio: Number(mappedRatio.toFixed(2)),
                provider_confidence: Number(providerConfidence.toFixed(2)),
                average_match_confidence: Number(averageMatchConfidence.toFixed(2)),
            },
        });

        return apiSuccess(
            {
                invoice_id: invoiceId,
                queued_for_review: true,
                receive_exceptions: exceptions,
                confidence: {
                    provider_confidence: Number(providerConfidence.toFixed(2)),
                    mapped_ratio: Number(mappedRatio.toFixed(2)),
                    average_match_confidence: Number(averageMatchConfidence.toFixed(2)),
                },
                idempotency_key: idempotencyKey,
            },
            202
        );
    }

    const linesByItem = new Map<
        string,
        { qty: number; unitCostAmount: number; hasCost: boolean; descriptions: string[] }
    >();
    lineItems.forEach(item => {
        if (!item.inventory_item_id || !item.qty || item.qty <= 0) return;
        const current = linesByItem.get(item.inventory_item_id) ?? {
            qty: 0,
            unitCostAmount: 0,
            hasCost: false,
            descriptions: [],
        };
        current.qty += item.qty;
        if (typeof item.unit_price === 'number' && Number.isFinite(item.unit_price)) {
            current.unitCostAmount += item.unit_price * item.qty;
            current.hasCost = true;
        }
        current.descriptions.push(item.description);
        linesByItem.set(item.inventory_item_id, current);
    });

    const itemIds = Array.from(linesByItem.keys());
    const { data: inventoryItems, error: inventoryItemsError } = await db
        .from('inventory_items')
        .select('id, name, current_stock')
        .eq('restaurant_id', context.restaurantId)
        .in('id', itemIds)
        .limit(1000);

    if (inventoryItemsError) {
        return apiError(
            'Failed to load inventory items for receive',
            500,
            'INVOICE_RECEIVE_INVENTORY_FETCH_FAILED',
            inventoryItemsError.message
        );
    }

    const inventoryById = new Map((inventoryItems ?? []).map(item => [item.id, item]));
    if (inventoryById.size !== itemIds.length) {
        return apiError(
            'One or more mapped inventory items no longer exist',
            409,
            'INVOICE_RECEIVE_INVENTORY_MISSING'
        );
    }

    const movementIds: string[] = [];
    const stockChanges: Array<{ inventory_item_id: string; previous_stock: number; next_stock: number }> = [];

    for (const [inventoryItemId, aggregate] of linesByItem.entries()) {
        const inventoryItem = inventoryById.get(inventoryItemId);
        if (!inventoryItem) continue;
        const currentStock = Number(inventoryItem.current_stock ?? 0);
        const nextStock = Number((currentStock + aggregate.qty).toFixed(3));
        const unitCost = aggregate.hasCost
            ? Number((aggregate.unitCostAmount / aggregate.qty).toFixed(2))
            : null;

        const { data: movement, error: movementError } = await db
            .from('stock_movements')
            .insert({
                restaurant_id: context.restaurantId,
                inventory_item_id: inventoryItemId,
                movement_type: 'in',
                qty: Number(aggregate.qty.toFixed(3)),
                unit_cost: unitCost,
                reason: `Invoice receive ${invoice.invoice_number}`,
                reference_type: 'invoice',
                reference_id: invoiceId,
                metadata: {
                    source: 'invoice_auto_receive',
                    idempotency_key: idempotencyKey,
                    line_descriptions: aggregate.descriptions,
                } as Json,
                created_by: auth.user.id,
            })
            .select('*')
            .single();

        if (movementError) {
            return apiError(
                'Failed to create stock movement from invoice',
                500,
                'INVOICE_RECEIVE_STOCK_MOVEMENT_FAILED',
                movementError.message
            );
        }

        const inventoryPatch: Record<string, unknown> = {
            current_stock: nextStock,
        };
        if (unitCost !== null) {
            inventoryPatch.cost_per_unit = unitCost;
        }

        const { error: updateStockError } = await db
            .from('inventory_items')
            .update(inventoryPatch)
            .eq('restaurant_id', context.restaurantId)
            .eq('id', inventoryItemId)
            .select('id')
            .single();

        if (updateStockError) {
            return apiError(
                'Failed to update inventory stock from invoice receive',
                500,
                'INVOICE_RECEIVE_INVENTORY_UPDATE_FAILED',
                updateStockError.message
            );
        }

        movementIds.push(movement.id);
        stockChanges.push({
            inventory_item_id: inventoryItemId,
            previous_stock: currentStock,
            next_stock: nextStock,
        });
    }

    const receiveSummary = {
        auto_receive_eligible: true,
        provider_confidence: Number(providerConfidence.toFixed(2)),
        mapped_ratio: Number(mappedRatio.toFixed(2)),
        average_match_confidence: Number(averageMatchConfidence.toFixed(2)),
        movement_count: movementIds.length,
    };

    const receivedMetadata = {
        ...invoiceMetadata,
        receive_exceptions: [] as ReceiveException[],
        receiving: {
            ...receiving,
            mode: 'auto_receive',
            completed_at: new Date().toISOString(),
            last_idempotency_key: idempotencyKey,
            movement_ids: movementIds,
            summary: receiveSummary,
        },
    };

    const { data: updatedInvoice, error: receiveUpdateError } = await db
        .from('supplier_invoices')
        .update({
            status: 'approved',
            metadata: receivedMetadata as Json,
        })
        .eq('restaurant_id', context.restaurantId)
        .eq('id', invoiceId)
        .select('*')
        .single();

    if (receiveUpdateError) {
        return apiError(
            'Failed to update invoice receive state',
            500,
            'INVOICE_RECEIVE_UPDATE_FAILED',
            receiveUpdateError.message
        );
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'supplier_invoice_received',
        entity_type: 'supplier_invoice',
        entity_id: invoiceId,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
            mode: 'auto_receive',
        },
        new_value: {
            status: updatedInvoice.status,
            movement_count: movementIds.length,
            receive_summary: receiveSummary,
            stock_changes: stockChanges,
        },
    });

    return apiSuccess({
        invoice_id: invoiceId,
        status: updatedInvoice.status,
        movement_ids: movementIds,
        stock_changes: stockChanges,
        receive_summary: receiveSummary,
        idempotency_key: idempotencyKey,
    });
}
