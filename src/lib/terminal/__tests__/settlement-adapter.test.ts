import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockGetOpenOfflineTableSessionByTableId = vi.fn();
const mockUpdateOfflineOrderStatus = vi.fn();
const mockCloseOfflineTableSession = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    getOpenOfflineTableSessionByTableId: mockGetOpenOfflineTableSessionByTableId,
    updateOfflineOrderStatus: mockUpdateOfflineOrderStatus,
    closeOfflineTableSession: mockCloseOfflineTableSession,
}));

describe('terminal settlement adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue(null);
        mockUpdateOfflineOrderStatus.mockResolvedValue(true);
        mockCloseOfflineTableSession.mockResolvedValue(false);
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
            orders: [
                { id: 'order-1', status: 'ready' },
                { id: 'order-2', status: 'preparing' },
            ],
        });

        expect(result).toEqual({
            ok: true,
            mode: 'local',
            completedOrderIds: ['order-1'],
        });
    });

    it('falls back to api mode for chapa', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });

        const { submitTerminalSettlement } = await import('../settlement-adapter');
        const result = await submitTerminalSettlement({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            paymentProvider: 'chapa',
            orders: [],
        });

        expect(result).toEqual({
            ok: true,
            mode: 'api',
        });
    });
});
