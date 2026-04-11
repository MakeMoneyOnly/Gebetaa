/**
 * Conflict Resolution for Offline Sync
 *
 * Implements last-write-wins with audit trail conflict resolution
 * for offline-first operations.
 *
 * HIGH-024: Conflict resolution strategies for offline sync
 */

import { getPowerSync } from './powersync-config';
import { logger } from '@/lib/logger';

/**
 * Conflict resolution strategy types
 */
export type ConflictStrategy = 'last_write_wins' | 'server_wins' | 'client_wins' | 'merge';

/**
 * Conflict record for audit trail
 */
export interface ConflictRecord {
    id: string;
    entity_type: string;
    entity_id: string;
    strategy: ConflictStrategy;
    client_version: number;
    server_version: number;
    client_data: Record<string, unknown>;
    server_data: Record<string, unknown>;
    resolved_data: Record<string, unknown>;
    created_at: string;
    resolved_at: string;
}

/**
 * Sync conflict log entry
 */
export interface SyncConflictLog {
    id: string;
    entity_type: string;
    entity_id: string;
    conflict_type: 'version_mismatch' | 'concurrent_edit' | 'delete_update';
    client_timestamp: string;
    server_timestamp: string;
    resolution_strategy: ConflictStrategy;
    resolution_details: Record<string, unknown>;
    created_at: string;
}

/**
 * Entity-specific conflict resolution configuration
 */
const ENTITY_STRATEGIES: Record<string, ConflictStrategy> = {
    orders: 'last_write_wins',
    order_items: 'last_write_wins',
    kds_items: 'server_wins',
    menu_items: 'server_wins',
    tables: 'last_write_wins',
    guests: 'last_write_wins',
    payments: 'server_wins',
};

/**
 * Fields to exclude from conflict detection (auto-merged)
 */
const EXCLUDED_FIELDS: Record<string, string[]> = {
    orders: ['synced_at', 'updated_at', 'last_modified'],
    order_items: ['synced_at', 'updated_at', 'last_modified'],
    kds_items: ['synced_at', 'updated_at', 'last_modified'],
};

/**
 * Detect if there is a conflict between client and server data
 */
export function detectConflict(
    clientData: { version: number; last_modified: string },
    serverData: { version: number; last_modified: string }
): boolean {
    // Conflict exists if versions differ
    return clientData.version !== serverData.version;
}

/**
 * Determine conflict type based on data state
 */
export function getConflictType(
    clientData: { deleted_at?: string | null; version: number },
    serverData: { deleted_at?: string | null; version: number }
): 'version_mismatch' | 'concurrent_edit' | 'delete_update' {
    const clientDeleted = !!clientData.deleted_at;
    const serverDeleted = !!serverData.deleted_at;

    if (clientDeleted && !serverDeleted) {
        return 'delete_update';
    }
    if (!clientDeleted && serverDeleted) {
        return 'delete_update';
    }
    if (Math.abs(clientData.version - serverData.version) > 1) {
        return 'version_mismatch';
    }
    return 'concurrent_edit';
}

/**
 * Resolve conflict using the appropriate strategy
 */
export function resolveConflict(
    entityType: string,
    clientData: Record<string, unknown> & { version: number; last_modified: string },
    serverData: Record<string, unknown> & { version: number; last_modified: string },
    strategy?: ConflictStrategy
): {
    resolvedData: Record<string, unknown>;
    strategy: ConflictStrategy;
    auditDetails: Record<string, unknown>;
} {
    const resolvedStrategy = strategy ?? ENTITY_STRATEGIES[entityType] ?? 'last_write_wins';
    const excludedFields = EXCLUDED_FIELDS[entityType] ?? [];

    let resolvedData: Record<string, unknown>;
    const auditDetails: Record<string, unknown> = {
        strategy: resolvedStrategy,
        clientVersion: clientData.version,
        serverVersion: serverData.version,
        clientTimestamp: clientData.last_modified,
        serverTimestamp: serverData.last_modified,
    };

    switch (resolvedStrategy) {
        case 'server_wins':
            // Server data takes precedence
            resolvedData = { ...serverData };
            auditDetails.winner = 'server';
            break;

        case 'client_wins':
            // Client data takes precedence
            resolvedData = { ...clientData };
            // Increment version to be higher than server
            resolvedData.version = Math.max(clientData.version, serverData.version) + 1;
            auditDetails.winner = 'client';
            break;

        case 'merge':
            // Merge strategy: combine non-conflicting fields
            resolvedData = mergeData(clientData, serverData, excludedFields);
            resolvedData.version = Math.max(clientData.version, serverData.version) + 1;
            auditDetails.winner = 'merged';
            break;

        case 'last_write_wins':
        default:
            // Compare timestamps, most recent wins
            const clientTime = new Date(clientData.last_modified).getTime();
            const serverTime = new Date(serverData.last_modified).getTime();

            if (clientTime >= serverTime) {
                resolvedData = { ...clientData };
                resolvedData.version = Math.max(clientData.version, serverData.version) + 1;
                auditDetails.winner = 'client';
                auditDetails.timeDiff = clientTime - serverTime;
            } else {
                resolvedData = { ...serverData };
                auditDetails.winner = 'server';
                auditDetails.timeDiff = serverTime - clientTime;
            }
            break;
    }

    // Update last_modified to now
    resolvedData.last_modified = new Date().toISOString();
    resolvedData.updated_at = new Date().toISOString();

    return { resolvedData, strategy: resolvedStrategy, auditDetails };
}

