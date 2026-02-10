import Dexie, { Table } from 'dexie';

export interface PendingOrder {
    id?: number;
    restaurant_id: string;
    table_number: number;
    items: { id: string; name: string; quantity: number; price: number }[];
    total_price: number;
    notes: string;
    idempotency_key: string;
    created_at: string;
    status: 'pending';
}

export class OrderDatabase extends Dexie {
    pending_orders!: Table<PendingOrder>;

    constructor() {
        super('GebetaOrders');
        this.version(1).stores({
            pending_orders: '++id, idempotency_key, restaurant_id',
        });
    }
}

export const db = new OrderDatabase();

/**
 * Adds an order to the offline queue
 */
export async function queueOrder(order: Omit<PendingOrder, 'id' | 'created_at' | 'status'>) {
    try {
        return await db.pending_orders.add({
            ...order,
            created_at: new Date().toISOString(),
            status: 'pending',
        });
    } catch (error) {
        console.error('Failed to queue order:', error);
        throw error;
    }
}

/**
 * Gets all pending orders from the queue
 */
export async function getPendingOrders() {
    return await db.pending_orders.toArray();
}

/**
 * Removes an order from the queue (after successful sync)
 */
export async function removeQueuedOrder(id: number) {
    return await db.pending_orders.delete(id);
}

/**
 * Clears all pending orders from the queue
 * USE WITH CAUTION - primarily for testing
 */
export async function clearAllPendingOrders() {
    return await db.pending_orders.clear();
}
