'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
type ExternalOrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled';

interface KDSOrder {
    id: string;
    order_type: 'dine-in' | 'delivery' | 'pickup';
    source: string;
    status: OrderStatus | ExternalOrderStatus;
    created_at: string;
    restaurant_id?: string;
}

interface RealtimePayload {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
    schema: string;
    table: string;
    commit_timestamp: string;
}

interface UseKDSRealtimeOptions {
    restaurantId: string;
    onNewOrder?: (order: KDSOrder) => void;
    onOrderUpdate?: (order: KDSOrder) => void;
    onOrderDelete?: (orderId: string) => void;
    enabled?: boolean;
}

/**
 * Hook for real-time KDS order updates via Supabase Realtime
 *
 * Subscribes to both `orders` and `external_orders` tables for
 * comprehensive omnichannel order tracking.
 */
export function useKDSRealtime({
    restaurantId,
    onNewOrder,
    onOrderUpdate,
    onOrderDelete,
    enabled = true,
}: UseKDSRealtimeOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();
    const mountedRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);

    const handleOrdersChange = useCallback(
        (payload: RealtimePayload) => {
            if (!mountedRef.current) return;

            const order = payload.new;

            // Filter by restaurant_id
            if (order.restaurant_id !== restaurantId) {
                return;
            }

            switch (payload.eventType) {
                case 'INSERT':
                    onNewOrder?.({
                        id: order.id as string,
                        order_type: 'dine-in',
                        source: 'dine-in',
                        status: order.status as OrderStatus,
                        created_at: order.created_at as string,
                    });
                    break;
                case 'UPDATE':
                    onOrderUpdate?.({
                        id: order.id as string,
                        order_type: 'dine-in',
                        source: 'dine-in',
                        status: order.status as OrderStatus,
                        created_at: order.created_at as string,
                    });
                    break;
                case 'DELETE':
                    onOrderDelete?.(payload.old.id as string);
                    break;
            }
        },
        [restaurantId, onNewOrder, onOrderUpdate, onOrderDelete]
    );

    const handleExternalOrdersChange = useCallback(
        (payload: RealtimePayload) => {
            if (!mountedRef.current) return;

            const order = payload.new;

            // Filter by restaurant_id
            if (order.restaurant_id !== restaurantId) {
                return;
            }

            const provider = order.provider as string;
            const payloadJson = order.payload_json as Record<string, unknown> | null;
            const fulfillmentType = payloadJson?.fulfillment_type as string;

            switch (payload.eventType) {
                case 'INSERT':
                    onNewOrder?.({
                        id: order.id as string,
                        order_type: fulfillmentType === 'pickup' ? 'pickup' : 'delivery',
                        source: provider,
                        status: order.normalized_status as ExternalOrderStatus,
                        created_at: order.created_at as string,
                    });
                    break;
                case 'UPDATE':
                    onOrderUpdate?.({
                        id: order.id as string,
                        order_type: fulfillmentType === 'pickup' ? 'pickup' : 'delivery',
                        source: provider,
                        status: order.normalized_status as ExternalOrderStatus,
                        created_at: order.created_at as string,
                    });
                    break;
                case 'DELETE':
                    onOrderDelete?.(payload.old.id as string);
                    break;
            }
        },
        [restaurantId, onNewOrder, onOrderUpdate, onOrderDelete]
    );

    useEffect(() => {
        if (!enabled || !restaurantId) return;

        mountedRef.current = true;

        // Create a single channel for all subscriptions
        const channel = supabase
            .channel(`kds-orders-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                payload => {
                    handleOrdersChange(payload as unknown as RealtimePayload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'external_orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                payload => {
                    handleExternalOrdersChange(payload as unknown as RealtimePayload);
                }
            )
            .subscribe(status => {
                console.log(`[KDS Realtime] Subscription status: ${status}`);
            });

        channelRef.current = channel;
        setIsConnected(true);

        return () => {
            mountedRef.current = false;
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
            setIsConnected(false);
        };
    }, [enabled, restaurantId, supabase, handleOrdersChange, handleExternalOrdersChange]);

    return {
        isConnected,
    };
}

/**
 * Hook for real-time driver status updates
 */
interface DriverStatusUpdate {
    orderId: string;
    status: 'pending' | 'assigned' | 'arrived';
    driverName?: string;
    driverPhone?: string;
    etaMinutes?: number;
}

interface UseDriverStatusRealtimeOptions {
    restaurantId: string;
    onDriverStatusUpdate?: (update: DriverStatusUpdate) => void;
    enabled?: boolean;
}

export function useDriverStatusRealtime({
    restaurantId,
    onDriverStatusUpdate,
    enabled = true,
}: UseDriverStatusRealtimeOptions) {
    const supabase = createClient();
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!enabled || !restaurantId) return;

        mountedRef.current = true;

        const channel = supabase
            .channel(`driver-status-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'external_orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                payload => {
                    if (!mountedRef.current) return;

                    const order = payload.new as Record<string, unknown>;
                    const payloadJson = order.payload_json as Record<string, unknown> | null;
                    const driverInfo = payloadJson?.driver_info as Record<string, unknown> | null;

                    if (driverInfo) {
                        onDriverStatusUpdate?.({
                            orderId: order.id as string,
                            status: driverInfo.status as 'pending' | 'assigned' | 'arrived',
                            driverName: driverInfo.name as string | undefined,
                            driverPhone: driverInfo.phone as string | undefined,
                            etaMinutes: driverInfo.eta_minutes as number | undefined,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            mountedRef.current = false;
            channel.unsubscribe();
        };
    }, [enabled, restaurantId, supabase, onDriverStatusUpdate]);
}
