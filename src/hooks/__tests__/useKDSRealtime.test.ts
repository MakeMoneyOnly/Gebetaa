/**
 * Tests for useKDSRealtime hook
 * HIGH-008: Add tests for critical hooks
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation(callback => {
        callback('SUBSCRIBED');
        return {
            unsubscribe: vi.fn(),
        };
    }),
    unsubscribe: vi.fn(),
};

const mockSupabase = {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => mockSupabase,
}));

// Import after mocking
import { useKDSRealtime } from '../useKDSRealtime';

describe('useKDSRealtime', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: false,
            })
        );

        expect(result.current.isConnected).toBe(false);
    });

    it('should create channel when enabled', async () => {
        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
            })
        );

        await waitFor(() => {
            expect(mockSupabase.channel).toHaveBeenCalledWith('kds-orders-restaurant-123');
        });
    });

    it('should subscribe to orders and external_orders tables', async () => {
        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
            })
        );

        await waitFor(() => {
            expect(mockChannel.on).toHaveBeenCalledTimes(2);
        });

        // Check that it subscribes to postgres_changes for both tables
        const calls = mockChannel.on.mock.calls;
        const tableCalls = calls.filter(call => call[1]?.table);
        expect(tableCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onNewOrder callback for INSERT events', async () => {
        const onNewOrder = vi.fn();

        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
                onNewOrder,
            })
        );

        await waitFor(() => {
            expect(mockChannel.on).toHaveBeenCalled();
        });

        // Get the callback from the first 'on' call for orders table
        const ordersOnCall = mockChannel.on.mock.calls.find(call => call[1]?.table === 'orders');

        if (ordersOnCall) {
            const payload = {
                eventType: 'INSERT',
                new: {
                    id: 'order-123',
                    restaurant_id: 'restaurant-123',
                    status: 'pending',
                    created_at: new Date().toISOString(),
                },
                old: {},
                schema: 'public',
                table: 'orders',
                commit_timestamp: new Date().toISOString(),
            };

            // Simulate the callback being called
            const callback = ordersOnCall[2];
            act(() => {
                callback(payload);
            });

            expect(onNewOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'order-123',
                    order_type: 'dine-in',
                    source: 'dine-in',
                    status: 'pending',
                })
            );
        }
    });

    it('should call onOrderUpdate callback for UPDATE events', async () => {
        const onOrderUpdate = vi.fn();

        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
                onOrderUpdate,
            })
        );

        await waitFor(() => {
            expect(mockChannel.on).toHaveBeenCalled();
        });

        const ordersOnCall = mockChannel.on.mock.calls.find(call => call[1]?.table === 'orders');

        if (ordersOnCall) {
            const payload = {
                eventType: 'UPDATE',
                new: {
                    id: 'order-456',
                    restaurant_id: 'restaurant-123',
                    status: 'preparing',
                    created_at: new Date().toISOString(),
                },
                old: {},
                schema: 'public',
                table: 'orders',
                commit_timestamp: new Date().toISOString(),
            };

            const callback = ordersOnCall[2];
            act(() => {
                callback(payload);
            });

            expect(onOrderUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'order-456',
                    status: 'preparing',
                })
            );
        }
    });

    it('should call onOrderDelete callback for DELETE events', async () => {
        const onOrderDelete = vi.fn();

        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
                onOrderDelete,
            })
        );

        await waitFor(() => {
            expect(mockChannel.on).toHaveBeenCalled();
        });

        const ordersOnCall = mockChannel.on.mock.calls.find(call => call[1]?.table === 'orders');

        if (ordersOnCall) {
            const payload = {
                eventType: 'DELETE',
                new: {},
                old: {
                    id: 'order-789',
                },
                schema: 'public',
                table: 'orders',
                commit_timestamp: new Date().toISOString(),
            };

            const callback = ordersOnCall[2];
            act(() => {
                callback(payload);
            });

            expect(onOrderDelete).toHaveBeenCalledWith('order-789');
        }
    });

    it('should filter orders by restaurant_id', async () => {
        const onNewOrder = vi.fn();

        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: true,
                onNewOrder,
            })
        );

        await waitFor(() => {
            expect(mockChannel.on).toHaveBeenCalled();
        });

        const ordersOnCall = mockChannel.on.mock.calls.find(call => call[1]?.table === 'orders');

        if (ordersOnCall) {
            const payload = {
                eventType: 'INSERT',
                new: {
                    id: 'order-999',
                    restaurant_id: 'different-restaurant', // Different restaurant
                    status: 'pending',
                    created_at: new Date().toISOString(),
                },
                old: {},
                schema: 'public',
                table: 'orders',
                commit_timestamp: new Date().toISOString(),
            };

            const callback = ordersOnCall[2];
            act(() => {
                callback(payload);
            });

            // Should not be called because restaurant_id doesn't match
            expect(onNewOrder).not.toHaveBeenCalled();
        }
    });

    it('should not subscribe when disabled', () => {
        renderHook(() =>
            useKDSRealtime({
                restaurantId: 'restaurant-123',
                enabled: false,
            })
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should not subscribe when restaurantId is null', () => {
        renderHook(() =>
            useKDSRealtime({
                restaurantId: null as unknown as string,
                enabled: true,
            })
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });
});
