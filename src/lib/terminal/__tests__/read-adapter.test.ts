import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockListLocalPayments = vi.fn();
const mockGetTableSettlementBalance = vi.fn();
const mockRecordLocalCapturedPayment = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
}));

vi.mock('@/lib/payments/local-ledger', () => ({
    listLocalPayments: mockListLocalPayments,
    getTableSettlementBalance: mockGetTableSettlementBalance,
    recordLocalCapturedPayment: mockRecordLocalCapturedPayment,
}));

describe('terminal read adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockListLocalPayments.mockResolvedValue([]);
        mockGetTableSettlementBalance.mockResolvedValue({
            tableId: 'T1',
            totalAmount: 245,
            operationallySettledAmount: 0,
            remainingAmount: 245,
            orders: [],
        });
        mockRecordLocalCapturedPayment.mockResolvedValue({
            transactionNumber: 'LOCAL-PAY-123',
            truthState: 'local_capture',
            truthLabel: 'Local Capture',
        });
        vi.stubGlobal('fetch', vi.fn());
    });

    it('builds terminal overview from local runtime with recent payment truth labels', async () => {
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
        mockListLocalPayments.mockResolvedValueOnce([
            {
                id: 'payment-1',
                orderNumber: 'ORD-1',
                tableNumber: 'T1',
                label: 'Guest 1',
                amount: 100,
                method: 'cash',
                truthState: 'local_capture',
                truthLabel: 'Local Capture',
                truthTone: 'amber',
                createdAt: '2026-04-22T10:06:00.000Z',
            },
        ]);
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
        expect(result.data?.recent_payments).toEqual([
            expect.objectContaining({
                id: 'payment-1',
                truth_label: 'Local Capture',
            }),
        ]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('writes local even split and deferred payment capture', async () => {
        const mockDb = {
            getFirstAsync: vi
                .fn()
                .mockResolvedValueOnce({
                    id: 'order-1',
                    restaurant_id: 'rest-1',
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
        mockRecordLocalCapturedPayment.mockResolvedValueOnce({
            transactionNumber: 'LOCAL-PAY-CHAPA',
            truthState: 'pending_verification',
            truthLabel: 'Pending Verification',
        });
        mockListLocalPayments.mockResolvedValueOnce([
            {
                id: 'payment-1',
                splitId: 'split-1',
                amount: 100,
                paymentStatus: 'pending',
                method: 'chapa',
                truthState: 'pending_verification',
                truthLabel: 'Pending Verification',
                truthTone: 'sky',
                providerReference: 'CHAPA-1',
                transactionNumber: 'LOCAL-PAY-CHAPA',
            },
        ]);

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
            method: 'chapa',
            label: 'Guest 1',
            providerReference: 'CHAPA-1',
            restaurantId: 'rest-1',
            terminalName: 'Terminal 1',
        });

        expect(paymentResult.ok).toBe(true);
        expect(paymentResult.mode).toBe('local');
        expect(paymentResult.data).toEqual({
            transaction_number: 'LOCAL-PAY-CHAPA',
            fiscal_request: null,
            truth_state: 'pending_verification',
            truth_label: 'Pending Verification',
        });
        expect(mockRecordLocalCapturedPayment).toHaveBeenCalledWith(
            mockDb,
            expect.objectContaining({
                verificationMode: 'deferred',
            })
        );

        const readResult = await readTerminalOrderSplit('order-1');
        expect(readResult.ok).toBe(true);
        expect(readResult.data?.split_payments[0]).toEqual(
            expect.objectContaining({
                truth_label: 'Pending Verification',
                method: 'chapa',
            })
        );
        expect(mockDb.execute).toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });
});
