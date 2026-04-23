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

    it('fails closed for non-local table states', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'reserved',
        });

        expect(result).toEqual({
            ok: false,
            error: 'Table status reserved requires gateway-owned table authority.',
        });
        expect(fetch).not.toHaveBeenCalled();
    });
});
