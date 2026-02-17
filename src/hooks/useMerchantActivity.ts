'use client';

import { useEffect, useState } from 'react';

export type ActivityType = 'order' | 'kitchen' | 'staff' | 'request';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    user: string;
    action: string;
    target: string;
    time: string;
    timestamp: Date;
    avatar?: string;
    message?: string;
    hasMessage?: boolean;
    hasFile?: boolean;
    fileName?: string;
    fileSize?: string;
}

export function useMerchantActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState<string>('Restaurant');
    const [restaurantHandle, setRestaurantHandle] = useState<string>('@restaurant_admin');

    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            try {
                if (!mounted) return;
                setLoading(true);

                console.log('[Hook] Fetching merchant activity...');
                const response = await fetch('/api/merchant/activity');

                console.log('[Hook] Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[Hook] API error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('[Hook] Received data:', {
                    orderCount: data.orders?.length || 0,
                    requestCount: data.requests?.length || 0,
                    restaurant: data.restaurant
                });

                if (!mounted) return;

                // Set restaurant info
                if (data.restaurant) {
                    setRestaurantName(data.restaurant.name);
                    setRestaurantHandle(`@${data.restaurant.slug}_admin`);
                }

                // Transform orders to activities
                const orderActivities: ActivityItem[] = (data.orders || []).map((order: any) => ({
                    id: `order-${order.id}`,
                    type: 'order' as ActivityType,
                    user: `Order ${order.order_number?.startsWith('ORD-') ? order.order_number.split('-').slice(1).join('-') : `#${order.order_number}`}`,
                    action: 'placed for',
                    target: `Table ${order.table_number}`,
                    time: new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                    timestamp: new Date(order.created_at),
                    hasMessage: !!order.notes,
                    message: order.notes ? `Note: '${order.notes}'` : undefined,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Order${order.id}`
                }));

                // Transform requests to activities
                const requestActivities: ActivityItem[] = (data.requests || []).map((req: any) => ({
                    id: `req-${req.id}`,
                    type: 'request' as ActivityType,
                    user: `Table ${req.table_number}`,
                    action: 'requested',
                    target: req.request_type === 'waiter' ? 'Waiter Assistance' :
                        req.request_type === 'bill' ? 'Bill' : req.request_type,
                    time: new Date(req.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                    timestamp: new Date(req.created_at),
                    hasMessage: false,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Req${req.id}`
                }));

                // Combine and sort
                const combined = [...orderActivities, ...requestActivities]
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                setActivities(combined);

            } catch (error) {
                console.error('Error fetching merchant activity:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchData();

        return () => {
            mounted = false;
        };
    }, []);

    const broadcastMessage = async (message: string) => {
        const newActivity: ActivityItem = {
            id: `broadcast-${Date.now()}`,
            type: 'staff',
            user: 'You',
            action: 'broadcasted',
            target: 'to All Staff',
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            timestamp: new Date(),
            hasMessage: true,
            message: message,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${restaurantName}`
        };
        setActivities(prev => [newActivity, ...prev]);
        return true;
    };

    const refresh = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/merchant/activity');
            const data = await response.json();

            // Re-process the data (same logic as above)
            const orderActivities: ActivityItem[] = (data.orders || []).map((order: any) => ({
                id: `order-${order.id}`,
                type: 'order' as ActivityType,
                user: `Order ${order.order_number?.startsWith('ORD-') ? order.order_number.split('-').slice(1).join('-') : `#${order.order_number}`}`,
                action: 'placed for',
                target: `Table ${order.table_number}`,
                time: new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                timestamp: new Date(order.created_at),
                hasMessage: !!order.notes,
                message: order.notes ? `Note: '${order.notes}'` : undefined,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Order${order.id}`
            }));

            const requestActivities: ActivityItem[] = (data.requests || []).map((req: any) => ({
                id: `req-${req.id}`,
                type: 'request' as ActivityType,
                user: `Table ${req.table_number}`,
                action: 'requested',
                target: req.request_type === 'waiter' ? 'Waiter Assistance' :
                    req.request_type === 'bill' ? 'Bill' : req.request_type,
                time: new Date(req.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                timestamp: new Date(req.created_at),
                hasMessage: false,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Req${req.id}`
            }));

            const combined = [...orderActivities, ...requestActivities]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            setActivities(combined);
        } catch (error) {
            console.error('Error refreshing activity:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        activities,
        loading,
        restaurantName,
        restaurantHandle,
        broadcastMessage,
        refresh
    };
}
