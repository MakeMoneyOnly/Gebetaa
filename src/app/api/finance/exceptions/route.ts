import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseQuery } from '@/lib/api/validation';

const ExceptionsQuerySchema = z.object({
    status: z.enum(['exception', 'investigating', 'resolved']).optional(),
    limit: z.coerce.number().int().min(1).max(300).optional().default(100),
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
        ExceptionsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    let query = db
        .from('reconciliation_entries')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .or('status.eq.exception,status.eq.investigating')
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        query = query.eq('status', parsed.data.status);
    }

    const { data, error } = await query;
    if (error) {
        return apiError(
            'Failed to fetch reconciliation exceptions',
            500,
            'FINANCE_EXCEPTIONS_FETCH_FAILED',
            error.message
        );
    }

    const rows = data ?? [];
    const summary = rows.reduce(
        (acc, row) => {
            const delta = Math.abs(Number(row.delta_amount ?? 0));
            acc.total_delta += delta;
            if (row.status === 'exception') {
                acc.exception_count += 1;
            }
            if (row.status === 'investigating') {
                acc.investigating_count += 1;
            }
            return acc;
        },
        {
            exception_count: 0,
            investigating_count: 0,
            total_delta: 0,
        }
    );

    return apiSuccess({
        exceptions: rows,
        summary: {
            exception_count: summary.exception_count,
            investigating_count: summary.investigating_count,
            total_delta: Number(summary.total_delta.toFixed(2)),
        },
    });
}
