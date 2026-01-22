import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgencySetupClient } from './AgencySetupClient';
import type { Restaurant } from '@/types/database';

export default async function AgencyAdminSetup() {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/agency-admin/login');
    }

    // Check if user is an agency admin
    const { data: agencyUser, error: roleError } = await supabase
        .from('agency_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agencyUserData = agencyUser as any;

    if (roleError || !agencyUserData || !['admin', 'manager'].includes(agencyUserData.role)) {
        redirect('/agency-admin/unauthorized');
    }

    // Fetch all restaurants (for admin) or specific ones (for manager)
    let restaurants: Restaurant[] = [];
    if (agencyUserData.role === 'admin') {
        const { data } = await supabase.from('restaurants').select('*').order('name');
        restaurants = (data || []) as Restaurant[];
    } else {
        const { data } = await supabase
            .from('restaurants')
            .select('*')
            .in('id', agencyUserData.restaurant_ids || [])
            .order('name');
        restaurants = (data || []) as Restaurant[];
    }

    return (
        <AgencySetupClient
            restaurants={restaurants}
            isAdmin={agencyUserData.role === 'admin'}
        />
    );
}
