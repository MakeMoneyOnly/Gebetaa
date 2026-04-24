/**
 * Tests for Order Sync Manager
 *
 * CRIT-05: Offline sync consolidation for POS
 * HIGH-006: Conflict resolution for order sync
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock PowerSync
const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetFirstAsync = vi.fn().mockResolvedValue(null);
const mockGetAllAsync = vi.fn().mockResolvedValue([]);
const mockWrite = vi.fn(async (fn: () => Promise<unknown>) => fn());
const mockQueueSyncOperationInDatabase = vi.fn().mockResolvedValue(undefined);
const mockAppendLocalJournalEntryInDatabase = vi.fn().mockResolvedValue(undefined);

vi.mock('../powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        write: mockWrite,
    })),
}));

// Mock idempotency module
vi.mock('../idempotency', () => ({
    queueSyncOperationInDatabase: mockQueueSyncOperationInDatabase,
    generateIdempotencyKey: vi.fn((prefix: string) => `${prefix}-test-idempotency-key`),
}));

vi.mock('@/lib/journal/local-journal', () => ({
    appendLocalJournalEntryInDatabase: mockAppendLocalJournalEntryInDatabase,
}));

// Mock conflict-resolution module
vi.mock('../conflict-resolution', () => ({
    resolveConflict: vi.fn((tableName, clientData, serverData, strategy) => ({
        resolvedData: { ...serverData, ...clientData, version: serverData.version },
        strategy,
        auditDetails: { winner: 'server', reason: 'server_wins' },
    })),
    logConflictResolution: vi.fn().mockResolvedValue(undefined),
    getConflictType: vi.fn(() => 'version_mismatch'),
}));

// Mock logger
vi.mock('../../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Order Sync Manager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetFirstAsync.mockResolvedValue(null);
        mockGetAllAsync.mockResolvedValue([]);
        mockWrite.mockImplementation(async (fn: () => Promise<unknown>) => fn());
        mockQueueSyncOperationInDatabase.mockResolvedValue(undefined);
        mockAppendLocalJournalEntryInDatabase.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('createOfflineOrder', () => {
        it('should create an order with items successfully', async () => {
            const randomUUIDSpy = vi
                .spyOn(crypto, 'randomUUID')
                .mockReturnValueOnce(
                    'order-id-123' as `${string}-${string}-${string}-${string}-${string}`
                )
                .mockReturnValueOnce(
                    'item-id-123' as `${string}-${string}-${string}-${string}-${string}`
                );

            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-id-123',
                restaurant_id: 'restaurant-1',
                status: 'pending',
                total_santim: 1000,
            });

            const { createOfflineOrder } = await import('../orderSync');
            const result = await createOfflineOrder({
                restaurant_id: 'restaurant-1',
                subtotal_santim: 1000,
                vat_santim: 150,
                total_santim: 1150,
                items: [
                    {
                        menu_item_id: 'menu-1',
                        menu_item_name: 'Test Burger',
                        quantity: 2,
                        unit_price_santim: 500,
                        total_price_santim: 1000,
                    },
                ],
            });

            expect(result.success).toBe(true);
            expect(result.order).toBeDefined();
            expect(mockExecute).toHaveBeenCalled();
            expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
            expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
            expect(mockExecute.mock.calls[0][0]).toContain('INSERT INTO local_sequence_counters');
            const orderInsertIndex = mockExecute.mock.calls.findIndex(call =>
                String(call[0]).includes('INSERT INTO orders')
            );
            expect(orderInsertIndex).toBeGreaterThanOrEqual(0);
            expect(mockAppendLocalJournalEntryInDatabase.mock.invocationCallOrder[0]).toBeLessThan(
                mockExecute.mock.invocationCallOrder[orderInsertIndex]
            );

            randomUUIDSpy.mockRestore();
        });

        it('should create an order with all optional fields', async () => {
            const randomUUIDSpy = vi
                .spyOn(crypto, 'randomUUID')
                .mockReturnValueOnce(
                    'order-id-456' as `${string}-${string}-${string}-${string}-${string}`
                )
                .mockReturnValueOnce(
                    'item-id-456' as `${string}-${string}-${string}-${string}-${string}`
                );

            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-id-456',
                restaurant_id: 'restaurant-1',
                table_number: 5,
                guest_name: 'Test Guest',
                guest_phone: '+251911123456',
                status: 'pending',
            });

            const { createOfflineOrder } = await import('../orderSync');
            const result = await createOfflineOrder(
                {
                    restaurant_id: 'restaurant-1',
                    table_number: 5,
                    guest_name: 'Test Guest',
                    guest_phone: '+251911123456',
                    order_type: 'dine_in',
                    subtotal_santim: 2000,
                    discount_santim: 200,
                    vat_santim: 270,
                    total_santim: 2070,
                    notes: 'Extra spicy',
                    items: [
                        {
                            menu_item_id: 'menu-1',
                            menu_item_name: 'Test Burger',
                            menu_item_name_am: 'ቡርገር',
                            quantity: 2,
                            unit_price_santim: 1000,
                            total_price_santim: 2000,
                            modifiers_json: '{"extra": "cheese"}',
                            notes: 'No onions',
                            station: 'grill',
                        },
                    ],
                },
                'guest-fingerprint-123'
            );

            expect(result.success).toBe(true);

            randomUUIDSpy.mockRestore();
        });

        it('should return error when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { createOfflineOrder } = await import('../orderSync');
            const result = await createOfflineOrder({
                restaurant_id: 'restaurant-1',
                subtotal_santim: 1000,
                vat_santim: 150,
                total_santim: 1150,
                items: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('PowerSync not initialized');
        });

        it('should handle database errors gracefully', async () => {
            mockExecute.mockRejectedValueOnce(new Error('Database error'));

            const { createOfflineOrder } = await import('../orderSync');
            const result = await createOfflineOrder({
                restaurant_id: 'restaurant-1',
                subtotal_santim: 1000,
                vat_santim: 150,
                total_santim: 1150,
                items: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('getOfflineOrder', () => {
        it('should return an order with items by ID', async () => {
            const mockOrder = {
                id: 'order-1',
                restaurant_id: 'restaurant-1',
                status: 'pending',
                total_santim: 1000,
            };
            const mockItems = [{ id: 'item-1', order_id: 'order-1', menu_item_name: 'Burger' }];

            mockGetFirstAsync.mockResolvedValueOnce(mockOrder);
            mockGetAllAsync.mockResolvedValueOnce(mockItems);

            const { getOfflineOrder } = await import('../orderSync');
            const result = await getOfflineOrder('order-1');

            expect(result).toEqual({ ...mockOrder, items: mockItems });
        });

        it('should return null when order not found', async () => {
            mockGetFirstAsync.mockResolvedValueOnce(null);

            const { getOfflineOrder } = await import('../orderSync');
            const result = await getOfflineOrder('nonexistent');

            expect(result).toBeNull();
        });

        it('should return null when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getOfflineOrder } = await import('../orderSync');
            const result = await getOfflineOrder('order-1');

            expect(result).toBeNull();
        });
    });

    describe('getPendingOfflineOrders', () => {
        it('should return all pending orders', async () => {
            const mockOrders = [
                { id: 'order-1', status: 'pending' },
                { id: 'order-2', status: 'pending' },
            ];
            mockGetAllAsync.mockResolvedValueOnce(mockOrders);

            const { getPendingOfflineOrders } = await import('../orderSync');
            const result = await getPendingOfflineOrders();

            expect(result).toEqual(mockOrders);
            expect(mockGetAllAsync).toHaveBeenCalledWith(
                expect.stringContaining("WHERE status = 'pending'")
            );
        });

        it('should return empty array when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getPendingOfflineOrders } = await import('../orderSync');
            const result = await getPendingOfflineOrders();

            expect(result).toEqual([]);
        });
    });

    describe('updateOfflineOrderStatus', () => {
        it('should update order status successfully', async () => {
            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-1',
                restaurant_id: 'restaurant-1',
                status: 'pending',
                order_type: 'dine_in',
                subtotal_santim: 1000,
                discount_santim: 0,
                vat_santim: 150,
                total_santim: 1150,
                idempotency_key: 'key-1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                last_modified: '2024-01-01T10:00:00Z',
                version: 1,
            });
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { updateOfflineOrderStatus } = await import('../orderSync');
            const result = await updateOfflineOrderStatus('order-1', 'ready');

            expect(result).toBe(true);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE orders SET status'),
                expect.arrayContaining(['ready', expect.any(String), expect.any(String), 'order-1'])
            );
            expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
            expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
        });

        it('should return false when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { updateOfflineOrderStatus } = await import('../orderSync');
            const result = await updateOfflineOrderStatus('order-1', 'ready');

            expect(result).toBe(false);
        });

        it('should handle database errors gracefully', async () => {
            mockExecute.mockRejectedValueOnce(new Error('Database error'));

            const { updateOfflineOrderStatus } = await import('../orderSync');
            const result = await updateOfflineOrderStatus('order-1', 'ready');

            expect(result).toBe(false);
        });
    });

    describe('updateOfflineOrderCourseFire', () => {
        it('should update local course fire fields successfully', async () => {
            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-1',
                restaurant_id: 'restaurant-1',
                status: 'pending',
                order_type: 'dine_in',
                subtotal_santim: 1000,
                discount_santim: 0,
                vat_santim: 150,
                total_santim: 1150,
                idempotency_key: 'key-1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                last_modified: '2024-01-01T10:00:00Z',
                version: 1,
            });
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { updateOfflineOrderCourseFire } = await import('../orderSync');
            const result = await updateOfflineOrderCourseFire('order-1', {
                fire_mode: 'manual',
                current_course: 'main',
            });

            expect(result).toBe(true);
            expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
            expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
        });
    });

    describe('deleteOfflineOrder', () => {
        it('should soft delete an order by setting status to cancelled', async () => {
            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-1',
                restaurant_id: 'restaurant-1',
                status: 'pending',
                order_type: 'dine_in',
                subtotal_santim: 1000,
                discount_santim: 0,
                vat_santim: 150,
                total_santim: 1150,
                idempotency_key: 'key-1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                last_modified: '2024-01-01T10:00:00Z',
                version: 1,
            });
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { deleteOfflineOrder } = await import('../orderSync');
            const result = await deleteOfflineOrder('order-1');

            expect(result).toBe(true);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining("status = 'cancelled'"),
                expect.arrayContaining([expect.any(String), expect.any(String), 'order-1'])
            );
            expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
            expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
        });

        it('should return false when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { deleteOfflineOrder } = await import('../orderSync');
            const result = await deleteOfflineOrder('order-1');

            expect(result).toBe(false);
        });
    });

    describe('getOfflineOrdersByRestaurant', () => {
        it('should return orders for a restaurant', async () => {
            const mockOrders = [{ id: 'order-1', restaurant_id: 'restaurant-1' }];
            mockGetAllAsync.mockResolvedValueOnce(mockOrders);

            const { getOfflineOrdersByRestaurant } = await import('../orderSync');
            const result = await getOfflineOrdersByRestaurant('restaurant-1');

            expect(result).toEqual(mockOrders);
            expect(mockGetAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE restaurant_id = ?'),
                ['restaurant-1', 50]
            );
        });

        it('should respect custom limit', async () => {
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { getOfflineOrdersByRestaurant } = await import('../orderSync');
            await getOfflineOrdersByRestaurant('restaurant-1', 100);

            expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), ['restaurant-1', 100]);
        });

        it('should return empty array when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getOfflineOrdersByRestaurant } = await import('../orderSync');
            const result = await getOfflineOrdersByRestaurant('restaurant-1');

            expect(result).toEqual([]);
        });
    });

    describe('getOfflineOrdersCountByStatus', () => {
        it('should return counts grouped by status', async () => {
            mockGetAllAsync.mockResolvedValueOnce([
                { status: 'pending', count: 5 },
                { status: 'syncing', count: 2 },
                { status: 'completed', count: 10 },
            ]);

            const { getOfflineOrdersCountByStatus } = await import('../orderSync');
            const result = await getOfflineOrdersCountByStatus();

            expect(result.pending).toBe(5);
            expect(result.syncing).toBe(2);
            expect(result.completed).toBe(10);
            expect(result.conflict).toBe(0);
            expect(result.resolved).toBe(0);
        });

        it('should filter by restaurant when provided', async () => {
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { getOfflineOrdersCountByStatus } = await import('../orderSync');
            await getOfflineOrdersCountByStatus('restaurant-1');

            expect(mockGetAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE restaurant_id = ?'),
                ['restaurant-1']
            );
        });

        it('should return zeros when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getOfflineOrdersCountByStatus } = await import('../orderSync');
            const result = await getOfflineOrdersCountByStatus();

            expect(result).toEqual({
                payment_pending: 0,
                pending: 0,
                acknowledged: 0,
                preparing: 0,
                ready: 0,
                served: 0,
                syncing: 0,
                conflict: 0,
                resolved: 0,
                completed: 0,
                cancelled: 0,
            });
        });
    });

    describe('clearOfflineOrders', () => {
        it('should clear all orders and items', async () => {
            const { clearOfflineOrders } = await import('../orderSync');
            await clearOfflineOrders();

            expect(mockWrite).toHaveBeenCalled();
        });

        it('should do nothing when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { clearOfflineOrders } = await import('../orderSync');
            await clearOfflineOrders();

            expect(mockWrite).not.toHaveBeenCalled();
        });
    });

    describe('resolveOrderConflict', () => {
        it('should resolve conflict using default strategy', async () => {
            mockGetFirstAsync.mockResolvedValueOnce({
                id: 'order-1',
                status: 'resolved',
                version: 2,
            });

            const { resolveOrderConflict } = await import('../orderSync');
            const result = await resolveOrderConflict(
                'order-1',
                {
                    id: 'order-1',
                    restaurant_id: 'restaurant-1',
                    order_number: 123,
                    status: 'pending',
                    order_type: 'dine_in',
                    subtotal_santim: 1000,
                    discount_santim: 0,
                    vat_santim: 150,
                    total_santim: 1150,
                    idempotency_key: 'key-1',
                    created_at: '2024-01-01T10:00:00Z',
                    updated_at: '2024-01-01T10:00:00Z',
                    last_modified: '2024-01-01T10:00:00Z',
                    version: 1,
                },
                {
                    id: 'order-1',
                    status: 'completed',
                    version: 2,
                    last_modified: '2024-01-01T11:00:00Z',
                }
            );

            expect(result.resolved).toBe(true);
        });

        it('should return error when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { resolveOrderConflict } = await import('../orderSync');
            const result = await resolveOrderConflict(
                'order-1',
                {
                    id: 'order-1',
                    restaurant_id: 'restaurant-1',
                    order_number: 123,
                    status: 'pending',
                    order_type: 'dine_in',
                    subtotal_santim: 1000,
                    discount_santim: 0,
                    vat_santim: 150,
                    total_santim: 1150,
                    idempotency_key: 'key-1',
                    created_at: '2024-01-01T10:00:00Z',
                    updated_at: '2024-01-01T10:00:00Z',
                    last_modified: '2024-01-01T10:00:00Z',
                    version: 1,
                },
                {
                    id: 'order-1',
                    status: 'completed',
                    version: 2,
                    last_modified: '2024-01-01T11:00:00Z',
                }
            );

            expect(result.resolved).toBe(false);
            expect(result.error).toBe('PowerSync not initialized');
        });

        it('should handle resolution errors gracefully', async () => {
            mockExecute.mockRejectedValueOnce(new Error('Update failed'));

            const { resolveOrderConflict } = await import('../orderSync');
            const result = await resolveOrderConflict(
                'order-1',
                {
                    id: 'order-1',
                    restaurant_id: 'restaurant-1',
                    order_number: 123,
                    status: 'pending',
                    order_type: 'dine_in',
                    subtotal_santim: 1000,
                    discount_santim: 0,
                    vat_santim: 150,
                    total_santim: 1150,
                    idempotency_key: 'key-1',
                    created_at: '2024-01-01T10:00:00Z',
                    updated_at: '2024-01-01T10:00:00Z',
                    last_modified: '2024-01-01T10:00:00Z',
                    version: 1,
                },
                {
                    id: 'order-1',
                    status: 'completed',
                    version: 2,
                    last_modified: '2024-01-01T11:00:00Z',
                }
            );

            expect(result.resolved).toBe(false);
            expect(result.error).toBe('Update failed');
        });
    });
});
