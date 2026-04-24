import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetFirstAsync = vi.fn().mockResolvedValue(null);
const mockWrite = vi.fn(async (fn: () => Promise<unknown>) => fn());
const mockQueueSyncOperationInDatabase = vi.fn().mockResolvedValue(undefined);
const mockAppendLocalJournalEntryInDatabase = vi.fn().mockResolvedValue(undefined);

vi.mock('../powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getFirstAsync: mockGetFirstAsync,
        write: mockWrite,
    })),
}));

vi.mock('../idempotency', () => ({
    queueSyncOperationInDatabase: mockQueueSyncOperationInDatabase,
    generateIdempotencyKey: vi.fn((prefix: string) => `${prefix}-idem`),
}));

vi.mock('@/lib/journal/local-journal', () => ({
    appendLocalJournalEntryInDatabase: mockAppendLocalJournalEntryInDatabase,
}));

vi.mock('../../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('tableSessionSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetFirstAsync.mockResolvedValue(null);
        mockWrite.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('opens table session with command journal and sync queue', async () => {
        mockGetFirstAsync.mockResolvedValueOnce({
            id: 'session-1',
            restaurant_id: 'rest-1',
            table_id: 'table-1',
            status: 'open',
            guest_count: 2,
            metadata_json: '{}',
            opened_at: '2026-04-21T00:00:00.000Z',
            created_at: '2026-04-21T00:00:00.000Z',
            updated_at: '2026-04-21T00:00:00.000Z',
        });

        const { openOfflineTableSession } = await import('../tableSessionSync');
        const result = await openOfflineTableSession({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            guestCount: 2,
        });

        expect(result).not.toBeNull();
        expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
        expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
        expect(mockAppendLocalJournalEntryInDatabase.mock.invocationCallOrder[0]).toBeLessThan(
            mockExecute.mock.invocationCallOrder[0]
        );
    });

    it('transfers table session with command journal and sync queue', async () => {
        const { transferOfflineTableSession } = await import('../tableSessionSync');
        const result = await transferOfflineTableSession({
            sessionId: 'session-1',
            restaurantId: 'rest-1',
            tableId: 'table-2',
        });

        expect(result).toBe(true);
        expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
        expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
    });

    it('closes table session with command journal and sync queue', async () => {
        const { closeOfflineTableSession } = await import('../tableSessionSync');
        const result = await closeOfflineTableSession({
            sessionId: 'session-1',
            restaurantId: 'rest-1',
            tableId: 'table-2',
        });

        expect(result).toBe(true);
        expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
        expect(mockQueueSyncOperationInDatabase).toHaveBeenCalledOnce();
    });
});