/**
 * Merge client and server data, preferring non-null values
 */
function mergeData(
    clientData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    excludedFields: string[]
): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    const allKeys = new Set([...Object.keys(clientData), ...Object.keys(serverData)]);

    for (const key of allKeys) {
        if (excludedFields.includes(key)) {
            // Use server value for excluded fields
            merged[key] = serverData[key];
            continue;
        }

        const clientValue = clientData[key];
        const serverValue = serverData[key];

        // Prefer non-null, non-undefined values
        if (clientValue === null || clientValue === undefined) {
            merged[key] = serverValue;
        } else if (serverValue === null || serverValue === undefined) {
            merged[key] = clientValue;
        } else if (
            typeof clientValue === 'object' &&
            typeof serverValue === 'object' &&
            !Array.isArray(clientValue) &&
            !Array.isArray(serverValue)
        ) {
            // Recursively merge objects
            merged[key] = mergeData(
                clientValue as Record<string, unknown>,
                serverValue as Record<string, unknown>,
                []
            );
        } else {
            // For primitive values, prefer client (user's intent)
            merged[key] = clientValue;
        }
    }

    return merged;
}

/**
 * Log conflict resolution to audit trail
 */
export async function logConflictResolution(params: {
    entityType: string;
    entityId: string;
    conflictType: 'version_mismatch' | 'concurrent_edit' | 'delete_update';
    clientData: Record<string, unknown>;
    serverData: Record<string, unknown>;
    resolvedData: Record<string, unknown>;
    strategy: ConflictStrategy;
    auditDetails: Record<string, unknown>;
}): Promise<void> {
    const db = getPowerSync();
    if (!db) {
        logger.warn('[ConflictResolution] PowerSync not initialized, skipping audit log');
        return;
    }

    try {
        const now = new Date().toISOString();
        const logId = crypto.randomUUID();

        await db.execute(
            `INSERT INTO sync_conflict_logs (
                id, entity_type, entity_id, conflict_type,
                client_timestamp, server_timestamp, resolution_strategy,
                resolution_details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                logId,
                params.entityType,
                params.entityId,
                params.conflictType,
                (params.clientData.last_modified as string) ?? now,
                (params.serverData.last_modified as string) ?? now,
                params.strategy,
                JSON.stringify(params.auditDetails),
                now,
            ]
        );

        logger.info('[ConflictResolution] Conflict resolved and logged', {
            entityType: params.entityType,
            entityId: params.entityId,
            strategy: params.strategy,
            winner: params.auditDetails.winner,
        });
    } catch (error) {
        logger.error('[ConflictResolution] Failed to log conflict resolution', error);
    }
}

/**
 * Handle sync conflict for an entity
 * This is the main entry point for conflict resolution
 */
export async function handleSyncConflict(params: {
    entityType: string;
    entityId: string;
    clientData: Record<string, unknown> & { version: number; last_modified: string };
    serverData: Record<string, unknown> & { version: number; last_modified: string };
    strategy?: ConflictStrategy;
}): Promise<{
    resolved: boolean;
    resolvedData?: Record<string, unknown>;
    error?: string;
}> {
    const { entityType, entityId, clientData, serverData, strategy } = params;

    try {
        // Detect conflict type
        const conflictType = getConflictType(
            clientData as { deleted_at?: string | null; version: number },
            serverData as { deleted_at?: string | null; version: number }
        );

        // Resolve the conflict
        const {
            resolvedData,
            strategy: usedStrategy,
            auditDetails,
        } = resolveConflict(entityType, clientData, serverData, strategy);

        // Log the resolution
        await logConflictResolution({
            entityType,
            entityId,
            conflictType,
            clientData,
            serverData,
            resolvedData,
            strategy: usedStrategy,
            auditDetails,
        });

        return {
            resolved: true,
            resolvedData,
        };
    } catch (error) {
        logger.error('[ConflictResolution] Failed to handle sync conflict', {
            entityType,
            entityId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            resolved: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get conflict history for an entity
 */
export async function getConflictHistory(
    entityType: string,
    entityId: string,
    limit: number = 10
): Promise<SyncConflictLog[]> {
    const db = getPowerSync();
    if (!db) return [];

    try {
        const logs = await db.getAllAsync<SyncConflictLog>(
            `SELECT * FROM sync_conflict_logs
             WHERE entity_type = ? AND entity_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [entityType, entityId, limit]
        );

        return logs;
    } catch (error) {
        logger.error('[ConflictResolution] Failed to get conflict history', error);
        return [];
    }
}

