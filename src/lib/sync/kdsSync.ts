/**
 * KDS Sync Manager
 *
 * CRIT-05: Offline sync consolidation for KDS
 * Replaces localStorage KDS queue with PowerSync-backed sync
 */

import { getPowerSync } from './powersync-config';
import { queueSyncOperation, generateIdempotencyKey } from './idempotency';

/**
 * KDS item status
 */
export type KdsItemStatus = 'queued' | 'cooking' | 'ready' | 'recalled' | 'bumped';

/**
 * KDS action types
 */
export type KdsAction = 'start' | 'hold' | 'ready' | 'recall' | 'bump';

/**
 * KDS item for offline storage
 */
export interface OfflineKdsItem {
    id: string;
    order_id: string;
    order_item_id: string;
    station: string;
    status: KdsItemStatus;
    started_at?: string;
    ready_at?: string;
    recalled_at?: string;
    bumped_at?: string;
    priority: number;
    created_at: string;
    synced_at?: string;
    // Denormalized for display
    menu_item_name?: string;
    menu_item_name_am?: string;
    quantity?: number;
    modifiers_json?: string;
    notes?: string;
}

/**
 * Create a KDS item for an order item
 */
export async function createKdsItem(
    orderId: string,
    orderItemId: string,
    station: string,
    priority: number = 0,
    displayData?: {
        menu_item_name: string;
        menu_item_name_am?: string;
        quantity: number;
        modifiers_json?: string;
        notes?: string;
    }
): Promise<OfflineKdsItem | null> {
    const db = getPowerSync();
    if (!db) return null;

    const now = new Date().toISOString();
    const kdsId = crypto.randomUUID();

    try {
        await db.execute(
            `INSERT INTO kds_items (
                id, order_id, order_item_id, station, status, priority, created_at
            ) VALUES (?, ?, ?, ?, 'queued', ?, ?)`,
            [kdsId, orderId, orderItemId, station, priority, now]
        );

        // Also store display data in order_items for reference
        if (displayData) {
            await db.execute(`UPDATE order_items SET station = ?, status = 'queued' WHERE id = ?`, [
                station,
                orderItemId,
            ]);
        }

        const item = await getKdsItem(kdsId);
        return item;
    } catch (error) {
        console.error('[KdsSync] Failed to create KDS item:', error);
        return null;
    }
}

/**
 * Get a KDS item by ID
 */
export async function getKdsItem(kdsId: string): Promise<OfflineKdsItem | null> {
    const db = getPowerSync();
    if (!db) return null;

    const item = await db.getFirstAsync<OfflineKdsItem & { modifiers_json?: string }>(
        `SELECT k.*, oi.menu_item_name, oi.menu_item_name_am, oi.quantity, oi.modifiers_json, oi.notes
         FROM kds_items k
         JOIN order_items oi ON k.order_item_id = oi.id
         WHERE k.id = ?`,
        [kdsId]
    );

    return item ?? null;
}

/**
 * Get KDS items by station
 */
export async function getKdsItemsByStation(station: string): Promise<OfflineKdsItem[]> {
    const db = getPowerSync();
    if (!db) return [];

    const items = await db.getAllAsync<OfflineKdsItem>(
        `SELECT k.*, oi.menu_item_name, oi.menu_item_name_am, oi.quantity, oi.modifiers_json, oi.notes
         FROM kds_items k
         JOIN order_items oi ON k.order_item_id = oi.id
         WHERE k.station = ? AND k.status != 'bumped'
         ORDER BY k.priority DESC, k.created_at ASC`,
        [station]
    );

    return items;
}

/**
 * Get all KDS items for an order
 */
export async function getKdsItemsByOrder(orderId: string): Promise<OfflineKdsItem[]> {
    const db = getPowerSync();
    if (!db) return [];

    const items = await db.getAllAsync<OfflineKdsItem>(
        `SELECT k.*, oi.menu_item_name, oi.menu_item_name_am, oi.quantity, oi.modifiers_json, oi.notes
         FROM kds_items k
         JOIN order_items oi ON k.order_item_id = oi.id
         WHERE k.order_id = ?
         ORDER BY k.created_at ASC`,
        [orderId]
    );

    return items;
}

/**
 * Execute a KDS action
 */
export async function executeKdsAction(kdsId: string, action: KdsAction): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    const now = new Date().toISOString();
    const idempotencyKey = generateIdempotencyKey(`kds-${action}`);

    try {
        let newStatus: KdsItemStatus;
        let updateFields: string[] = [];
        let updateValues: (string | null)[] = [];

        switch (action) {
            case 'start':
                newStatus = 'cooking';
                updateFields = ['status = ?', 'started_at = ?'];
                updateValues = [newStatus, now];
                break;
            case 'hold':
                newStatus = 'queued';
                updateFields = ['status = ?'];
                updateValues = [newStatus];
                break;
            case 'ready':
                newStatus = 'ready';
                updateFields = ['status = ?', 'ready_at = ?'];
                updateValues = [newStatus, now];
                break;
            case 'recall':
                newStatus = 'cooking';
                updateFields = ['status = ?', 'recalled_at = ?'];
                updateValues = [newStatus, now];
                break;
            case 'bump':
                newStatus = 'bumped';
                updateFields = ['status = ?', 'bumped_at = ?'];
                updateValues = [newStatus, now];
                break;
            default:
                return false;
        }

        await db.execute(`UPDATE kds_items SET ${updateFields.join(', ')} WHERE id = ?`, [
            ...updateValues,
            kdsId,
        ]);

        // Also update the order_items status
        const kdsItem = await getKdsItem(kdsId);
        if (kdsItem) {
            let itemStatus: string;
            if (action === 'bump') {
                itemStatus = 'completed';
            } else if (action === 'ready') {
                itemStatus = 'ready';
            } else {
                itemStatus = 'cooking';
            }
            await db.execute(`UPDATE order_items SET status = ? WHERE id = ?`, [
                itemStatus,
                kdsItem.order_item_id,
            ]);
        }

        // Queue for sync
        await queueSyncOperation('update', 'kds_items', kdsId, {
            action,
            idempotency_key: idempotencyKey,
        });

        return true;
    } catch (error) {
        console.error('[KdsSync] Failed to execute KDS action:', error);
        return false;
    }
}

/**
 * Get KDS queue statistics
 */
export async function getKdsStats(station?: string): Promise<{
    queued: number;
    cooking: number;
    ready: number;
    total: number;
}> {
    const db = getPowerSync();
    if (!db) {
        return { queued: 0, cooking: 0, ready: 0, total: 0 };
    }

    let query = `SELECT status, COUNT(*) as count FROM kds_items WHERE status != 'bumped'`;
    const params: string[] = [];

    if (station) {
        query += ` AND station = ?`;
        params.push(station);
    }

    query += ` GROUP BY status`;

    const results = await db.getAllAsync<{ status: string; count: number }>(query, params);

    const stats = {
        queued: 0,
        cooking: 0,
        ready: 0,
        total: 0,
    };

    for (const row of results) {
        if (row.status === 'queued') stats.queued = row.count;
        else if (row.status === 'cooking') stats.cooking = row.count;
        else if (row.status === 'ready') stats.ready = row.count;
        stats.total += row.count;
    }

    return stats;
}

/**
 * Clear completed KDS items
 */
export async function clearBumpedKdsItems(olderThanHours: number = 24): Promise<number> {
    const db = getPowerSync();
    if (!db) return 0;

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const result = await db.execute(
        `DELETE FROM kds_items WHERE status = 'bumped' AND bumped_at < ?`,
        [cutoffDate.toISOString()]
    );

    return result.rowsAffected;
}
