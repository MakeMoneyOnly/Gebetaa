import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PowerSyncDatabase } from '@/lib/sync/powersync-config';

describe('offline identifiers', () => {
    let lastValue = 0;
    let mockDb: PowerSyncDatabase;
    let executeSpy: ReturnType<typeof vi.fn>;
    let getFirstAsyncSpy: ReturnType<typeof vi.fn>;
    let writeSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        lastValue = 0;
        executeSpy = vi.fn(async (_sql: string, params?: unknown[]) => {
            lastValue = Number(params?.[2] ?? lastValue);
            return { rowsAffected: 1 };
        });
        getFirstAsyncSpy = vi.fn(async () => (lastValue > 0 ? { last_value: lastValue } : null));
        writeSpy = vi.fn(async (run: () => Promise<void>) => {
            await run();
        });

        mockDb = {
            execute: executeSpy as unknown as PowerSyncDatabase['execute'],
            getFirstAsync: getFirstAsyncSpy as unknown as PowerSyncDatabase['getFirstAsync'],
            getAllAsync: vi.fn() as unknown as PowerSyncDatabase['getAllAsync'],
            write: writeSpy as unknown as PowerSyncDatabase['write'],
            close: vi.fn(),
        };
    });

    it('allocates monotonic offline order numbers per scope and business date', async () => {
        const { allocateOfflineOrderNumber } = await import('../identifiers');

        const first = await allocateOfflineOrderNumber(mockDb, {
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            deviceId: 'device-1',
        });
        const second = await allocateOfflineOrderNumber(mockDb, {
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            deviceId: 'device-1',
        });

        expect(second).toBeGreaterThan(first);
        expect(String(first)).toHaveLength(14);
        expect(executeSpy).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO local_sequence_counters'),
            expect.arrayContaining(['order:rest-1:loc-1:device-1'])
        );
    });

    it('allocates receipt numbers with stable fiscal prefix and counter', async () => {
        const { allocateOfflineReceiptNumber } = await import('../identifiers');

        const receipt = await allocateOfflineReceiptNumber(mockDb, {
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            deviceId: 'device-1',
        });

        expect(receipt).toMatch(/^PAY-\d{8}-\d{2}-\d{4}$/);
        expect(executeSpy).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO local_sequence_counters'),
            expect.arrayContaining(['pay:rest-1:loc-1:device-1'])
        );
    });
});
