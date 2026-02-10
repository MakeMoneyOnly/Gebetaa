import { describe, it, expect, beforeEach } from 'vitest';
import {
    queueOrder,
    getPendingOrders,
    removeQueuedOrder,
    clearAllPendingOrders,
} from './offlineQueue';

/**
 * Offline Queue Tests
 *
 * Addresses PLATFORM_AUDIT_REPORT finding TEST-001: Offline Support Testing
 * Critical for the "works offline" value proposition
 */

describe('OrderDatabase', () => {
    // Clear the database before each test
    beforeEach(async () => {
        await clearAllPendingOrders();
    });

    describe('queueOrder', () => {
        it('should add an order to the queue', async () => {
            const order = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 5,
                items: [{ id: 'item-1', name: 'Test Item', quantity: 2, price: 10.99 }],
                total_price: 21.98,
                notes: 'Test notes',
                idempotency_key: '550e8400-e29b-41d4-a716-446655440001',
            };

            const id = await queueOrder(order);
            expect(id).toBeDefined();
            expect(typeof id).toBe('number');
        });

        it('should store order with pending status and timestamp', async () => {
            const order = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 5,
                items: [{ id: 'item-1', name: 'Test Item', quantity: 1, price: 10 }],
                total_price: 10,
                notes: '',
                idempotency_key: '550e8400-e29b-41d4-a716-446655440001',
            };

            await queueOrder(order);
            const pending = await getPendingOrders();

            expect(pending).toHaveLength(1);
            expect(pending[0].status).toBe('pending');
            expect(pending[0].created_at).toBeDefined();
            expect(new Date(pending[0].created_at)).toBeInstanceOf(Date);
        });

        it('should allow multiple orders in queue', async () => {
            const order1 = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 1,
                items: [{ id: 'item-1', name: 'Item 1', quantity: 1, price: 10 }],
                total_price: 10,
                notes: '',
                idempotency_key: 'key-1',
            };

            const order2 = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 2,
                items: [{ id: 'item-2', name: 'Item 2', quantity: 1, price: 20 }],
                total_price: 20,
                notes: '',
                idempotency_key: 'key-2',
            };

            await queueOrder(order1);
            await queueOrder(order2);

            const pending = await getPendingOrders();
            expect(pending).toHaveLength(2);
        });
    });

    describe('getPendingOrders', () => {
        it('should return empty array when no orders', async () => {
            const pending = await getPendingOrders();
            expect(pending).toEqual([]);
        });

        it('should return all pending orders', async () => {
            const order = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 5,
                items: [{ id: 'item-1', name: 'Test Item', quantity: 1, price: 10 }],
                total_price: 10,
                notes: 'Test',
                idempotency_key: 'test-key',
            };

            await queueOrder(order);
            const pending = await getPendingOrders();

            expect(pending).toHaveLength(1);
            expect(pending[0].restaurant_id).toBe(order.restaurant_id);
            expect(pending[0].table_number).toBe(order.table_number);
            expect(pending[0].total_price).toBe(order.total_price);
            expect(pending[0].idempotency_key).toBe(order.idempotency_key);
        });

        it('should return orders sorted by creation time', async () => {
            const order1 = {
                restaurant_id: 'rest-1',
                table_number: 1,
                items: [{ id: 'item-1', name: 'Item 1', quantity: 1, price: 10 }],
                total_price: 10,
                notes: '',
                idempotency_key: 'key-1',
            };

            const order2 = {
                restaurant_id: 'rest-1',
                table_number: 2,
                items: [{ id: 'item-2', name: 'Item 2', quantity: 1, price: 20 }],
                total_price: 20,
                notes: '',
                idempotency_key: 'key-2',
            };

            await queueOrder(order1);
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
            await queueOrder(order2);

            const pending = await getPendingOrders();
            expect(pending).toHaveLength(2);
            // Orders should be in insertion order (by auto-increment id)
            expect(pending[0].idempotency_key).toBe('key-1');
            expect(pending[1].idempotency_key).toBe('key-2');
        });
    });

    describe('removeQueuedOrder', () => {
        it('should remove order by id', async () => {
            const order = {
                restaurant_id: 'rest-1',
                table_number: 1,
                items: [{ id: 'item-1', name: 'Item 1', quantity: 1, price: 10 }],
                total_price: 10,
                notes: '',
                idempotency_key: 'key-1',
            };

            const id = await queueOrder(order);
            let pending = await getPendingOrders();
            expect(pending).toHaveLength(1);

            await removeQueuedOrder(id as number);
            pending = await getPendingOrders();
            expect(pending).toHaveLength(0);
        });

        it('should not throw when removing non-existent order', async () => {
            await expect(removeQueuedOrder(99999)).resolves.not.toThrow();
        });
    });

    describe('clearAllPendingOrders', () => {
        it('should remove all orders from queue', async () => {
            const order1 = {
                restaurant_id: 'rest-1',
                table_number: 1,
                items: [{ id: 'item-1', name: 'Item 1', quantity: 1, price: 10 }],
                total_price: 10,
                notes: '',
                idempotency_key: 'key-1',
            };

            const order2 = {
                restaurant_id: 'rest-1',
                table_number: 2,
                items: [{ id: 'item-2', name: 'Item 2', quantity: 1, price: 20 }],
                total_price: 20,
                notes: '',
                idempotency_key: 'key-2',
            };

            await queueOrder(order1);
            await queueOrder(order2);

            let pending = await getPendingOrders();
            expect(pending).toHaveLength(2);

            await clearAllPendingOrders();

            pending = await getPendingOrders();
            expect(pending).toHaveLength(0);
        });
    });

    describe('data integrity', () => {
        it('should preserve all order fields', async () => {
            const complexOrder = {
                restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
                table_number: 42,
                items: [
                    { id: 'item-1', name: 'Burger', quantity: 2, price: 15.99 },
                    { id: 'item-2', name: 'Fries', quantity: 1, price: 5.99 },
                    { id: 'item-3', name: 'Drink', quantity: 3, price: 2.5 },
                ],
                total_price: 42.47,
                notes: 'No onions on the burger, extra sauce on the side',
                idempotency_key: 'unique-key-12345',
            };

            await queueOrder(complexOrder);
            const pending = await getPendingOrders();

            expect(pending).toHaveLength(1);
            const stored = pending[0];
            expect(stored.restaurant_id).toBe(complexOrder.restaurant_id);
            expect(stored.table_number).toBe(complexOrder.table_number);
            expect(stored.items).toEqual(complexOrder.items);
            expect(stored.total_price).toBe(complexOrder.total_price);
            expect(stored.notes).toBe(complexOrder.notes);
            expect(stored.idempotency_key).toBe(complexOrder.idempotency_key);
        });

        it('should handle special characters in notes', async () => {
            const order = {
                restaurant_id: 'rest-1',
                table_number: 1,
                items: [{ id: 'item-1', name: 'Item', quantity: 1, price: 10 }],
                total_price: 10,
                notes: 'Special chars: émojis 🔥 <script>alert("xss")</script> "quotes" \n newlines',
                idempotency_key: 'key-1',
            };

            await queueOrder(order);
            const pending = await getPendingOrders();

            expect(pending[0].notes).toBe(order.notes);
        });
    });
});
