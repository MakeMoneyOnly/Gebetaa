import Dexie, { Table } from 'dexie';

/**
 * Sync conflict resolution implementation
 * Addresses ARCH-2: Last-write-wins with audit trail
 */

export interface PendingOrder {
    id?: number;
    restaurant_id: string;
    table_number: number;
    items: { id: string; name: string; quantity: number; price: number }[];
    total_price: number;
    notes: string;
    idempotency_key: string;
    created_at: string;
    status: 'pending' | 'syncing' | 'conflict' | 'resolved';
    // Conflict resolution fields
    version: number;
    last_modified: string;
    server_version?: number;
    conflict_reason?: string;
    resolved_at?: string;
    resolution_strategy?: 'client_wins' | 'server_wins' | 'manual';
}

export interface SyncConflictLog {
    id?: number;
    idempotency_key: string;
    client_version: number;
    server_version: number;
    client_data: string; // JSON stringified
    server_data: string; // JSON stringified
    resolution: 'client_wins' | 'server_wins' | 'manual';
    resolved_at: string;
    resolved_by?: string;
}

export interface SyncStatus {
    last_sync_at: string | null;
    pending_count: number;
    conflict_count: number;
    is_online: boolean;
}

export class OrderDatabase extends Dexie {
    pending_orders!: Table<PendingOrder>;
    sync_conflict_logs!: Table<SyncConflictLog>;

    constructor() {
        super('GebetaOrders');
        this.version(2).stores({
            pending_orders: '++id, idempotency_key, restaurant_id, status, version',
            sync_conflict_logs: '++id, idempotency_key, resolved_at',
        });
    }
}

export const db = new OrderDatabase();

/**
 * Adds an order to the offline queue with version tracking
 */
export async function queueOrder(
    order: Omit<PendingOrder, 'id' | 'created_at' | 'status' | 'version' | 'last_modified'>
) {
    try {
        const now = new Date().toISOString();
        return await db.pending_orders.add({
            ...order,
            created_at: now,
            last_modified: now,
            status: 'pending',
            version: 1,
        });
    } catch (error) {
        console.error('Failed to queue order:', error);
        throw error;
    }
}

/**
 * Updates an order in the queue (increments version)
 */
export async function updateQueuedOrder(
    id: number,
    updates: Partial<Pick<PendingOrder, 'items' | 'total_price' | 'notes'>>
) {
    try {
        const existing = await db.pending_orders.get(id);
        if (!existing) {
            throw new Error(`Order ${id} not found in queue`);
        }

        const now = new Date().toISOString();
        return await db.pending_orders.update(id, {
            ...updates,
            last_modified: now,
            version: existing.version + 1,
        });
    } catch (error) {
        console.error('Failed to update queued order:', error);
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
 * Gets orders that are ready to sync (pending status)
 */
export async function getOrdersToSync() {
    return await db.pending_orders.where('status').equals('pending').toArray();
}

/**
 * Gets orders with conflicts
 */
export async function getConflictedOrders() {
    return await db.pending_orders.where('status').equals('conflict').toArray();
}

/**
 * Marks an order as syncing (during sync attempt)
 */
export async function markOrderSyncing(id: number) {
    return await db.pending_orders.update(id, { status: 'syncing' });
}

/**
 * Removes an order from the queue (after successful sync)
 */
export async function removeQueuedOrder(id: number) {
    return await db.pending_orders.delete(id);
}

/**
 * Handles sync conflict with last-write-wins strategy
 * @param id - Local order ID
 * @param serverOrder - Order data from server
 * @param strategy - Resolution strategy (default: last-write-wins)
 */
export async function resolveConflict(
    id: number,
    serverOrder: { version: number; last_modified: string; [key: string]: unknown },
    strategy: 'client_wins' | 'server_wins' | 'last_write_wins' = 'last_write_wins'
): Promise<{ resolved: boolean; strategy: string; reason: string }> {
    const localOrder = await db.pending_orders.get(id);
    if (!localOrder) {
        throw new Error(`Order ${id} not found`);
    }

    const localTime = new Date(localOrder.last_modified).getTime();
    const serverTime = new Date(serverOrder.last_modified).getTime();

    let resolution: 'client_wins' | 'server_wins';
    let reason: string;

    // Determine resolution based on strategy
    if (strategy === 'last_write_wins') {
        resolution = localTime > serverTime ? 'client_wins' : 'server_wins';
        reason = `Last write wins: ${resolution === 'client_wins' ? 'client' : 'server'} modified at ${resolution === 'client_wins' ? localOrder.last_modified : serverOrder.last_modified}`;
    } else {
        resolution = strategy as 'client_wins' | 'server_wins';
        reason = `Manual strategy: ${resolution}`;
    }

    // Log the conflict for audit trail
    await db.sync_conflict_logs.add({
        idempotency_key: localOrder.idempotency_key,
        client_version: localOrder.version,
        server_version: serverOrder.version,
        client_data: JSON.stringify(localOrder),
        server_data: JSON.stringify(serverOrder),
        resolution,
        resolved_at: new Date().toISOString(),
    });

    // Apply resolution
    const now = new Date().toISOString();

    if (resolution === 'client_wins') {
        // Keep client version, mark as pending to retry sync
        await db.pending_orders.update(id, {
            status: 'pending',
            version: localOrder.version + 1,
            server_version: serverOrder.version,
            resolved_at: now,
            resolution_strategy: resolution,
        });
    } else {
        // Accept server version, mark as resolved
        await db.pending_orders.update(id, {
            status: 'resolved',
            version: serverOrder.version,
            server_version: serverOrder.version,
            resolved_at: now,
            resolution_strategy: resolution,
            conflict_reason: reason,
        });
        // Remove from queue as it's now synced with server
        await db.pending_orders.delete(id);
    }

    return { resolved: true, strategy: resolution, reason };
}

/**
 * Gets sync status summary
 */
export async function getSyncStatus(): Promise<SyncStatus> {
    const [pendingOrders, conflictedOrders] = await Promise.all([
        db.pending_orders.where('status').equals('pending').count(),
        db.pending_orders.where('status').equals('conflict').count(),
    ]);

    const lastSyncLog = await db.sync_conflict_logs.orderBy('resolved_at').last();

    return {
        last_sync_at: lastSyncLog?.resolved_at || null,
        pending_count: pendingOrders,
        conflict_count: conflictedOrders,
        is_online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
}

/**
 * Gets conflict audit log
 */
export async function getConflictLogs(limit: number = 50): Promise<SyncConflictLog[]> {
    return await db.sync_conflict_logs.orderBy('resolved_at').reverse().limit(limit).toArray();
}

/**
 * Clears all pending orders from the queue
 * USE WITH CAUTION - primarily for testing
 */
export async function clearAllPendingOrders() {
    return await db.pending_orders.clear();
}

/**
 * Clears all conflict logs
 * USE WITH CAUTION - primarily for testing
 */
export async function clearConflictLogs() {
    return await db.sync_conflict_logs.clear();
}
