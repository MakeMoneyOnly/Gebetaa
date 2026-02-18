import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';

const CreateTableSchema = z.object({
    table_number: z.string().trim().min(1).max(20),
    status: z.enum(['available', 'occupied', 'reserved', 'bill_requested']).optional().default('available'),
    capacity: z.number().int().positive().max(50).optional().default(4),
    zone: z.string().trim().max(50).optional().nullable(),
});

export async function GET() {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const { data, error } = await context.supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('table_number');

    if (error) {
        return apiError('Failed to fetch tables', 500, 'TABLES_FETCH_FAILED', error.message);
    }

    return apiSuccess({ tables: data ?? [] });
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, CreateTableSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const { data, error } = await context.supabase
        .from('tables')
        .insert({
            restaurant_id: context.restaurantId,
            table_number: parsed.data.table_number,
            status: parsed.data.status,
            capacity: parsed.data.capacity,
            zone: parsed.data.zone ?? null,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create table', 500, 'TABLE_CREATE_FAILED', error.message);
    }

    return apiSuccess(data, 201);
}
