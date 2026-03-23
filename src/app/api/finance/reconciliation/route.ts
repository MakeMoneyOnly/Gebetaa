import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseQuery } from '@/lib/api/validation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const ReconciliationQuerySchema = z.object({
    status: z.enum(['matched', 'exception', 'investigating', 'resolved']).optional(),
    source_type: z.enum(['payment', 'refund', 'payout', 'adjustment']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(400).optional().default(200),
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
        ReconciliationQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    let query = db
        .from('reconciliation_entries')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }
    if (parsed.data.source_type) {
        query = query.eq('source_type', parsed.data.source_type);
    }
    if (parsed.data.from) {
        query = query.gte('created_at', parsed.data.from);
    }
    if (parsed.data.to) {
        query = query.lte('created_at', parsed.data.to);
    }

    const { data, error } = await query;
    if (error) {
        return apiError(
            'Failed to fetch reconciliation entries',
            500,
            'RECONCILIATION_FETCH_FAILED',
            error.message
        );
    }

    const rows = data ?? [];
    const summary = rows.reduce(
        (acc, row) => {
            const expected = Number(row.expected_amount ?? 0);
            const settled = Number(row.settled_amount ?? 0);
            const delta = Number(row.delta_amount ?? 0);

            acc.expected_total += expected;
            acc.settled_total += settled;
            acc.delta_total += delta;

            if (row.status === 'matched') {
                acc.matched_count += 1;
            } else if (row.status === 'resolved') {
                acc.resolved_count += 1;
            } else {
                acc.open_count += 1;
            }

            return acc;
        },
        {
            expected_total: 0,
            settled_total: 0,
            delta_total: 0,
            matched_count: 0,
            resolved_count: 0,
            open_count: 0,
        }
    );

    return apiSuccess({
        entries: rows,
        summary: {
            expected_total: Number(summary.expected_total.toFixed(2)),
            settled_total: Number(summary.settled_total.toFixed(2)),
            delta_total: Number(summary.delta_total.toFixed(2)),
            matched_count: summary.matched_count,
            resolved_count: summary.resolved_count,
            open_count: summary.open_count,
        },
    });
}

// POST handler for triggering manual reconciliation
const TriggerReconciliationSchema = z.object({
    reconciliation_date: z.string().optional(), // YYYY-MM-DD format
    run_daily: z.boolean().optional().default(false),
    run_payout_matching: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const body = await request.json().catch(() => null);
    const parsed = TriggerReconciliationSchema.safeParse(body);

    if (!parsed.success) {
        return apiError(
            'Invalid reconciliation request',
            400,
            'INVALID_REQUEST',
            parsed.error.flatten().toString()
        );
    }

    const { reconciliation_date, run_daily, run_payout_matching } = parsed.data;
    const targetDate =
        reconciliation_date || new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const admin = createServiceRoleClient();
    const results: { daily: any; payout_matching: any } = { daily: null, payout_matching: null };

    // Run daily reconciliation if requested
    if (run_daily) {
        try {
            const { data, error } = await admin.rpc('reconcile_daily_payments', {
                p_restaurant_id: context.restaurantId,
                p_reconciliation_date: targetDate,
            });

            results.daily = { success: !error, error: error?.message, data };
        } catch (err) {
            results.daily = {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            };
        }
    }

    // Run payout matching if requested
    if (run_payout_matching) {
        try {
            const { data, error } = await admin.rpc('match_payments_to_payouts', {
                p_restaurant_id: context.restaurantId,
                p_payout_id: null,
            });

            results.payout_matching = { success: !error, error: error?.message, data };
        } catch (err) {
            results.payout_matching = {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            };
        }
    }

    // If no specific action requested, run both
    if (!run_daily && !run_payout_matching) {
        try {
            const { data: dailyData, error: dailyError } = await admin.rpc(
                'reconcile_daily_payments',
                {
                    p_restaurant_id: context.restaurantId,
                    p_reconciliation_date: targetDate,
                }
            );
            results.daily = { success: !dailyError, error: dailyError?.message, data: dailyData };

            const { data: payoutData, error: payoutError } = await admin.rpc(
                'match_payments_to_payouts',
                {
                    p_restaurant_id: context.restaurantId,
                    p_payout_id: null,
                }
            );
            results.payout_matching = {
                success: !payoutError,
                error: payoutError?.message,
                data: payoutData,
            };
        } catch (err) {
            return apiError(
                'Reconciliation failed',
                500,
                'RECONCILIATION_FAILED',
                err instanceof Error ? err.message : 'Unknown error'
            );
        }
    }

    return apiSuccess({
        reconciliation_date: targetDate,
        restaurant_id: context.restaurantId,
        results,
    });
}
