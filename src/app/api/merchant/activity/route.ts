import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

export async function GET(request: Request) {
    try {
        console.log('[API] Starting merchant activity fetch...');
        const supabase = await createClient();

        // Get the current user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        console.log('[API] User check:', {
            hasUser: !!user,
            userId: user?.id,
            userError: userError?.message,
        });

        if (userError || !user) {
            console.log('[API] No user found, returning 401');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the user's restaurant ID
        const { data: staffEntry, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        console.log('[API] Staff lookup:', {
            staffEntry,
            staffError: staffError?.message,
        });

        let restaurantId = staffEntry?.restaurant_id;

        // Fallback to agency_users
        if (!restaurantId) {
            const { data: agencyUser, error: agencyError } = await supabase
                .from('agency_users')
                .select('restaurant_ids')
                .eq('user_id', user.id)
                .maybeSingle();

            console.log('[API] Agency lookup:', {
                agencyUser,
                agencyError: agencyError?.message,
            });

            if (agencyUser?.restaurant_ids?.[0]) {
                restaurantId = agencyUser.restaurant_ids[0];
            }
        }

        console.log('[API] Final restaurant ID:', restaurantId);

        if (!restaurantId) {
            console.log('[API] No restaurant found for user');
            return NextResponse.json({ error: 'No restaurant found for user' }, { status: 404 });
        }

        const pilotGateResponse = enforcePilotAccess(restaurantId, request.method);
        if (pilotGateResponse) {
            return pilotGateResponse;
        }

        // Fetch orders
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(20);

        console.log('[API] Orders fetch:', {
            count: orders?.length || 0,
            error: orderError?.message,
        });

        // Fetch service requests
        const { data: requests, error: requestError } = await supabase
            .from('service_requests')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(20);

        console.log('[API] Requests fetch:', {
            count: requests?.length || 0,
            error: requestError?.message,
        });

        // Get restaurant info
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name, slug')
            .eq('id', restaurantId)
            .single();

        console.log('[API] Restaurant info:', restaurant);

        const response = {
            orders: orders || [],
            requests: requests || [],
            restaurant: restaurant || { name: 'Restaurant', slug: 'restaurant' },
            restaurantId,
            errors: {
                orders: orderError?.message,
                requests: requestError?.message,
            },
        };

        console.log('[API] Returning response with:', {
            orderCount: response.orders.length,
            requestCount: response.requests.length,
            restaurantName: response.restaurant.name,
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('[API] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
