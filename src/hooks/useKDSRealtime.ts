'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * HIGH-015: Reconnection configuration
 */
const RECONNECT_CONFIG = {
    /** Maximum number of reconnection attempts */
    maxRetries: 5,
    /** Base delay in milliseconds for exponential backoff */
    baseDelayMs: 1000,
    /** Maximum delay in milliseconds */
    maxDelayMs: 30000,
    /** Jitter factor to prevent thundering herd (0-1) */
    jitterFactor: 0.3,
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateReconnectDelay(retryCount: number): number {
    const delay = Math.min(
        RECONNECT_CONFIG.baseDelayMs * Math.pow(2, retryCount),
        RECONNECT_CONFIG.maxDelayMs
    );
    // Add jitter
    const jitter = delay * RECONNECT_CONFIG.jitterFactor * Math.random();
    return delay + jitter;
}

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
    const supabase = useMemo(() => createClient(), []);
    const mountedRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);

    // HIGH-015: Reconnection state
    const retryCountRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [reconnectionStatus, setReconnectionStatus] = useState<
        'idle' | 'reconnecting' | 'failed'
    >('idle');

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

    /**
     * HIGH-015: Attempt to reconnect with exponential backoff
     */
    const attemptReconnect = useCallback(() => {
        if (!mountedRef.current) return;

        const currentRetry = retryCountRef.current;

        if (currentRetry >= RECONNECT_CONFIG.maxRetries) {
            console.error(
                `[KDS Realtime] Max reconnection attempts (${RECONNECT_CONFIG.maxRetries}) reached`
            );
            setReconnectionStatus('failed');
            return;
        }

        const delay = calculateReconnectDelay(currentRetry);
        console.log(
            `[KDS Realtime] Scheduling reconnect attempt ${currentRetry + 1}/${RECONNECT_CONFIG.maxRetries} in ${Math.round(delay)}ms`
        );

        setReconnectionStatus('reconnecting');

        reconnectTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;

            retryCountRef.current++;

            // Unsubscribe existing channel if any
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }

            // Trigger reconnection by setting up a new subscription
            setupChannel();
        }, delay);
    }, []);

    /**
     * HIGH-015: Setup channel with reconnection handling
     */
    const setupChannel = useCallback(() => {
        if (!mountedRef.current || !restaurantId) return;

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
                if (!mountedRef.current) return;

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setReconnectionStatus('idle');
                    retryCountRef.current = 0; // Reset retry count on successful connection
                    return;
                }

                if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
                    setIsConnected(false);
                    // HIGH-015: Attempt reconnection with exponential backoff
                    attemptReconnect();
                }
            });

        channelRef.current = channel;
    }, [restaurantId, supabase, handleOrdersChange, handleExternalOrdersChange, attemptReconnect]);

    useEffect(() => {
        if (!enabled || !restaurantId) return;

        mountedRef.current = true;
        retryCountRef.current = 0;
        setReconnectionStatus('idle');

        // Initial channel setup
        setupChannel();

        // HIGH-015: Cleanup function
        return () => {
            mountedRef.current = false;

            // Clear any pending reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
            setIsConnected(false);
            setReconnectionStatus('idle');
        };
    }, [enabled, restaurantId, setupChannel]);

    return {
        isConnected,
        reconnectionStatus,
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
