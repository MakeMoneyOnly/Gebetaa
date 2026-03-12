import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
    getAuthenticatedUser,
    getAuthorizedRestaurantContext,
    getDeviceContext,
} from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';
import { ensurePaymentSessionForRecordedPayment } from '@/lib/payments/payment-sessions';

const PaymentMethodSchema = z.enum([
    'cash',
    'card',
    'chapa',
    'gift_card',
    'bank_transfer',
    'other',
]);

const PaymentStatusSchema = z.enum([
    'pending',
    'authorized',
    'captured',
    'failed',
    'voided',
    'partially_refunded',
    'refunded',
]);

const PaymentsQuerySchema = z.object({
    method: PaymentMethodSchema.optional(),
    status: PaymentStatusSchema.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
});

const CreatePaymentSchema = z.object({
    order_id: z.string().uuid().optional(),
    split_id: z.string().uuid().optional(),
    method: PaymentMethodSchema,
    provider: z.string().trim().min(2).max(80).optional().default('internal'),
    provider_reference: z.string().trim().min(2).max(120).optional(),
    // CRIT-02: amount is now in SANTIM (integer), not birr
    amount: z.number().int().min(1, 'Amount must be at least 1 santim').max(1000000000),
    // CRIT-02: tip_amount is now in SANTIM (integer)
    tip_amount: z.number().int().min(0).max(1000000000).optional().default(0),
    currency: z.string().trim().length(3).optional().default('ETB'),
    status: PaymentStatusSchema.optional().default('captured'),
    authorized_at: z.string().datetime().optional(),
    captured_at: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

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
        PaymentsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    let query = db
        .from('payments')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.method) {
        query = query.eq('method', parsed.data.method);
    }
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
        return apiError('Failed to fetch payments', 500, 'PAYMENTS_FETCH_FAILED', error.message);
    }

    const payments = data ?? [];
    const totals = payments.reduce(
        (acc, payment) => {
            const amount = Number(payment.amount ?? 0);
            const tip = Number(payment.tip_amount ?? 0);
            acc.gross += amount;
            acc.tips += tip;
            acc.net += amount + tip;
            if (payment.status === 'captured') {
                acc.captured_count += 1;
            }
            if (payment.status === 'failed') {
                acc.failed_count += 1;
            }
            return acc;
        },
        {
            gross: 0,
            tips: 0,
            net: 0,
            captured_count: 0,
            failed_count: 0,
        }
    );

    return apiSuccess({
        payments,
        totals: {
            gross: Number(totals.gross.toFixed(2)),
            tips: Number(totals.tips.toFixed(2)),
            net: Number(totals.net.toFixed(2)),
            captured_count: totals.captured_count,
            failed_count: totals.failed_count,
        },
    });
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    let actorUserId: string | null = null;
    let restaurantId: string;
    let db: any;
    let paymentSurface: 'waiter_pos' | 'terminal' = 'waiter_pos';

    if (auth.ok) {
        const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
        if (!context.ok) {
            return context.response;
        }
        actorUserId = auth.user.id;
        restaurantId = context.restaurantId;
        db = context.supabase;
    } else {
        const deviceContext = await getDeviceContext(request);
        if (!deviceContext.ok) {
            return auth.response;
        }
        restaurantId = deviceContext.restaurantId;
        db = deviceContext.admin;
        paymentSurface =
            deviceContext.device.device_type === 'terminal' ? 'terminal' : 'waiter_pos';
    }

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, CreatePaymentSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const dbAny = db as any;
    const amount = Number(parsed.data.amount.toFixed(2));
    const tipAmount = Number(parsed.data.tip_amount.toFixed(2));
    let resolvedOrderId = parsed.data.order_id ?? null;
    let paymentChannel: 'dine_in' | 'pickup' | 'delivery' | 'online' = 'dine_in';

    if (parsed.data.split_id) {
        const { data: split, error: splitError } = await dbAny
            .from('order_check_splits')
            .select('id, order_id, status')
            .eq('restaurant_id', restaurantId)
            .eq('id', parsed.data.split_id)
            .maybeSingle();

        if (splitError) {
            return apiError(
                'Failed to validate payment split',
                500,
                'PAYMENT_SPLIT_FETCH_FAILED',
                splitError.message
            );
        }
        if (!split) {
            return apiError('Split not found', 404, 'PAYMENT_SPLIT_NOT_FOUND');
        }
        if (split.status !== 'open') {
            return apiError('Split is not open for payment', 409, 'PAYMENT_SPLIT_NOT_OPEN');
        }
        if (resolvedOrderId && resolvedOrderId !== split.order_id) {
            return apiError(
                'Split does not belong to provided order',
                409,
                'PAYMENT_SPLIT_ORDER_MISMATCH'
            );
        }
        resolvedOrderId = split.order_id;
    }

    if (resolvedOrderId) {
        const { data: orderForPayment } = await dbAny
            .from('orders')
            .select('order_type')
            .eq('restaurant_id', restaurantId)
            .eq('id', resolvedOrderId)
            .maybeSingle();

        const orderType = String(orderForPayment?.order_type ?? 'dine_in');
        paymentChannel =
            orderType === 'delivery'
                ? 'delivery'
                : orderType === 'pickup'
                  ? 'pickup'
                  : orderType === 'online'
                    ? 'online'
                    : 'dine_in';
    }

    const paymentSession = await ensurePaymentSessionForRecordedPayment(dbAny, {
        restaurantId,
        orderId: resolvedOrderId,
        surface: paymentSurface,
        channel: paymentChannel,
        method: parsed.data.method,
        provider: parsed.data.provider.trim().toLowerCase(),
        amount,
        status: parsed.data.status,
        metadata: {
            ...(parsed.data.metadata ?? {}),
            source: auth.ok ? 'merchant_dashboard' : paymentSurface,
            split_id: parsed.data.split_id ?? null,
        } as Json,
    });

    const { data: payment, error } = await dbAny
        .from('payments')
        .insert({
            restaurant_id: restaurantId,
            // when split_id exists, order_id is forced to the split's order
            order_id: resolvedOrderId,
            payment_session_id: paymentSession.id,
            split_id: parsed.data.split_id ?? null,
            method: parsed.data.method,
            provider: parsed.data.provider.trim().toLowerCase(),
            provider_reference: parsed.data.provider_reference?.trim() ?? null,
            amount,
            tip_amount: tipAmount,
            currency: parsed.data.currency.toUpperCase(),
            status: parsed.data.status,
            authorized_at: parsed.data.authorized_at ?? null,
            captured_at: parsed.data.captured_at ?? null,
            metadata: {
                ...(parsed.data.metadata ?? {}),
                payment_session_id: paymentSession.id,
            } as Json,
            created_by: actorUserId,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create payment', 500, 'PAYMENT_CREATE_FAILED', error.message);
    }

    await writeAuditLog(db, {
        restaurant_id: restaurantId,
        user_id: actorUserId,
        action: 'payment_created',
        entity_type: 'payment',
        entity_id: payment.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
            split_id: parsed.data.split_id ?? null,
            payment_session_id: paymentSession.id,
        },
        new_value: {
            method: payment.method,
            provider: payment.provider,
            amount: payment.amount,
            status: payment.status,
            split_id: (payment as { split_id?: string | null }).split_id ?? null,
        },
    });

    return apiSuccess({ payment, idempotency_key: idempotencyKey }, 201);
}
