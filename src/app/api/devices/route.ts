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

    // List all hardware devices for the restaurant
    const { data, error } = await context.supabase
        .from('hardware_devices')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: true });

    if (error) {
        return apiError('Failed to fetch devices', 500, 'DEVICES_FETCH_FAILED', error.message);
    }

    return apiSuccess({ devices: data ?? [] });
}
