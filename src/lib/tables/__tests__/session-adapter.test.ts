import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPowerSync = vi.fn();
const mockOpenOfflineTableSession = vi.fn();
const mockGetOpenOfflineTableSessionByTableId = vi.fn();
const mockCloseOfflineTableSession = vi.fn();
const mockTransferOfflineTableSession = vi.fn();
const mockUpdateOfflineTableSession = vi.fn();

vi.mock('@/lib/sync', () => ({
    getPowerSync: mockGetPowerSync,
    openOfflineTableSession: mockOpenOfflineTableSession,
    getOpenOfflineTableSessionByTableId: mockGetOpenOfflineTableSessionByTableId,
    closeOfflineTableSession: mockCloseOfflineTableSession,
    transferOfflineTableSession: mockTransferOfflineTableSession,
    updateOfflineTableSession: mockUpdateOfflineTableSession,
}));

describe('table session adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockOpenOfflineTableSession.mockResolvedValue(null);
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue(null);
        mockCloseOfflineTableSession.mockResolvedValue(false);
        mockTransferOfflineTableSession.mockResolvedValue(false);
        mockUpdateOfflineTableSession.mockResolvedValue(false);
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

    it('updates existing local session when marking table occupied again', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({
            id: 'session-1',
            guest_count: 2,
        });
        mockUpdateOfflineTableSession.mockResolvedValue(true);

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'occupied',
            guestCount: 4,
            notes: 'Seat edit',
        });

        expect(result).toEqual({ ok: true, mode: 'local_session' });
        expect(mockUpdateOfflineTableSession).toHaveBeenCalledWith({
            sessionId: 'session-1',
            restaurantId: 'rest-1',
            tableId: 'table-1',
            guestCount: 4,
            notes: 'Seat edit',
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('opens or updates reserved tables locally', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockOpenOfflineTableSession.mockResolvedValue({ id: 'session-1' });

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'reserved',
            guestCount: 3,
        });

        expect(result).toEqual({ ok: true, mode: 'local_session' });
        expect(mockOpenOfflineTableSession).toHaveBeenCalledWith({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            guestCount: 3,
            notes: 'Reserved table session',
            metadata: { ui_status: 'reserved' },
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('requires explicit transfer target for cleaning', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockGetOpenOfflineTableSessionByTableId.mockResolvedValue({ id: 'session-1' });

        const { submitTableStatusUpdate } = await import('../session-adapter');
        const result = await submitTableStatusUpdate({
            restaurantId: 'rest-1',
            tableId: 'table-1',
            status: 'cleaning',
        });

        expect(result).toEqual({
            ok: false,
            error: 'Table status cleaning requires explicit transfer target for gateway-owned authority.',
        });
        expect(fetch).not.toHaveBeenCalled();
    });
});
