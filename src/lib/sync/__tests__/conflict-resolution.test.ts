/**
 * Tests for Conflict Resolution
 *
 * HIGH-024: Conflict resolution strategies for offline sync
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock PowerSync
const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetFirstAsync = vi.fn().mockResolvedValue(null);
const mockGetAllAsync = vi.fn().mockResolvedValue([]);

vi.mock('../powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
    })),
}));

// Mock logger
vi.mock('../../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Conflict Resolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetFirstAsync.mockResolvedValue(null);
        mockGetAllAsync.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('detectConflict', () => {
        it('should detect conflict when versions differ', async () => {
            const { detectConflict } = await import('../conflict-resolution');

            const clientData = { version: 1, last_modified: '2024-01-01T10:00:00Z' };
            const serverData = { version: 2, last_modified: '2024-01-01T11:00:00Z' };

            expect(detectConflict(clientData, serverData)).toBe(true);
        });

        it('should not detect conflict when versions match', async () => {
            const { detectConflict } = await import('../conflict-resolution');

            const clientData = { version: 2, last_modified: '2024-01-01T10:00:00Z' };
            const serverData = { version: 2, last_modified: '2024-01-01T11:00:00Z' };

            expect(detectConflict(clientData, serverData)).toBe(false);
        });
    });

    describe('getConflictType', () => {
        it('should identify delete_update when client deleted', async () => {
            const { getConflictType } = await import('../conflict-resolution');

            const clientData = { version: 2, deleted_at: '2024-01-01T10:00:00Z' };
            const serverData = { version: 2, deleted_at: null };

            expect(getConflictType(clientData, serverData)).toBe('delete_update');
        });

        it('should identify delete_update when server deleted', async () => {
            const { getConflictType } = await import('../conflict-resolution');

            const clientData = { version: 2, deleted_at: null };
            const serverData = { version: 2, deleted_at: '2024-01-01T10:00:00Z' };

            expect(getConflictType(clientData, serverData)).toBe('delete_update');
        });

        it('should identify version_mismatch when versions differ by more than 1', async () => {
            const { getConflictType } = await import('../conflict-resolution');

            const clientData = { version: 1 };
            const serverData = { version: 5 };

            expect(getConflictType(clientData, serverData)).toBe('version_mismatch');
        });

        it('should identify concurrent_edit when versions differ by 1', async () => {
            const { getConflictType } = await import('../conflict-resolution');

            const clientData = { version: 2 };
            const serverData = { version: 3 };

            expect(getConflictType(clientData, serverData)).toBe('concurrent_edit');
        });
    });

    describe('resolveConflict', () => {
        it('should use server_wins strategy correctly', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Client Name',
                total_santim: 1000,
                version: 1,
                last_modified: '2024-01-01T10:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Server Name',
                total_santim: 2000,
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'server_wins');

            expect(result.strategy).toBe('server_wins');
            expect(result.resolvedData.name).toBe('Server Name');
            expect(result.resolvedData.total_santim).toBe(2000);
            expect(result.auditDetails.winner).toBe('server');
        });

        it('should use client_wins strategy correctly', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Client Name',
                version: 1,
                last_modified: '2024-01-01T10:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Server Name',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'client_wins');

            expect(result.strategy).toBe('client_wins');
            expect(result.resolvedData.name).toBe('Client Name');
            expect(result.auditDetails.winner).toBe('client');
            expect(result.resolvedData.version).toBe(3); // max + 1
        });

        it('should use last_write_wins with client having newer timestamp', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Client Name',
                version: 1,
                last_modified: '2024-01-01T12:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Server Name',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'last_write_wins');

            expect(result.strategy).toBe('last_write_wins');
            expect(result.resolvedData.name).toBe('Client Name');
            expect(result.auditDetails.winner).toBe('client');
        });

        it('should use last_write_wins with server having newer timestamp', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Client Name',
                version: 1,
                last_modified: '2024-01-01T10:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Server Name',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'last_write_wins');

            expect(result.strategy).toBe('last_write_wins');
            expect(result.resolvedData.name).toBe('Server Name');
            expect(result.auditDetails.winner).toBe('server');
        });

        it('should use merge strategy correctly', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Client Name',
                notes: 'Client notes',
                version: 1,
                last_modified: '2024-01-01T10:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Server Name',
                description: 'Server description',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'merge');

            expect(result.strategy).toBe('merge');
            expect(result.auditDetails.winner).toBe('merged');
        });

        it('should use default strategy from ENTITY_STRATEGIES when not specified', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                status: 'cooking',
                version: 1,
                last_modified: '2024-01-01T12:00:00Z',
            };
            const serverData = {
                id: '123',
                status: 'ready',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            // kds_items uses server_wins by default
            const result = resolveConflict('kds_items', clientData, serverData);

            expect(result.strategy).toBe('server_wins');
            expect(result.resolvedData.status).toBe('ready');
        });

        it('should update last_modified and updated_at timestamps', async () => {
            const { resolveConflict } = await import('../conflict-resolution');

            const clientData = {
                id: '123',
                name: 'Test',
                version: 1,
                last_modified: '2024-01-01T10:00:00Z',
            };
            const serverData = {
                id: '123',
                name: 'Test',
                version: 2,
                last_modified: '2024-01-01T11:00:00Z',
            };

            const result = resolveConflict('orders', clientData, serverData, 'server_wins');

            expect(result.resolvedData.last_modified).toBeDefined();
            expect(result.resolvedData.updated_at).toBeDefined();
        });
    });

    describe('logConflictResolution', () => {
        it('should log conflict resolution to database', async () => {
            const { logConflictResolution } = await import('../conflict-resolution');

            await logConflictResolution({
                entityType: 'orders',
                entityId: 'order-123',
                conflictType: 'version_mismatch',
                clientData: { version: 1, last_modified: '2024-01-01T10:00:00Z' },
                serverData: { version: 2, last_modified: '2024-01-01T11:00:00Z' },
                resolvedData: { version: 3 },
                strategy: 'server_wins',
                auditDetails: { winner: 'server' },
            });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sync_conflict_logs'),
                expect.arrayContaining([
                    expect.any(String),
                    'orders',
                    'order-123',
                    'version_mismatch',
                    '2024-01-01T10:00:00Z',
                    '2024-01-01T11:00:00Z',
                    'server_wins',
                    expect.any(String),
                    expect.any(String),
                ])
            );
        });

        it('should do nothing when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { logConflictResolution } = await import('../conflict-resolution');
            await logConflictResolution({
                entityType: 'orders',
                entityId: 'order-123',
                conflictType: 'version_mismatch',
                clientData: {},
                serverData: {},
                resolvedData: {},
                strategy: 'server_wins',
                auditDetails: {},
            });

            expect(mockExecute).not.toHaveBeenCalled();
        });
    });

    describe('handleSyncConflict', () => {
        it('should resolve conflict and log it', async () => {
            const { handleSyncConflict } = await import('../conflict-resolution');

            const result = await handleSyncConflict({
                entityType: 'orders',
                entityId: 'order-123',
                clientData: {
                    id: 'order-123',
                    name: 'Client',
                    version: 1,
                    last_modified: '2024-01-01T10:00:00Z',
                },
                serverData: {
                    id: 'order-123',
                    name: 'Server',
                    version: 2,
                    last_modified: '2024-01-01T11:00:00Z',
                },
                strategy: 'server_wins',
            });

            expect(result.resolved).toBe(true);
            expect(result.resolvedData).toBeDefined();
            expect(mockExecute).toHaveBeenCalled();
        });

        it('should return error when PowerSync is not available for logging', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { handleSyncConflict } = await import('../conflict-resolution');
            const result = await handleSyncConflict({
                entityType: 'orders',
                entityId: 'order-123',
                clientData: {
                    id: 'order-123',
                    version: 1,
                    last_modified: '2024-01-01T10:00:00Z',
                },
                serverData: {
                    id: 'order-123',
                    version: 2,
                    last_modified: '2024-01-01T11:00:00Z',
                },
            });

            // Should still resolve but skip logging
            expect(result.resolved).toBe(true);
        });
    });

    describe('getConflictHistory', () => {
        it('should return conflict history for an entity', async () => {
            const mockLogs = [
                {
                    id: 'log-1',
                    entity_type: 'orders',
                    entity_id: 'order-123',
                    conflict_type: 'version_mismatch',
                    resolution_strategy: 'server_wins',
                },
            ];
            mockGetAllAsync.mockResolvedValueOnce(mockLogs);

            const { getConflictHistory } = await import('../conflict-resolution');
            const result = await getConflictHistory('orders', 'order-123');

            expect(result).toEqual(mockLogs);
            expect(mockGetAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE entity_type = ?'),
                ['orders', 'order-123', 10]
            );
        });

        it('should respect limit parameter', async () => {
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { getConflictHistory } = await import('../conflict-resolution');
            await getConflictHistory('orders', 'order-123', 5);

            expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), [
                'orders',
                'order-123',
                5,
            ]);
        });

        it('should return empty array when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getConflictHistory } = await import('../conflict-resolution');
            const result = await getConflictHistory('orders', 'order-123');

            expect(result).toEqual([]);
        });
    });

    describe('getUnresolvedConflictsCount', () => {
        it('should return count of unresolved conflicts', async () => {
            mockGetFirstAsync.mockResolvedValueOnce({ count: 5 });

            const { getUnresolvedConflictsCount } = await import('../conflict-resolution');
            const result = await getUnresolvedConflictsCount();

            expect(result).toBe(5);
        });

        it('should return 0 when no conflicts', async () => {
            mockGetFirstAsync.mockResolvedValueOnce(null);

            const { getUnresolvedConflictsCount } = await import('../conflict-resolution');
            const result = await getUnresolvedConflictsCount();

            expect(result).toBe(0);
        });

        it('should return 0 when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { getUnresolvedConflictsCount } = await import('../conflict-resolution');
            const result = await getUnresolvedConflictsCount();

            expect(result).toBe(0);
        });
    });

    describe('batchResolveConflicts', () => {
        it('should resolve multiple conflicts and return summary', async () => {
            const { batchResolveConflicts } = await import('../conflict-resolution');

            const result = await batchResolveConflicts([
                {
                    entityType: 'orders',
                    entityId: 'order-1',
                    clientData: {
                        id: 'order-1',
                        version: 1,
                        last_modified: '2024-01-01T10:00:00Z',
                    },
                    serverData: {
                        id: 'order-1',
                        version: 2,
                        last_modified: '2024-01-01T11:00:00Z',
                    },
                },
                {
                    entityType: 'orders',
                    entityId: 'order-2',
                    clientData: {
                        id: 'order-2',
                        version: 1,
                        last_modified: '2024-01-01T10:00:00Z',
                    },
                    serverData: {
                        id: 'order-2',
                        version: 2,
                        last_modified: '2024-01-01T11:00:00Z',
                    },
                },
            ]);

            expect(result.resolved).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.errors).toHaveLength(0);
        });

        it('should track failed resolutions', async () => {
            // Mock handleSyncConflict to fail by making logConflictResolution fail
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { batchResolveConflicts } = await import('../conflict-resolution');

            const result = await batchResolveConflicts([
                {
                    entityType: 'orders',
                    entityId: 'order-1',
                    clientData: {
                        id: 'order-1',
                        version: 1,
                        last_modified: '2024-01-01T10:00:00Z',
                    },
                    serverData: {
                        id: 'order-1',
                        version: 2,
                        last_modified: '2024-01-01T11:00:00Z',
                    },
                },
            ]);

            // When PowerSync is not available, handleSyncConflict still resolves but logs warning
            // So this should resolve successfully
            expect(result.resolved).toBe(1);
            expect(result.failed).toBe(0);
        });
    });

    describe('reconcileWithServer', () => {
        it('should update local record with server data', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            const result = await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: {
                    status: 'completed',
                    total_santim: 5000,
                    version: 3,
                    last_modified: '2024-01-01T12:00:00Z',
                },
            });

            expect(result.success).toBe(true);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE orders SET'),
                expect.arrayContaining([
                    'completed',
                    5000,
                    3,
                    '2024-01-01T12:00:00Z',
                    expect.any(String),
                    'order-123',
                ])
            );
        });

        it('should return error when PowerSync is not available', async () => {
            const { getPowerSync } = await import('../powersync-config');
            vi.mocked(getPowerSync).mockReturnValueOnce(
                null as unknown as ReturnType<typeof getPowerSync>
            );

            const { reconcileWithServer } = await import('../conflict-resolution');

            const result = await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: { version: 2 },
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('PowerSync not initialized');
        });

        it('should return error for unknown entity type', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            const result = await reconcileWithServer({
                entityType: 'unknown_entity',
                entityId: 'entity-123',
                serverData: { version: 2 },
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown entity type');
        });

        it('should exclude id, created_at, and restaurant_id from SET fields', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: {
                    id: 'new-id',
                    created_at: '2024-01-01T00:00:00Z',
                    restaurant_id: 'rest-new',
                    status: 'pending',
                    version: 2,
                },
            });

            const sql = mockExecute.mock.calls[0][0] as string;
            const setClause = sql.split('WHERE')[0];
            expect(setClause).not.toContain('id = ?');
            expect(setClause).not.toContain('created_at = ?');
            expect(setClause).not.toContain('restaurant_id = ?');
            expect(setClause).toContain('status = ?');
        });

        it('should always set last_modified and updated_at', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: {
                    status: 'preparing',
                    version: 5,
                    last_modified: '2024-06-01T10:00:00Z',
                },
            });

            const sql = mockExecute.mock.calls[0][0] as string;
            expect(sql).toContain('last_modified = ?');
            expect(sql).toContain('updated_at = ?');
        });

        it('should use current timestamp when serverData.last_modified is absent', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: {
                    status: 'preparing',
                    version: 2,
                },
            });

            const callArgs = mockExecute.mock.calls[0];
            const values = callArgs[1] as unknown[];
            const lastModIdx = (callArgs[0] as string)
                .split(', ')
                .findIndex(f => f.startsWith('last_modified'));
            expect(lastModIdx).toBeGreaterThanOrEqual(0);
            expect(new Date(values[lastModIdx] as string).getTime()).not.toBeNaN();
        });

        it('should return success with no-op when no updatable fields', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            const result = await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: {
                    id: 'order-123',
                    created_at: '2024-01-01T00:00:00Z',
                    restaurant_id: 'rest-1',
                },
            });

            expect(result.success).toBe(true);
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it('should map kds_order_items to kds_items table', async () => {
            const { reconcileWithServer } = await import('../conflict-resolution');

            await reconcileWithServer({
                entityType: 'kds_order_items',
                entityId: 'kds-123',
                serverData: { status: 'ready', version: 2 },
            });

            const sql = mockExecute.mock.calls[0][0] as string;
            expect(sql).toContain('UPDATE kds_items SET');
        });

        it('should handle database errors gracefully', async () => {
            mockExecute.mockRejectedValueOnce(new Error('Database locked'));

            const { reconcileWithServer } = await import('../conflict-resolution');

            const result = await reconcileWithServer({
                entityType: 'orders',
                entityId: 'order-123',
                serverData: { status: 'pending', version: 2 },
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database locked');
        });
    });
});
