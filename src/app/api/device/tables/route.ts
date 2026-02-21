/**
 * GET /api/device/tables
 * Device-authenticated endpoint for POS/KDS to fetch tables.
 * Requires X-Device-Token header (set after pairing).
 * No Supabase auth session needed.
 */
import { apiError, apiSuccess } from '@/lib/api/response';
import { getDeviceContext } from '@/lib/api/authz';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: Request) {
    const ctx = await getDeviceContext(request);
    if (!ctx.ok) return ctx.response;

    const admin = createServiceRoleClient();

    const { data, error } = await admin
        .from('tables')
        .select('*')
        .eq('restaurant_id', ctx.restaurantId)
        .order('table_number');

    if (error) {
        return apiError('Failed to fetch tables', 500, 'TABLES_FETCH_FAILED', error.message);
    }

    return apiSuccess({ tables: data ?? [] });
}
