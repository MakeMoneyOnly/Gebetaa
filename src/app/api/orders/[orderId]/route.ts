import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

async function resolveRestaurantIdForUser(userId: string) {
    const supabase = await createClient();
    const { data: staffEntry, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    if (staffError) {
        return { error: staffError.message };
    }

    if (staffEntry?.restaurant_id) {
        return { restaurantId: staffEntry.restaurant_id };
    }

    const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('restaurant_ids')
        .eq('user_id', userId)
        .maybeSingle();

    if (agencyError) {
        return { error: agencyError.message };
    }

    return { restaurantId: agencyUser?.restaurant_ids?.[0] ?? null };
}

export async function GET(
    _request: Request,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await context.params;
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { restaurantId, error: restaurantError } = await resolveRestaurantIdForUser(user.id);
        if (restaurantError) {
            return apiError(
                'Failed to resolve restaurant context',
                500,
                'RESTAURANT_RESOLVE_FAILED',
                restaurantError
            );
        }
        if (!restaurantId) {
            return apiError('No restaurant found for user', 404, 'RESTAURANT_NOT_FOUND');
        }

        const pilotGateResponse = enforcePilotAccess(restaurantId);
        if (pilotGateResponse) {
            return pilotGateResponse;
        }

        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('id', orderId)
            .maybeSingle();

        if (error) {
            return apiError('Failed to fetch order', 500, 'ORDER_FETCH_FAILED', error.message);
        }
        if (!order) {
            return apiError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        const { data: events, error: eventsError } = await supabase
            .from('order_events')
            .select('id, event_type, from_status, to_status, created_at, actor_user_id, metadata')
            .eq('restaurant_id', restaurantId)
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (eventsError) {
            return apiError('Failed to fetch order events', 500, 'ORDER_EVENTS_FETCH_FAILED', eventsError.message);
        }

        return apiSuccess({
            order,
            events: events ?? [],
        });
    } catch (error) {
        return apiError(
            'Internal server error',
            500,
            'INTERNAL_ERROR',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
