import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseQuery } from '@/lib/api/validation';

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
