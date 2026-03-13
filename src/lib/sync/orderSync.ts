/**
 * Order Sync Manager
 *
 * CRIT-05: Offline sync consolidation for POS
 * Replaces Dexie.js order queue with PowerSync-backed sync
 */

import { getPowerSync } from './powersync-config';
import {
    generateIdempotencyKey,
    queueSyncOperation,
    markIdempotencyKeyCompleted,
    isIdempotencyKeyUsed,
} from './idempotency';
import type { Database } from '@/types/database';

/**
 * Order status for offline tracking
 */
export type OfflineOrderStatus = 'pending' | 'syncing' | 'conflict' | 'resolved' | 'completed';

/**
 * Order item for offline storage
 */
export interface OfflineOrderItem {
    id: string;
    order_id: string;
    menu_item_id: string;
    menu_item_name: string;
    menu_item_name_am?: string;
    quantity: number;
    unit_price_santim: number;
    total_price_santim: number;
    modifiers_json?: string;
    notes?: string;
    status: string;
    station?: string;
    fired_at?: string;
    created_at: string;
    synced_at?: string;
}

/**
 * Order for offline storage
 */
export interface OfflineOrder {
    id: string;
    restaurant_id: string;
    order_number: number;
    table_number?: number;
    guest_name?: string;
    guest_phone?: string;
    status: OfflineOrderStatus;
    order_type: string;
    subtotal_santim: number;
    discount_santim: number;
    vat_santim: number;
    total_santim: number;
    notes?: string;
    idempotency_key: string;
    guest_fingerprint?: string;
    created_at: string;
    updated_at: string;
    synced_at?: string;
    last_modified: string;
    version: number;
    items?: OfflineOrderItem[];
}

/**
 * Create a new order locally (offline-first)
 */
export async function createOfflineOrder(
    orderData: {
        restaurant_id: string;
        table_number?: number;
        guest_name?: string;
        guest_phone?: string;
        order_type?: string;
        subtotal_santim: number;
        discount_santim?: number;
        vat_santim: number;
        total_santim: number;
        notes?: string;
        items: Array<{
            menu_item_id: string;
            menu_item_name: string;
            menu_item_name_am?: string;
            quantity: number;
            unit_price_santim: number;
            total_price_santim: number;
            modifiers_json?: string;
            notes?: string;
            station?: string;
        }>;
    },
    guestFingerprint?: string
): Promise<{ success: boolean; order?: OfflineOrder; error?: string }> {
    const db = getPowerSync();
    if (!db) {
        return { success: false, error: 'PowerSync not initialized' };
    }

    const idempotencyKey = generateIdempotencyKey('order');
    const now = new Date().toISOString();
    const orderId = crypto.randomUUID();

    try {
        // Start transaction
        await db.write(async () => {
            // Insert order
            await db.execute(
                `INSERT INTO orders (
                    id, restaurant_id, order_number, table_number, guest_name, guest_phone,
                    status, order_type, subtotal_santim, discount_santim, vat_santim, total_santim,
                    notes, idempotency_key, guest_fingerprint, created_at, updated_at, last_modified, version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    orderData.restaurant_id,
                    Date.now() % 100000, // Generate local order number
                    orderData.table_number ?? null,
                    orderData.guest_name ?? null,
                    orderData.guest_phone ?? null,
                    'pending',
                    orderData.order_type ?? 'dine_in',
                    orderData.subtotal_santim,
                    orderData.discount_santim ?? 0,
                    orderData.vat_santim,
                    orderData.total_santim,
                    orderData.notes ?? null,
                    idempotencyKey,
                    guestFingerprint ?? null,
                    now,
                    now,
                    now,
                    1,
                ]
            );

            // Insert order items
            for (const item of orderData.items) {
                const itemId = crypto.randomUUID();
                await db.execute(
                    `INSERT INTO order_items (
                        id, order_id, menu_item_id, menu_item_name, menu_item_name_am,
                        quantity, unit_price_santim, total_price_santim, modifiers_json,
                        notes, status, station, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        itemId,
                        orderId,
                        item.menu_item_id,
                        item.menu_item_name,
                        item.menu_item_name_am ?? null,
                        item.quantity,
                        item.unit_price_santim,
                        item.total_price_santim,
                        item.modifiers_json ?? null,
                        item.notes ?? null,
                        'pending',
                        item.station ?? null,
                        now,
                    ]
                );
            }
        });

        // Queue for sync
        await queueSyncOperation('create', 'orders', orderId, {
            ...orderData,
            id: orderId,
            idempotency_key: idempotencyKey,
        });

        // Get the created order
        const order = await getOfflineOrder(orderId);

        return { success: true, order: order! };
    } catch (error) {
        console.error('[OrderSync] Failed to create offline order:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get an order by ID
 */
export async function getOfflineOrder(orderId: string): Promise<OfflineOrder | null> {
    const db = getPowerSync();
    if (!db) return null;

    const order = await db.getFirstAsync<OfflineOrder>(`SELECT * FROM orders WHERE id = ?`, [
        orderId,
    ]);

    if (!order) return null;

    // Get order items
    const items = await db.getAllAsync<OfflineOrderItem>(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [orderId]
    );

    return { ...order, items };
}

/**
 * Get all pending orders
 */
export async function getPendingOfflineOrders(): Promise<OfflineOrder[]> {
    const db = getPowerSync();
    if (!db) return [];

    const orders = await db.getAllAsync<OfflineOrder>(
        `SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC`
    );

    return orders;
}

/**
 * Update order status
 */
export async function updateOfflineOrderStatus(
    orderId: string,
    status: OfflineOrderStatus
): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    const now = new Date().toISOString();

    try {
        await db.execute(
            `UPDATE orders SET status = ?, updated_at = ?, last_modified = ?, version = version + 1 WHERE id = ?`,
            [status, now, now, orderId]
        );

        // Queue for sync
        await queueSyncOperation('update', 'orders', orderId, { status });

        return true;
    } catch (error) {
        console.error('[OrderSync] Failed to update order status:', error);
        return false;
    }
}

/**
 * Delete an order (soft delete for sync)
 */
export async function deleteOfflineOrder(orderId: string): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    const now = new Date().toISOString();

    try {
        await db.execute(
            `UPDATE orders SET status = 'cancelled', updated_at = ?, last_modified = ?, version = version + 1 WHERE id = ?`,
            [now, now, orderId]
        );

        // Queue for sync
        await queueSyncOperation('delete', 'orders', orderId, { status: 'cancelled' });

        return true;
    } catch (error) {
        console.error('[OrderSync] Failed to delete order:', error);
        return false;
    }
}

