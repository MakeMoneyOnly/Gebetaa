import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetAllAsync = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/sync/powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getAllAsync: mockGetAllAsync,
    })),
}));

describe('local-journal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates entry hash and metadata', async () => {
        const { createLocalJournalEntry } = await import('@/lib/journal/local-journal');
        const entry = await createLocalJournalEntry({
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            deviceId: 'dev-1',
            actorId: 'staff-1',
            entryKind: 'command',
            aggregateType: 'order',
            aggregateId: 'order-1',
            operationType: 'order.create',
            payload: { total: 100 },
            idempotencyKey: 'idem-1',
        });

        expect(entry.payloadHash).toMatch(/^[a-f0-9]{64}$/);
        expect(entry.status).toBe('pending');
    });

    it('appends entry to local_journal table', async () => {
        const { appendLocalJournalEntry } = await import('@/lib/journal/local-journal');

        const result = await appendLocalJournalEntry({
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            deviceId: 'dev-1',
            entryKind: 'audit',
            aggregateType: 'order',
            aggregateId: 'order-2',
            operationType: 'order.audit',
            payload: { field: 'status' },
            idempotencyKey: 'idem-2',
        });

        expect(result).not.toBeNull();
        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO local_journal'),
            expect.arrayContaining([expect.any(String), 'rest-1', 'loc-1', 'dev-1', null, 'audit'])
        );
    });
});
