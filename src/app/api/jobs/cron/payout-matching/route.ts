/**
 * POST /api/jobs/cron/payout-matching
 *
 * Cron job handler for matching payments to payouts.
 * Runs to:
 * - Match payments with expected payouts by period
 * - Create reconciliation entries for discrepancies
 * - Flag unmatched or under/over payments for review
 *
 * Scheduled via QStash CRON to run daily (can be configured)
 * Can also be triggered manually or for specific payouts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const PayoutMatchingJobSchema = z.object({
    restaurant_id: z.string().uuid().optional(),
    payout_id: z.string().uuid().optional(),
    trigger: z.enum(['cron', 'manual']).default('cron'),
});

function isAuthorized(request: NextRequest): boolean {
    const configuredKey = process.env.QSTASH_TOKEN;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }
    return request.headers.get('x-gebeta-job-key') === configuredKey;
}

interface PayoutMatchResult {
    payoutId: string;
    restaurantId: string;
    status: 'success' | 'failed' | 'skipped';
    matchedAmount?: number;
    delta?: number;
    matchStatus?: string;
    error?: string;
}

async function runPayoutMatchingForRestaurant(
    restaurantId: string,
    payoutId?: string
): Promise<PayoutMatchResult[]> {
    const admin = createServiceRoleClient();
    const results: PayoutMatchResult[] = [];

    try {
        // Call the database function to match payments to payouts
        const { data: matches, error: matchError } = await admin.rpc('match_payments_to_payouts', {
            p_restaurant_id: restaurantId,
            p_payout_id: payoutId,
        });

        if (matchError) {
            console.error(`[PayoutMatching] RPC error for restaurant ${restaurantId}:`, matchError);

            // If payout_id was specified, return error result
            if (payoutId) {
                return [
                    {
                        payoutId,
                        restaurantId,
                        status: 'failed',
                        error: matchError.message,
                    },
                ];
            }
            return [];
        }

        // If matches returned, format results
        if (matches && matches.length > 0) {
            for (const match of matches) {
                results.push({
                    payoutId: match.payout_id,
                    restaurantId,
                    status: 'success',
                    matchedAmount: Number(match.matched_amount) || 0,
                    matchStatus: match.status,
                });
            }
        } else if (!payoutId) {
            // No pending payouts for restaurant - not an error, just skip
            console.log(`[PayoutMatching] No pending payouts for restaurant ${restaurantId}`);
        }

        return results;
    } catch (error) {
        console.error(`[PayoutMatching] Exception for restaurant ${restaurantId}:`, error);

        if (payoutId) {
            return [
                {
                    payoutId,
                    restaurantId,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            ];
        }
        return [];
    }
}

async function getActiveRestaurants(): Promise<string[]> {
    const admin = createServiceRoleClient();

    const { data, error } = await admin.from('restaurants').select('id').eq('status', 'active');

    if (error) {
        console.error('[PayoutMatching] Failed to fetch restaurants:', error);
        return [];
    }

    return data?.map(r => r.id) || [];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                error: {
                    code: 'UNAUTHORIZED_JOB',
                    message: 'Job request is not authorized',
                },
            },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = PayoutMatchingJobSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: {
                    code: 'INVALID_JOB_PAYLOAD',
                    message: 'Invalid payout matching payload',
                    details: parsed.error.flatten(),
                },
            },
            { status: 400 }
        );
    }

    const { restaurant_id, payout_id, trigger } = parsed.data;
    const results: PayoutMatchResult[] = [];

    // If payout_id is specified, only match that specific payout
    if (payout_id) {
        if (!restaurant_id) {
            return NextResponse.json(
                {
                    error: {
                        code: 'MISSING_REQUIRED_FIELD',
                        message: 'restaurant_id is required when payout_id is specified',
                    },
                },
                { status: 400 }
            );
        }

        const payoutResults = await runPayoutMatchingForRestaurant(restaurant_id, payout_id);
        results.push(...payoutResults);
    }
    // If restaurant_id is specified, process all pending payouts for that restaurant
    else if (restaurant_id) {
        const payoutResults = await runPayoutMatchingForRestaurant(restaurant_id);
        results.push(...payoutResults);
    }
    // For cron, process all pending payouts for all active restaurants
    else if (trigger === 'cron') {
        const targetRestaurants = await getActiveRestaurants();
        console.log(`[PayoutMatching] Processing ${targetRestaurants.length} restaurants`);

        for (const rid of targetRestaurants) {
            const payoutResults = await runPayoutMatchingForRestaurant(rid);
            results.push(...payoutResults);
        }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    // Get summary of exceptions
    const exceptions = results.filter(r => r.matchStatus === 'exception');
    const matched = results.filter(r => r.matchStatus === 'matched');

    return NextResponse.json({
        data: {
            trigger,
            total_payouts: results.length,
            success_count: successCount,
            failed_count: failedCount,
            skipped_count: skippedCount,
            matched_count: matched.length,
            exception_count: exceptions.length,
            results: results.map(r => ({
                payout_id: r.payoutId,
                restaurant_id: r.restaurantId,
                status: r.status,
                matched_amount: r.matchedAmount,
                match_status: r.matchStatus,
                error: r.error,
            })),
        },
    });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    // Allow manual trigger via GET for testing
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                error: {
                    code: 'UNAUTHORIZED_JOB',
                    message: 'Job request is not authorized',
                },
            },
            { status: 401 }
        );
    }

    // If payout_id provided, return status for that payout
    const url = new URL(request.url);
    const payoutId = url.searchParams.get('payout_id');
    const restaurantId = url.searchParams.get('restaurant_id');

    if (payoutId && restaurantId) {
        const admin = createServiceRoleClient();

        const { data: payout, error } = await admin
            .from('payouts')
            .select('*, reconciliation_entries(*)')
            .eq('id', payoutId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();

        if (error) {
            return NextResponse.json(
                {
                    error: {
                        code: 'FETCH_FAILED',
                        message: error.message,
                    },
                },
                { status: 500 }
            );
        }

        if (!payout) {
            return NextResponse.json(
                {
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Payout not found',
                    },
                },
                { status: 404 }
            );
        }

        const reconciliationStatus = payout.reconciliation_entries?.[0]?.status || 'unreconciled';

        return NextResponse.json({
            data: {
                payout: {
                    id: payout.id,
                    period_start: payout.period_start,
                    period_end: payout.period_end,
                    gross: payout.gross,
                    fees: payout.fees,
                    net: payout.net,
                    status: payout.status,
                    paid_at: payout.paid_at,
                },
                reconciliation_status: reconciliationStatus,
            },
        });
    }

    return NextResponse.json({
        message: 'Payout matching job endpoint. Use POST to trigger.',
        supports: {
            triggers: ['cron', 'manual'],
            parameters: ['restaurant_id', 'payout_id'],
        },
        example: {
            cron: { trigger: 'cron' },
            specific_restaurant: { restaurant_id: 'uuid', trigger: 'manual' },
            specific_payout: { restaurant_id: 'uuid', payout_id: 'uuid', trigger: 'manual' },
        },
    });
}
