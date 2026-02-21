import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET() {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    // Query the enriched view that joins restaurant_staff with auth.users
    // This gives us real email/name which requires service role access to auth.users
    let adminClient;
    try {
        adminClient = createServiceRoleClient();
    } catch (e) {
        console.error('Service Role Client Creation Failed:', e);
        // Fallback to regular client if service role fails, though data might be incomplete due to RLS
        return apiError(
            'Server configuration error: Missing Service Role Key',
            500,
            'CONFIG_ERROR'
        );
    }

    const { data, error } = await adminClient
        .from('restaurant_staff_with_users')
        .select(
            'id, user_id, role, is_active, created_at, email, name, pin_code, assigned_zones'
        )
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: true });

    if (error) {
        return apiError('Failed to fetch staff list', 500, 'STAFF_FETCH_FAILED', error.message);
    }

    return apiSuccess({ staff: data ?? [] });
}
