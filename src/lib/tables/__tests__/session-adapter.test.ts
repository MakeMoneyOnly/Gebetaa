import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockOpenOfflineTableSession = vi.fn();
const mockGetOpenOfflineTableSessionByTableId = vi.fn();
const mockCloseOfflineTableSession = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    openOfflineTableSession: mockOpenOfflineTableSession,
    getOpenOfflineTableSessionByTableId: mockGetOpenOfflineTableSessionByTableId,
    closeOfflineTableSession: mockCloseOfflineTableSession,
}));

describe('table session adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockOpenOfflineTableSession.mockResolvedValue(null);
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue(null);
        mockCloseOfflineTableSession.mockResolvedValue(false);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('opens local session when marking table occupied', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockOpenOfflineTableSession.mockResolvedValue({ id: 'session-1' });

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'occupied',
        });

        expect(result).toEqual({ ok: true, mode: 'local_session' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('closes local session when marking table available', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({ id: 'session-1' });
        mockCloseOfflineTableSession.mockResolvedValue(true);

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'available',
        });

        expect(result).toEqual({ ok: true, mode: 'local_session' });
    });

    it('falls back to API for reserved status', async () => {
        vi.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'reserved',
        });

        expect(result).toEqual({ ok: true, mode: 'api' });
    });
});
