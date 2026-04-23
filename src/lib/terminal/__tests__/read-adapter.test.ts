import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
}));

describe('terminal read adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('builds terminal overview from local runtime', async () => {
        const mockDb = {
            getAllAsync: vi
                .fn()
                .mockResolvedValueOnce([
                    {
                        id: 'order-1',
                        table_number: 'T1',
                        order_number: 'ORD-1',
                        status: 'ready',
                        total_price: 245,
                        created_at: '2026-04-22T10:00:00.000Z',
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        id: 'session-1',
                        table_id: 'T1',
                        status: 'open',
                        updated_at: '2026-04-22T10:05:00.000Z',
                    },
                ]),
        };
        mockGetPowerSync.mockReturnValue(mockDb);

        const { readTerminalOverview } = await import('../read-adapter');
        const result = await readTerminalOverview({
            device: {
                id: 'device-1',
                name: 'Terminal 1',
                device_type: 'terminal',
                assigned_zones: [],
                metadata: {
                    allowed_payment_methods: ['cash', 'other'],
                },
            },
        });

        expect(result.ok).toBe(true);
        expect(result.mode).toBe('local');
        expect(result.data?.tables).toEqual([
            expect.objectContaining({
                id: 'T1',
                table_number: 'T1',
                outstanding_total: 245,
                active_order_count: 1,
            }),
        ]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('writes local even split and local payment capture', async () => {
        const mockDb = {
            getFirstAsync: vi
                .fn()
                .mockResolvedValueOnce({
                    id: 'order-1',
                    total_price: 300,
                    status: 'ready',
                })
                .mockResolvedValueOnce({
                    id: 'order-1',
                    total_price: 300,
                    status: 'ready',
                }),
            getAllAsync: vi.fn().mockResolvedValue([]),
            execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
            write: vi.fn(async (run: () => Promise<void>) => {
                await run();
            }),
        };
        mockGetPowerSync.mockReturnValue(mockDb);

        const { createTerminalEvenSplit, captureTerminalPayment, readTerminalOrderSplit } =
            await import('../read-adapter');

        const splitResult = await createTerminalEvenSplit({
            orderId: 'order-1',
            guestCount: 3,
        });

        expect(splitResult).toEqual({
            ok: true,
            mode: 'local',
        });

        const paymentResult = await captureTerminalPayment({
            orderId: 'order-1',
            splitId: 'split-1',
            amount: 100,
            method: 'cash',
            label: 'Guest 1',
            providerReference: 'CASH-1',
            restaurantId: 'rest-1',
            terminalName: 'Terminal 1',
        });

        expect(paymentResult.ok).toBe(true);
        expect(paymentResult.mode).toBe('local');
        expect(paymentResult.data?.transaction_number).toMatch(/^LOCAL-PAY-/);

        const readResult = await readTerminalOrderSplit('order-1');
        expect(readResult.ok).toBe(true);
        expect(mockDb.execute).toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });
});
