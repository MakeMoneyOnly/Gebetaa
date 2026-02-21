import { randomBytes } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const RefundStatusSchema = z.enum(['pending', 'processed', 'failed', 'cancelled']);

const RefundsQuerySchema = z.object({
    status: RefundStatusSchema.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
});

const CreateRefundSchema = z.object({
    payment_id: z.string().uuid().optional(),
    payment_reference: z.string().trim().min(2).max(120).optional(),
    order_id: z.string().uuid().optional(),
    amount: z.coerce.number().min(0.01).max(100000000),
    reason: z.string().trim().min(3).max(280),
    status: RefundStatusSchema.optional().default('pending'),
    provider_reference: z.string().trim().min(2).max(120).optional(),
    processed_at: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(data => Boolean(data.payment_id || data.payment_reference), {
    message: 'Either payment_id or payment_reference is required',
    path: ['payment_reference'],
});

function generateRefundReference() {
    return `RF-${randomBytes(3).toString('hex').toUpperCase()}`;
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
        RefundsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    let query = db
        .from('refunds')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }
    if (parsed.data.from) {
        query = query.gte('created_at', parsed.data.from);
    }
    if (parsed.data.to) {
        query = query.lte('created_at', parsed.data.to);
    }

    const { data, error } = await query;
    if (error) {
        return apiError('Failed to fetch refunds', 500, 'REFUNDS_FETCH_FAILED', error.message);
    }

    const refunds = data ?? [];
    const totals = refunds.reduce(
        (acc, refund) => {
            const amount = Number(refund.amount ?? 0);
            acc.total_amount += amount;
            if (refund.status === 'pending') {
                acc.pending_amount += amount;
                acc.pending_count += 1;
            }
            if (refund.status === 'processed') {
                acc.processed_amount += amount;
                acc.processed_count += 1;
            }
            return acc;
        },
        {
            total_amount: 0,
            pending_amount: 0,
            pending_count: 0,
            processed_amount: 0,
            processed_count: 0,
        }
    );

    return apiSuccess({
        refunds,
        totals: {
            total_amount: Number(totals.total_amount.toFixed(2)),
            pending_amount: Number(totals.pending_amount.toFixed(2)),
            pending_count: totals.pending_count,
            processed_amount: Number(totals.processed_amount.toFixed(2)),
            processed_count: totals.processed_count,
        },
    });
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

    const parsed = await parseJsonBody(request, CreateRefundSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    const amount = Number(parsed.data.amount.toFixed(2));

    const paymentReference = parsed.data.payment_id ?? parsed.data.payment_reference?.trim();
    if (!paymentReference) {
        return apiError(
            'Either payment_id or payment_reference is required',
            400,
            'PAYMENT_REFERENCE_REQUIRED'
        );
    }
    const referenceIsUuid = Boolean(
        paymentReference && z.string().uuid().safeParse(paymentReference).success
    );

    let paymentQuery = db
        .from('payments')
        .select('id, amount, status, provider_reference')
        .eq('restaurant_id', context.restaurantId);

    paymentQuery = referenceIsUuid
        ? paymentQuery.eq('id', paymentReference)
        : paymentQuery.eq('provider_reference', paymentReference);

    const { data: payment, error: paymentError } = await paymentQuery.maybeSingle();

    if (paymentError) {
        return apiError(
            'Failed to verify payment',
            500,
            'REFUND_PAYMENT_LOOKUP_FAILED',
            paymentError.message
        );
    }
    if (!payment) {
        return apiError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }
    if (payment.status === 'failed' || payment.status === 'voided') {
        return apiError('Payment is not refundable', 409, 'PAYMENT_NOT_REFUNDABLE');
    }

    const { data: existingRefunds, error: existingRefundsError } = await db
        .from('refunds')
        .select('amount, status')
        .eq('restaurant_id', context.restaurantId)
        .eq('payment_id', payment.id);

    if (existingRefundsError) {
        return apiError(
            'Failed to verify refundable balance',
            500,
            'REFUND_BALANCE_LOOKUP_FAILED',
            existingRefundsError.message
        );
    }

    const reservedAmount = (existingRefunds ?? []).reduce((acc, refund) => {
        if (refund.status === 'failed' || refund.status === 'cancelled') {
            return acc;
        }
        return acc + Number(refund.amount ?? 0);
    }, 0);
    const maxRefundable = Number(payment.amount ?? 0) - reservedAmount;
    if (amount > maxRefundable + 0.00001) {
        return apiError('Refund exceeds available payment balance', 409, 'REFUND_EXCEEDS_PAYMENT');
    }

    const providerReference = parsed.data.provider_reference ?? generateRefundReference();
    const { data: refund, error } = await db
        .from('refunds')
        .insert({
            restaurant_id: context.restaurantId,
            payment_id: payment.id,
            order_id: parsed.data.order_id ?? null,
            amount,
            reason: parsed.data.reason,
            status: parsed.data.status,
            provider_reference: providerReference,
            processed_at: parsed.data.processed_at ?? null,
            metadata: (parsed.data.metadata ?? {}) as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create refund', 500, 'REFUND_CREATE_FAILED', error.message);
    }

    const refreshedRefundedAmount = reservedAmount + amount;
    const nextPaymentStatus =
        refreshedRefundedAmount >= Number(payment.amount ?? 0) ? 'refunded' : 'partially_refunded';
    await db.from('payments').update({ status: nextPaymentStatus }).eq('id', payment.id);

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'refund_created',
        entity_type: 'refund',
        entity_id: refund.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            payment_id: refund.payment_id,
            amount: refund.amount,
            status: refund.status,
            reason: refund.reason,
        },
    });

    return apiSuccess({ refund, idempotency_key: idempotencyKey }, 201);
}
