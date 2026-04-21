import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockUpdateOfflineOrderStatus = vi.fn();
const mockUpdateOfflineOrderCourseFire = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    updateOfflineOrderStatus: mockUpdateOfflineOrderStatus,
    updateOfflineOrderCourseFire: mockUpdateOfflineOrderCourseFire,
}));

describe('order command adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockUpdateOfflineOrderStatus.mockResolvedValue(false);
        mockUpdateOfflineOrderCourseFire.mockResolvedValue(false);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('prefers local status update when runtime exists', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockUpdateOfflineOrderStatus.mockResolvedValue(true);

        const { submitOrderStatusUpdate } = await import('../command-adapter');
        const result = await submitOrderStatusUpdate({
            orderId: 'order-1',
            status: 'ready',
        });

        expect(result).toEqual({ ok: true, mode: 'local' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('prefers local course fire update when runtime exists', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockUpdateOfflineOrderCourseFire.mockResolvedValue(true);

        const { submitOrderCourseFireUpdate } = await import('../command-adapter');
        const result = await submitOrderCourseFireUpdate({
            orderId: 'order-1',
            fireMode: 'manual',
            currentCourse: 'main',
        });

        expect(result).toEqual({ ok: true, mode: 'local' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('falls back to API for order status when local runtime missing', async () => {
        vi.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { submitOrderStatusUpdate } = await import('../command-adapter');
        const result = await submitOrderStatusUpdate({
            orderId: 'order-1',
            status: 'acknowledged',
        });

        expect(result).toEqual({ ok: true, mode: 'api' });
    });
});
