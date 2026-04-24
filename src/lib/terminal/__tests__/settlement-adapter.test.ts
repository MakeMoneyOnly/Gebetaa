import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockGetOpenOfflineTableSessionByTableId = vi.fn();
const mockUpdateOfflineOrderStatus = vi.fn();
const mockCloseOfflineTableSession = vi.fn();
const mockGetTableSettlementBalance = vi.fn();
const mockRecordLocalCapturedPayment = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    getOpenOfflineTableSessionByTableId: mockGetOpenOfflineTableSessionByTableId,
    updateOfflineOrderStatus: mockUpdateOfflineOrderStatus,
    closeOfflineTableSession: mockCloseOfflineTableSession,
}));

vi.mock('@/lib/payments/local-ledger', () => ({
    getTableSettlementBalance: mockGetTableSettlementBalance,
    recordLocalCapturedPayment: mockRecordLocalCapturedPayment,
}));

describe('terminal settlement adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue(null);
        mockUpdateOfflineOrderStatus.mockResolvedValue(true);
        mockCloseOfflineTableSession.mockResolvedValue(false);
        mockGetTableSettlementBalance.mockResolvedValue({
            tableId: 'table-1',
            totalAmount: 320,
            operationallySettledAmount: 0,
            remainingAmount: 320,
            orders: [
                {
                    orderId: 'order-1',
                    orderNumber: 'ORD-1',
                    tableNumber: 'table-1',
                    totalAmount: 320,
                    operationallySettledAmount: 0,
                    verifiedAmount: 0,
                    remainingAmount: 320,
                },
            ],
        });
        mockRecordLocalCapturedPayment.mockResolvedValue({
            truthLabel: 'Local Capture',
        });
    });

    it('uses local settlement for cash when local runtime and session exist', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({ id: 'session-1' });
        mockCloseOfflineTableSession.mockResolvedValue(true);

        const { submitTerminalSettlement } = await import('../settlement-adapter');
        const result = await submitTerminalSettlement({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            paymentProvider: 'cash',
            amount: 320,
            orders: [
                { id: 'order-1', status: 'ready' },
                { id: 'order-2', status: 'preparing' },
            ],
            terminalName: 'Terminal 1',
        });

        expect(result).toEqual({
            ok: true,
            mode: 'local',
            completedOrderIds: ['order-1'],
            truthLabel: 'Local Capture',
        });
        expect(mockRecordLocalCapturedPayment).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                orderId: 'order-1',
                method: 'cash',
                verificationMode: 'immediate',
            })
        );
    });

    it('supports deferred verification for chapa close-out', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({ id: 'session-1' });
        mockCloseOfflineTableSession.mockResolvedValue(true);
        mockRecordLocalCapturedPayment.mockResolvedValueOnce({
            truthLabel: 'Pending Verification',
        });

        const { submitTerminalSettlement } = await import('../settlement-adapter');
        const result = await submitTerminalSettlement({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            paymentProvider: 'chapa',
            amount: 320,
            providerReference: 'CHAPA-REF-1',
            orders: [{ id: 'order-1', status: 'ready' }],
        });

        expect(result).toEqual({
            ok: true,
            mode: 'local',
            completedOrderIds: ['order-1'],
            truthLabel: 'Pending Verification',
        });
        expect(mockRecordLocalCapturedPayment).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                method: 'chapa',
                verificationMode: 'deferred',
            })
        );
    });

    it('fails closed when amount does not match outstanding balance', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({ id: 'session-1' });

        const { submitTerminalSettlement } = await import('../settlement-adapter');
        const result = await submitTerminalSettlement({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            paymentProvider: 'cash',
            amount: 100,
            orders: [{ id: 'order-1', status: 'ready' }],
        });

        expect(result).toEqual({
            ok: false,
            error: 'Settlement amount must match outstanding balance (320.00 ETB).',
        });
    });

    it('fails closed when local runtime missing', async () => {
        const { submitTerminalSettlement } = await import('../settlement-adapter');
        const result = await submitTerminalSettlement({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            paymentProvider: 'cash',
            amount: 320,
            orders: [],
        });

        expect(result).toEqual({
            ok: false,
            error: 'Local terminal settlement runtime unavailable. Pair to store gateway and retry.',
        });
    });
});
