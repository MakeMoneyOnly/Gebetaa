import { randomBytes } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const PurchaseOrdersQuerySchema = z.object({
    status: z
        .enum(['draft', 'submitted', 'partially_received', 'received', 'cancelled'])
        .optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

const CreatePurchaseOrderSchema = z.object({
    po_number: z.string().trim().min(4).max(64).optional(),
    supplier_name: z.string().trim().min(2).max(140),
    status: z.enum(['draft', 'submitted']).optional().default('draft'),
    currency: z.string().trim().length(3).optional().default('ETB'),
    subtotal: z.coerce.number().min(0).max(100000000).optional().default(0),
    tax_amount: z.coerce.number().min(0).max(100000000).optional().default(0),
    total_amount: z.coerce.number().min(0).max(100000000).optional(),
    expected_at: z.string().datetime().optional(),
    notes: z.string().trim().max(600).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

function generatePurchaseOrderNumber() {
    return `PO-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = parseQuery(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
        PurchaseOrdersQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    let query = db
        .from('purchase_orders')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }

    const { data, error } = await query;
    if (error) {
        return apiError(
            'Failed to fetch purchase orders',
            500,
            'PURCHASE_ORDERS_FETCH_FAILED',
            error.message
        );
    }

    return apiSuccess({ purchase_orders: data ?? [] });
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, CreatePurchaseOrderSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const subtotal = Number(parsed.data.subtotal.toFixed(2));
    const tax = Number(parsed.data.tax_amount.toFixed(2));
    const total =
        parsed.data.total_amount !== undefined
            ? Number(parsed.data.total_amount.toFixed(2))
            : Number((subtotal + tax).toFixed(2));

    const db = context.supabase;

    const { data: po, error } = await db
        .from('purchase_orders')
        .insert({
            restaurant_id: context.restaurantId,
            po_number: parsed.data.po_number?.trim().toUpperCase() || generatePurchaseOrderNumber(),
            supplier_name: parsed.data.supplier_name,
            status: parsed.data.status,
            currency: parsed.data.currency.toUpperCase(),
            subtotal,
            tax_amount: tax,
            total_amount: total,
            expected_at: parsed.data.expected_at ?? null,
            notes: parsed.data.notes ?? null,
            metadata: (parsed.data.metadata ?? {}) as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError(
            'Failed to create purchase order',
            500,
            'PURCHASE_ORDER_CREATE_FAILED',
            error.message
        );
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'purchase_order_created',
        entity_type: 'purchase_order',
        entity_id: po.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            po_number: po.po_number,
            supplier_name: po.supplier_name,
            status: po.status,
            total_amount: po.total_amount,
        },
    });

    return apiSuccess({ purchase_order: po, idempotency_key: idempotencyKey }, 201);
}
