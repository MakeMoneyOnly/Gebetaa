import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api/response';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { ok: false as const, response: apiError('Unauthorized', 401, 'UNAUTHORIZED') };
    }

    return { ok: true as const, user, supabase };
}

export async function getAuthorizedRestaurantContext(userId: string) {
    const supabase = await createClient();

    const { data: staffEntry, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    if (staffError) {
        return {
            ok: false as const,
            response: apiError('Failed to resolve restaurant context', 500, 'RESTAURANT_RESOLVE_FAILED', staffError.message),
        };
    }

    if (staffEntry?.restaurant_id) {
        const pilotGateResponse = enforcePilotAccess(staffEntry.restaurant_id);
        if (pilotGateResponse) {
            return { ok: false as const, response: pilotGateResponse };
        }

        return { ok: true as const, restaurantId: staffEntry.restaurant_id, supabase };
    }

    const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('restaurant_ids')
        .eq('user_id', userId)
        .maybeSingle();

    if (agencyError) {
        return {
            ok: false as const,
            response: apiError('Failed to resolve restaurant context', 500, 'RESTAURANT_RESOLVE_FAILED', agencyError.message),
        };
    }

    const restaurantId = agencyUser?.restaurant_ids?.[0] ?? null;
    if (!restaurantId) {
        return {
            ok: false as const,
            response: apiError('No restaurant found for user', 404, 'RESTAURANT_NOT_FOUND'),
        };
    }

    const pilotGateResponse = enforcePilotAccess(restaurantId);
    if (pilotGateResponse) {
        return { ok: false as const, response: pilotGateResponse };
    }

    return { ok: true as const, restaurantId, supabase };
}
