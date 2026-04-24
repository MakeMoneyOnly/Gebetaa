import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetFirstAsync = vi.fn().mockResolvedValue(null);
const mockGetAllAsync = vi.fn().mockResolvedValue([]);
const mockWrite = vi.fn(async (fn: () => Promise<unknown>) => fn());
const mockAppendLocalJournalEntryInDatabase = vi.fn().mockResolvedValue(undefined);

vi.mock('../powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        write: mockWrite,
    })),
}));

vi.mock('../idempotency', () => ({
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

describe('printerFallback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetFirstAsync.mockResolvedValue(null);
        mockGetAllAsync.mockResolvedValue([]);
        mockWrite.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('creates print job with command journal', async () => {
        mockGetFirstAsync.mockResolvedValueOnce({
            id: 'job-1',
            order_id: 'order-1',
            station: 'grill',
            payload_json: '{"test":true}',
            status: 'pending',
            attempts: 0,
            created_at: '2026-04-21T00:00:00.000Z',
        });

        const { createPrintJob } = await import('../printerFallback');
        const result = await createPrintJob('order-1', 'grill', {
            restaurantId: 'rest-1',
            orderId: 'order-1',
            orderNumber: '1001',
            items: [],
            station: 'grill',
            firedAt: '2026-04-21T00:00:00.000Z',
            reason: 'test',
        });

        expect(result).not.toBeNull();
        expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
        expect(mockAppendLocalJournalEntryInDatabase.mock.invocationCallOrder[0]).toBeLessThan(
            mockExecute.mock.invocationCallOrder[0]
        );
    });
});
