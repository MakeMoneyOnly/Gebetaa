/**
 * KDS Sync Adapter
 *
 * Provides backward compatibility with old localStorage-based KDS queue
 * while using PowerSync when available
 */

import { getPowerSync } from '@/lib/sync/powersync-config';

/**
 * Get the offline KDS queue count
 * Uses PowerSync when available, falls back to localStorage
 */
export async function getOfflineKdsQueueCount(): Promise<number> {
    const db = getPowerSync();

    if (db) {
        // Use PowerSync
        try {
            const result = await db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM sync_queue WHERE table_name = 'kds_items' AND status = 'pending'`
            );
            return result?.count ?? 0;
        } catch {
            // Fall through to localStorage
        }
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return 0;

    try {
        const stored = window.localStorage.getItem('lole_kds_offline_queue_v1');
        if (!stored) return 0;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed.pendingActions) ? parsed.pendingActions.length : 0;
    } catch {
        return 0;
    }
}

/**
 * Get all pending KDS actions
 * Uses PowerSync when available, falls back to localStorage
 */
export async function getPendingKdsActions(): Promise<
    Array<{
        id: string;
        orderId: string;
        itemId: string;
        kdsItemId: string;
        action: string;
        reason?: string;
        enqueuedAt: string;
        attempts: number;
        idempotencyKey: string;
    }>
> {
    const db = getPowerSync();

    if (db) {
        // Use PowerSync
        try {
            const results = await db.getAllAsync<{
                id: number;
                record_id: string;
                payload: string;
                attempts: number;
                created_at: string;
                idempotency_key: string;
            }>(
                `SELECT id, record_id, payload, attempts, created_at, idempotency_key 
                 FROM sync_queue 
                 WHERE table_name = 'kds_items' AND status = 'pending'`
            );

            return results.map(row => {
                const payload = JSON.parse(row.payload || '{}');
                return {
                    id: String(row.id),
                    orderId: payload.orderId || '',
                    itemId: payload.itemId || '',
                    kdsItemId: row.record_id,
                    action: payload.action || 'start',
                    reason: payload.reason,
                    enqueuedAt: row.created_at,
                    attempts: row.attempts,
                    idempotencyKey: row.idempotency_key,
                };
            });
        } catch {
            // Fall through to localStorage
        }
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return [];

    try {
        const stored = window.localStorage.getItem('lole_kds_offline_queue_v1');
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.pendingActions || [];
    } catch {
        return [];
    }
}

/**
 * Add a KDS action to the offline queue
 * Uses PowerSync when available, falls back to localStorage
 */
export async function addKdsActionToQueue(action: {
    orderId: string;
    itemId: string;
    kdsItemId: string;
    action: string;
    reason?: string;
}): Promise<void> {
    const db = getPowerSync();
    const idempotencyKey = crypto.randomUUID();
    const now = new Date().toISOString();

    if (db) {
        // Use PowerSync
        try {
            await db.execute(
                `INSERT INTO sync_queue (operation, table_name, record_id, payload, idempotency_key, status, attempts, created_at)
                 VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
                [
                    'update',
                    'kds_items',
                    action.kdsItemId,
                    JSON.stringify(action),
                    idempotencyKey,
                    now,
                ]
            );
            return;
        } catch {
            // Fall through to localStorage
        }
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return;

    try {
        const STORAGE_KEY = 'lole_kds_offline_queue_v1';
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const state = stored
            ? JSON.parse(stored)
            : { pendingActions: [], lastSync: null, conflictResolution: 'server-wins' };

        state.pendingActions.push({
            id: crypto.randomUUID(),
            ...action,
            enqueuedAt: now,
            attempts: 0,
            idempotencyKey,
        });

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore errors
    }
}

/**
 * Clear synced KDS actions
 * Uses PowerSync when available, falls back to localStorage
 */
export async function clearSyncedKdsActions(): Promise<void> {
    const db = getPowerSync();

    if (db) {
        // Use PowerSync
        try {
            await db.execute(
                `DELETE FROM sync_queue WHERE table_name = 'kds_items' AND status = 'completed'`
            );
        } catch {
            // Fall through to localStorage
        }
    }

    // Also clear localStorage
    if (typeof window === 'undefined') return;

    try {
        const STORAGE_KEY = 'lole_kds_offline_queue_v1';
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                pendingActions: [],
                lastSync: new Date().toISOString(),
                conflictResolution: 'server-wins',
            })
        );
    } catch {
        // Ignore errors
    }
}
