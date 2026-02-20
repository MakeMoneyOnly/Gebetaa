import { randomBytes } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const SupplierInvoicesQuerySchema = z.object({
    status: z.enum(['pending_review', 'approved', 'disputed', 'paid', 'voided']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

const CreateSupplierInvoiceSchema = z.object({
    purchase_order_id: z.string().uuid().optional(),
    invoice_number: z.string().trim().min(3).max(80).optional(),
    supplier_name: z.string().trim().min(2).max(140),
    status: z.enum(['pending_review', 'approved', 'disputed', 'paid', 'voided']).optional().default('pending_review'),
    currency: z.string().trim().length(3).optional().default('ETB'),
    subtotal: z.coerce.number().min(0).max(100000000).optional().default(0),
    tax_amount: z.coerce.number().min(0).max(100000000).optional().default(0),
    total_amount: z.coerce.number().min(0).max(100000000).optional(),
    issued_at: z.string().datetime().optional(),
    due_at: z.string().datetime().optional(),
    paid_at: z.string().datetime().optional(),
    notes: z.string().trim().max(600).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

function generateInvoiceNumber() {
    return `INV-${randomBytes(3).toString('hex').toUpperCase()}`;
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
        SupplierInvoicesQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    let query = db
        .from('supplier_invoices')
        .select('*, purchase_order:purchase_orders(id, po_number, status)')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }

    const { data, error } = await query;
    if (error) {
        return apiError('Failed to fetch supplier invoices', 500, 'SUPPLIER_INVOICES_FETCH_FAILED', error.message);
    }

    return apiSuccess({ invoices: data ?? [] });
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

    const parsed = await parseJsonBody(request, CreateSupplierInvoiceSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    if (parsed.data.purchase_order_id) {
        const { data: po, error: poError } = await db
            .from('purchase_orders')
            .select('id')
            .eq('restaurant_id', context.restaurantId)
            .eq('id', parsed.data.purchase_order_id)
            .maybeSingle();
        if (poError) {
            return apiError('Failed to validate purchase order', 500, 'PURCHASE_ORDER_VALIDATION_FAILED', poError.message);
        }
        if (!po) {
            return apiError('Purchase order not found', 404, 'PURCHASE_ORDER_NOT_FOUND');
        }
    }

    const subtotal = Number(parsed.data.subtotal.toFixed(2));
    const tax = Number(parsed.data.tax_amount.toFixed(2));
    const total = parsed.data.total_amount !== undefined
        ? Number(parsed.data.total_amount.toFixed(2))
        : Number((subtotal + tax).toFixed(2));

    const { data: invoice, error } = await db
        .from('supplier_invoices')
        .insert({
            restaurant_id: context.restaurantId,
            purchase_order_id: parsed.data.purchase_order_id ?? null,
            invoice_number: parsed.data.invoice_number?.trim().toUpperCase() || generateInvoiceNumber(),
            supplier_name: parsed.data.supplier_name,
            status: parsed.data.status,
            currency: parsed.data.currency.toUpperCase(),
            subtotal,
            tax_amount: tax,
            total_amount: total,
            issued_at: parsed.data.issued_at ?? null,
            due_at: parsed.data.due_at ?? null,
            paid_at: parsed.data.paid_at ?? null,
            notes: parsed.data.notes ?? null,
            metadata: (parsed.data.metadata ?? {}) as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create supplier invoice', 500, 'SUPPLIER_INVOICE_CREATE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'supplier_invoice_created',
        entity_type: 'supplier_invoice',
        entity_id: invoice.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            invoice_number: invoice.invoice_number,
            supplier_name: invoice.supplier_name,
            total_amount: invoice.total_amount,
            status: invoice.status,
        },
    });

    return apiSuccess({ invoice, idempotency_key: idempotencyKey }, 201);
}
