import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type AgencyUser = Database['public']['Tables']['agency_users']['Row'];

interface AuthResult {
    user: {
        id: string;
        email: string;
    };
    agencyUser: AgencyUser | null;
}

/**
 * Require authentication for a server component
 * Redirects to login if not authenticated
 */
export async function requireAuth(redirectTo: string = '/agency-admin/login'): Promise<AuthResult> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect(redirectTo);
    }

    // Check if user is an agency user
    const { data: agencyUser } = await supabase
        .from('agency_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return {
        user: {
            id: user.id,
            email: user.email || '',
        },
        agencyUser: agencyUser || null,
    };
}

/**
 * Require admin role for a server component
 * Redirects to unauthorized if not an admin
 */
export async function requireAdmin(): Promise<AuthResult> {
    const auth = await requireAuth();

    if (!auth.agencyUser || auth.agencyUser.role !== 'admin') {
        redirect('/agency-admin/unauthorized');
    }

    return auth;
}

/**
 * Require admin or manager role for a server component
 * Redirects to unauthorized if not admin or manager
 */
export async function requireAdminOrManager(): Promise<AuthResult> {
    const auth = await requireAuth();

    if (!auth.agencyUser || !auth.agencyUser.role || !['admin', 'manager'].includes(auth.agencyUser.role)) {
        redirect('/agency-admin/unauthorized');
    }

    return auth;
}

/**
 * Require access to a specific restaurant
 * Redirects to unauthorized if user doesn't have access
 */
export async function requireRestaurantAccess(restaurantId: string): Promise<AuthResult> {
    const auth = await requireAuth();

    // Admin has access to all restaurants
    if (auth.agencyUser?.role === 'admin') {
        return auth;
    }

    // Manager/staff only have access to their assigned restaurants
    if (!auth.agencyUser?.restaurant_ids || !auth.agencyUser.restaurant_ids.includes(restaurantId)) {
        redirect('/agency-admin/unauthorized');
    }

    return auth;
}