/**
 * Get unresolved conflicts count
 */
export async function getUnresolvedConflictsCount(): Promise<number> {
    const db = getPowerSync();
    if (!db) return 0;

    try {
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM orders WHERE status = 'conflict'`
        );

        return result?.count ?? 0;
    } catch (error) {
        logger.error('[ConflictResolution] Failed to get unresolved conflicts count', error);
        return 0;
    }
}

/**
 * Batch resolve conflicts for multiple entities
 */
export async function batchResolveConflicts(
    conflicts: Array<{
        entityType: string;
        entityId: string;
        clientData: Record<string, unknown> & { version: number; last_modified: string };
        serverData: Record<string, unknown> & { version: number; last_modified: string };
    }>
): Promise<{
    resolved: number;
    failed: number;
    errors: string[];
}> {
    let resolved = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const conflict of conflicts) {
        const result = await handleSyncConflict(conflict);

        if (result.resolved) {
            resolved++;
        } else {
            failed++;
            errors.push(`${conflict.entityType}:${conflict.entityId} - ${result.error}`);
        }
    }

    logger.info('[ConflictResolution] Batch resolution complete', {
        total: conflicts.length,
        resolved,
        failed,
    });

    return { resolved, failed, errors };
}

/**
 * Reconcile local data with server data after a successful sync.
 * Updates the local PowerSync record with the server's current version
 * to prevent future false conflicts.
 *
 * HIGH-006: Server reconciliation on sync completion
 */
export async function reconcileWithServer(params: {
    entityType: string;
    entityId: string;
    serverData: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
    const db = getPowerSync();
    if (!db) {
        return { success: false, error: 'PowerSync not initialized' };
    }

    try {
        const { entityType, entityId, serverData } = params;
        const now = new Date().toISOString();

        const tableMap: Record<string, string> = {
            orders: 'orders',
            order_items: 'order_items',
            kds_items: 'kds_items',
            kds_order_items: 'kds_items',
            menu_items: 'menu_items',
            tables: 'tables',
            guests: 'guests',
            payments: 'payments',
        };

        const tableName = tableMap[entityType];
        if (!tableName) {
            logger.warn('[ConflictResolution] Unknown entity type for reconciliation', {
                entityType,
            });
            return { success: false, error: `Unknown entity type: ${entityType}` };
        }

        const excludedFields = ['id', 'created_at', 'restaurant_id'];
        const updateFields: string[] = [];
        const updateValues: unknown[] = [];

        for (const [key, value] of Object.entries(serverData)) {
            if (excludedFields.includes(key)) continue;
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }

        if (updateFields.length === 0) {
            return { success: true };
        }

        if (serverData.version !== undefined) {
            const versionIdx = updateFields.findIndex(f => f.startsWith('version'));
            if (versionIdx >= 0) {
                updateValues[versionIdx] = serverData.version;
            } else {
                updateFields.push('version = ?');
                updateValues.push(serverData.version);
            }
        }

        const lastModIdx = updateFields.findIndex(f => f.startsWith('last_modified'));
        if (lastModIdx >= 0) {
            updateValues[lastModIdx] = serverData.last_modified ?? now;
        } else {
            updateFields.push('last_modified = ?');
            updateValues.push(serverData.last_modified ?? now);
        }

        updateFields.push('updated_at = ?');
        updateValues.push(now);

        updateValues.push(entityId);

        await db.execute(
            `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        logger.info('[ConflictResolution] Reconciled with server', {
            entityType,
            entityId,
            fieldsUpdated: updateFields.length,
        });

        return { success: true };
    } catch (error) {
        logger.error('[ConflictResolution] Failed to reconcile with server', {
            entityType: params.entityType,
            entityId: params.entityId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
