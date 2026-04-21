import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockGetKdsItemsByOrder = vi.fn();
const mockUpdateOfflineOrderStatus = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    getKdsItemsByOrder: mockGetKdsItemsByOrder,
    updateOfflineOrderStatus: mockUpdateOfflineOrderStatus,
}));

describe('kds handoff adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockGetKdsItemsByOrder.mockResolvedValue([]);
        mockUpdateOfflineOrderStatus.mockResolvedValue(false);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('uses local handoff when all items ready', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetKdsItemsByOrder.mockResolvedValue([{ status: 'ready' }]);
        mockUpdateOfflineOrderStatus.mockResolvedValue(true);

        const { submitFinalKdsHandoff } = await import('../handoff-adapter');
        const result = await submitFinalKdsHandoff({ orderId: 'order-1' });

        expect(result).toEqual({ ok: true, mode: 'local' });
    });

    it('blocks local handoff when item not ready', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetKdsItemsByOrder.mockResolvedValue([{ status: 'queued' }]);

        const { submitFinalKdsHandoff } = await import('../handoff-adapter');
        const result = await submitFinalKdsHandoff({ orderId: 'order-1' });

        expect(result).toEqual({
            ok: false,
            error: 'Ticket is not fully ready for final handoff',
        });
    });
});
