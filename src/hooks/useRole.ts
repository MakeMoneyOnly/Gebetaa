import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types/models';
import { useRouter } from 'next/navigation';

export function useRole(restaurantId: string | null) {
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // DEV BYPASS: Allow testing without backend auth
        if (typeof window !== 'undefined' && localStorage.getItem('dev_bypass_auth') === 'true') {
            setRole('owner' as UserRole);
            setLoading(false);
            return;
        }

        if (!restaurantId) {
            setLoading(false);
            return;
        }

        async function fetchRole() {
            try {
                // 1. Get User
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    setRole(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }
                setUser(user);

                // 2. Get Role
                let query = supabase
                    .from('restaurant_staff')
                    .select('role, restaurant_id')
                    .eq('user_id', user.id);

                if (restaurantId) {
                    query = query.eq('restaurant_id', restaurantId);
                }

                const { data, error } = await query.maybeSingle();

                if (error) {
                    console.warn('Error fetching role:', error.message);
                    setRole(null);
                } else if (data) {
                    setRole(data.role as UserRole);
                    // If we didn't have a restaurantId, we could potentially return it here
                    // specific logic for multi-restaurant users would go here
                } else {
                    setRole(null);
                }
            } catch (err) {
                console.error('Error in useRole:', err);
                setRole(null);
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, [restaurantId, supabase]);

    const requireRole = (allowedRoles: UserRole[], redirectUrl = '/login') => {
        if (loading) return; // Don't redirect while loading
        if (!role || !allowedRoles.includes(role)) {
            router.push(redirectUrl);
        }
    };

    return { role, loading, user, requireRole };
}