/**
 * Get orders by restaurant
 */
export async function getOfflineOrdersByRestaurant(
    restaurantId: string,
    limit: number = 50
): Promise<OfflineOrder[]> {
    const db = getPowerSync();
    if (!db) return [];

    const orders = await db.getAllAsync<OfflineOrder>(
        `SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT ?`,
        [restaurantId, limit]
    );

    return orders;
}

/**
 * Get orders count by status
 */
export async function getOfflineOrdersCountByStatus(
    restaurantId?: string
): Promise<Record<OfflineOrderStatus, number>> {
    const db = getPowerSync();
    if (!db) {
        return { pending: 0, syncing: 0, conflict: 0, resolved: 0, completed: 0 };
    }

    let query = `SELECT status, COUNT(*) as count FROM orders`;
    const params: string[] = [];

    if (restaurantId) {
        query += ` WHERE restaurant_id = ?`;
        params.push(restaurantId);
    }

    query += ` GROUP BY status`;

    const results = await db.getAllAsync<{ status: OfflineOrderStatus; count: number }>(
        query,
        params
    );

    const counts: Record<OfflineOrderStatus, number> = {
        pending: 0,
        syncing: 0,
        conflict: 0,
        resolved: 0,
        completed: 0,
    };

    for (const row of results) {
        const status = row.status as OfflineOrderStatus;
        if (status in counts) {
            counts[status] = row.count;
        }
    }

    return counts;
}

/**
 * Clear all pending orders (for testing)
 */
export async function clearOfflineOrders(): Promise<void> {
    const db = getPowerSync();
    if (!db) return;

    await db.write(async () => {
        await db.execute(`DELETE FROM order_items`);
        await db.execute(`DELETE FROM orders`);
        await db.execute(`DELETE FROM sync_queue`);
    });
}
