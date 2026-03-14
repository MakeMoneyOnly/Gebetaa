import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const PayoutStatusSchema = z.enum(['pending', 'in_transit', 'paid', 'failed', 'cancelled']);

const PayoutsQuerySchema = z.object({
    provider: z.string().trim().min(2).max(80).optional(),
    status: PayoutStatusSchema.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
});

const CreatePayoutSchema = z.object({
    provider: z.string().trim().min(2).max(80),
    channel: z.enum(['in_store', 'online', 'delivery', 'omni']).optional().default('omni'),
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
    // CRIT-02: All monetary values are now in SANTIM (integer)
    gross: z.number().int().min(0),
    fees: z.number().int().min(0).optional().default(0),
    adjustments: z.number().int().optional().default(0),
    net: z.number().int().optional(),
    currency: z.string().trim().length(3).optional().default('ETB'),
    status: PayoutStatusSchema.optional().default('pending'),
    paid_at: z.string().datetime().optional(),
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
        PayoutsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    let query = db
        .from('payouts')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('period_end', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.provider) {
        query = query.eq('provider', parsed.data.provider.trim().toLowerCase());
    }
    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }
    if (parsed.data.from) {
        query = query.gte('period_start', parsed.data.from);
    }
    if (parsed.data.to) {
        query = query.lte('period_end', parsed.data.to);
    }

    const { data, error } = await query;
    if (error) {
        return apiError('Failed to fetch payouts', 500, 'PAYOUTS_FETCH_FAILED', error.message);
    }

    const payouts = data ?? [];
    const totals = payouts.reduce(
        (acc, payout) => {
            acc.gross += Number(payout.gross ?? 0);
            acc.fees += Number(payout.fees ?? 0);
            acc.net += Number(payout.net ?? 0);
            if (payout.status === 'pending' || payout.status === 'in_transit') {
                acc.unsettled_count += 1;
            }
            return acc;
        },
        {
            gross: 0,
            fees: 0,
            net: 0,
            unsettled_count: 0,
        }
    );

    return apiSuccess({
        payouts,
        totals: {
            gross: Number(totals.gross.toFixed(2)),
            fees: Number(totals.fees.toFixed(2)),
            net: Number(totals.net.toFixed(2)),
            unsettled_count: totals.unsettled_count,
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

    const parsed = await parseJsonBody(request, CreatePayoutSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const periodStart = new Date(parsed.data.period_start);
    const periodEnd = new Date(parsed.data.period_end);
    if (periodEnd <= periodStart) {
        return apiError(
            'Payout period_end must be after period_start',
            400,
            'INVALID_PAYOUT_PERIOD'
        );
    }

    const gross = Number(parsed.data.gross.toFixed(2));
    const fees = Number(parsed.data.fees.toFixed(2));
    const adjustments = Number(parsed.data.adjustments.toFixed(2));
    const net =
        parsed.data.net !== undefined
            ? Number(parsed.data.net.toFixed(2))
            : Number((gross - fees + adjustments).toFixed(2));

    const db = context.supabase;
    const { data: payout, error } = await db
        .from('payouts')
        .insert({
            restaurant_id: context.restaurantId,
            provider: parsed.data.provider.trim().toLowerCase(),
            channel: parsed.data.channel,
            period_start: parsed.data.period_start,
            period_end: parsed.data.period_end,
            gross,
            fees,
            adjustments,
            net,
            currency: parsed.data.currency.toUpperCase(),
            status: parsed.data.status,
            paid_at: parsed.data.paid_at ?? null,
            metadata: (parsed.data.metadata ?? {}) as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create payout', 500, 'PAYOUT_CREATE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'payout_created',
        entity_type: 'payout',
        entity_id: payout.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            provider: payout.provider,
            period_start: payout.period_start,
            period_end: payout.period_end,
            net: payout.net,
            status: payout.status,
        },
    });

    return apiSuccess({ payout, idempotency_key: idempotencyKey }, 201);
}
