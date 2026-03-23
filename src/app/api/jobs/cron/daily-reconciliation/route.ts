/**
 * POST /api/jobs/cron/daily-reconciliation
 *
 * Cron job handler for daily payment reconciliation.
 * Runs at end of business day to:
 * - Group payments by day/provider
 * - Compare with expected payout amounts
 * - Create reconciliation_entries for discrepancies
 * - Flag unmatched payments for manual review
 *
 * Scheduled via QStash CRON to run daily at 10PM Addis Ababa time (19:00 UTC)
 * Can also be triggered manually.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const DailyReconciliationJobSchema = z.object({
    restaurant_id: z.string().uuid().optional(),
    reconciliation_date: z.string().optional(), // YYYY-MM-DD format
    trigger: z.enum(['cron', 'manual']).default('cron'),
});

function isAuthorized(request: NextRequest): boolean {
    const configuredKey = process.env.QSTASH_TOKEN;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }
    return request.headers.get('x-gebeta-job-key') === configuredKey;
}

interface ReconciliationResult {
    restaurantId: string;
    status: 'success' | 'failed';
    entriesCreated?: number;
    error?: string;
}

async function runReconciliationForRestaurant(
    restaurantId: string,
    reconciliationDate: string
): Promise<ReconciliationResult> {
    const admin = createServiceRoleClient();

    try {
        // Call the database function to perform daily reconciliation
        const { data: entries, error: reconcileError } = await admin.rpc(
            'reconcile_daily_payments',
            {
                p_restaurant_id: restaurantId,
                p_reconciliation_date: reconciliationDate,
            }
        );

        if (reconcileError) {
            console.error(
                `[DailyReconciliation] RPC error for restaurant ${restaurantId}:`,
                reconcileError
            );
            return {
                restaurantId,
                status: 'failed',
                error: reconcileError.message,
            };
        }

        // Get the count of reconciliation entries created
        const { count, error: countError } = await admin
            .from('reconciliation_entries')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .gte('created_at', `${reconciliationDate}T00:00:00.000Z`)
            .lt('created_at', `${reconciliationDate}T23:59:59.999Z`);

        if (countError) {
            console.error(
                `[DailyReconciliation] Count error for restaurant ${restaurantId}:`,
                countError
            );
            return {
                restaurantId,
                status: 'failed',
                error: countError.message,
            };
        }

        return {
            restaurantId,
            status: 'success',
            entriesCreated: count || 0,
        };
    } catch (error) {
        console.error(`[DailyReconciliation] Exception for restaurant ${restaurantId}:`, error);
        return {
            restaurantId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function getActiveRestaurants(): Promise<string[]> {
    const admin = createServiceRoleClient();

    const { data, error } = await admin.from('restaurants').select('id').eq('status', 'active');

    if (error) {
        console.error('[DailyReconciliation] Failed to fetch restaurants:', error);
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
    const parsed = DailyReconciliationJobSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: {
                    code: 'INVALID_JOB_PAYLOAD',
                    message: 'Invalid daily reconciliation payload',
                    details: parsed.error.flatten(),
                },
            },
            { status: 400 }
        );
    }

    const { restaurant_id, reconciliation_date, trigger } = parsed.data;
    const targetDate =
        reconciliation_date || new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const results: ReconciliationResult[] = [];
    let targetRestaurants: string[] = [];

    if (restaurant_id) {
        targetRestaurants = [restaurant_id];
    } else if (trigger === 'cron') {
        // For cron, reconcile all active restaurants
        targetRestaurants = await getActiveRestaurants();
    }

    console.log(
        `[DailyReconciliation] Processing ${targetRestaurants.length} restaurants for date ${targetDate}`
    );

    for (const rid of targetRestaurants) {
        const result = await runReconciliationForRestaurant(rid, targetDate);
        results.push(result);

        if (result.status === 'success') {
            console.log(
                `[DailyReconciliation] Restaurant ${rid}: ${result.entriesCreated} entries created`
            );
        } else {
            console.error(`[DailyReconciliation] Restaurant ${rid}: ${result.error}`);
        }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const totalEntries = results.reduce((sum, r) => sum + (r.entriesCreated || 0), 0);

    return NextResponse.json({
        data: {
            reconciliation_date: targetDate,
            trigger,
            total_restaurants: targetRestaurants.length,
            success_count: successCount,
            failed_count: results.length - successCount,
            total_entries_created: totalEntries,
            results,
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

    return NextResponse.json({
        message: 'Daily reconciliation job endpoint. Use POST to trigger.',
        supports: {
            triggers: ['cron', 'manual'],
            parameters: ['restaurant_id', 'reconciliation_date'],
        },
    });
}
