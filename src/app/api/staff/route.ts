import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';

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
        .from('restaurant_staff')
        .select('id, user_id, role, is_active, created_at')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: true });

    if (error) {
        return apiError('Failed to fetch staff list', 500, 'STAFF_FETCH_FAILED', error.message);
    }

    return apiSuccess({ staff: data ?? [] });
}
