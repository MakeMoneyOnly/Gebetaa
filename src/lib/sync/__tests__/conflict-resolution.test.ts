import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('domain-aware conflict resolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetFirstAsync.mockResolvedValue(null);
        mockGetAllAsync.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('keeps payments server-authoritative but surfaces mismatched amounts for operator review', async () => {
        const { resolveConflict } = await import('../conflict-resolution');

        const result = resolveConflict(
            'payments',
            {
                id: 'pay-1',
                amount: 100,
                status: 'captured',
                version: 1,
                last_modified: '2026-04-27T10:00:00.000Z',
            },
            {
                id: 'pay-1',
                amount: 120,
                status: 'verified',
                version: 2,
                last_modified: '2026-04-27T10:01:00.000Z',
            }
        );

        expect(result.strategy).toBe('manual_review');
        expect(result.auditDetails.requiresOperatorReview).toBe(true);
    });

    it('merges order notes locally but keeps totals server-safe', async () => {
        const { resolveConflict } = await import('../conflict-resolution');

        const result = resolveConflict(
            'orders',
            {
                id: 'order-1',
                notes: 'No onions',
                total_santim: 1000,
                version: 1,
                last_modified: '2026-04-27T10:02:00.000Z',
            },
            {
                id: 'order-1',
                notes: 'Server note',
                total_santim: 1200,
                version: 2,
                last_modified: '2026-04-27T10:01:00.000Z',
            }
        );

        expect(result.strategy).toBe('merge');
        expect(result.resolvedData.notes).toBe('No onions');
        expect(result.resolvedData.total_santim).toBe(1200);
    });

    it('flags close-vs-transfer table split-brain as manual review', async () => {
        const { requiresOperatorReview, handleSyncConflict } =
            await import('../conflict-resolution');

        expect(
            requiresOperatorReview(
                'table_sessions',
                { status: 'closed', version: 1, last_modified: '2026-04-27T10:00:00.000Z' },
                { status: 'transferred', version: 2, last_modified: '2026-04-27T10:01:00.000Z' }
            )
        ).toBe(true);

        const result = await handleSyncConflict({
            entityType: 'table_sessions',
            entityId: 'session-1',
            clientData: {
                id: 'session-1',
                status: 'closed',
                version: 1,
                last_modified: '2026-04-27T10:00:00.000Z',
            },
            serverData: {
                id: 'session-1',
                status: 'transferred',
                version: 2,
                last_modified: '2026-04-27T10:01:00.000Z',
            },
            operationType: 'table.close',
        });

        expect(result.resolved).toBe(true);
        expect(result.requiresOperatorReview).toBe(true);
        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO sync_conflict_logs'),
            expect.arrayContaining([
                expect.any(String),
                'table_sessions',
                'session-1',
                'concurrent_edit',
                'table.close',
                expect.any(String),
            ])
        );
    });

    it('counts unresolved orders, table sessions, and payment review rows', async () => {
        mockGetFirstAsync
            .mockResolvedValueOnce({ count: 2 })
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 3 });

        const { getUnresolvedConflictsCount } = await import('../conflict-resolution');
        const result = await getUnresolvedConflictsCount();

        expect(result).toBe(6);
    });

    it('returns batch summary including manual review totals', async () => {
        const { batchResolveConflicts } = await import('../conflict-resolution');

        const result = await batchResolveConflicts([
            {
                entityType: 'orders',
                entityId: 'order-1',
                clientData: {
                    id: 'order-1',
                    notes: 'Seat 1',
                    total_santim: 1000,
                    version: 1,
                    last_modified: '2026-04-27T10:00:00.000Z',
                },
                serverData: {
                    id: 'order-1',
                    notes: 'Seat 1',
                    total_santim: 1000,
                    version: 2,
                    last_modified: '2026-04-27T10:01:00.000Z',
                },
            },
            {
                entityType: 'payments',
                entityId: 'pay-1',
                clientData: {
                    id: 'pay-1',
                    amount: 100,
                    version: 1,
                    last_modified: '2026-04-27T10:00:00.000Z',
                },
                serverData: {
                    id: 'pay-1',
                    amount: 120,
                    version: 2,
                    last_modified: '2026-04-27T10:01:00.000Z',
                },
            },
        ]);

        expect(result.resolved).toBe(2);
        expect(result.failed).toBe(0);
        expect(result.manualReview).toBe(1);
    });
});
