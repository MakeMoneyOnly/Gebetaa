import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExecuteKdsAction = vi.fn();
const mockGetPowerSync = vi.fn();
const mockAddKdsActionToQueue = vi.fn();

vi.mock('@/lib/sync', () => ({
    executeKdsAction: mockExecuteKdsAction,
    getPowerSync: mockGetPowerSync,
}));

vi.mock('../syncAdapter', () => ({
    addKdsActionToQueue: mockAddKdsActionToQueue,
}));

describe('kds command adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPowerSync.mockReturnValue(null);
        mockExecuteKdsAction.mockResolvedValue(false);
        mockAddKdsActionToQueue.mockResolvedValue(undefined);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('prefers local command execution when PowerSync exists', async () => {
        mockGetPowerSync.mockReturnValue({ execute: vi.fn() });
        mockExecuteKdsAction.mockResolvedValue(true);

        const { submitKdsItemAction } = await import('../command-adapter');
        const result = await submitKdsItemAction({
            orderId: 'order-1',
            itemId: 'item-1',
            kdsItemId: 'kds-1',
            action: 'start',
            isOnline: true,
        });

        expect(result).toEqual({
            ok: true,
            mode: 'local',
        });
        expect(mockExecuteKdsAction).toHaveBeenCalledWith('kds-1', 'start');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('queues legacy action when offline and no local runtime exists', async () => {
        const { submitKdsItemAction } = await import('../command-adapter');
        const result = await submitKdsItemAction({
            orderId: 'order-1',
            itemId: 'item-1',
            kdsItemId: 'kds-1',
            action: 'ready',
            isOnline: false,
        });

        expect(result).toEqual({
            ok: true,
            mode: 'queued_legacy',
        });
        expect(mockAddKdsActionToQueue).toHaveBeenCalledWith({
            orderId: 'order-1',
            itemId: 'item-1',
            kdsItemId: 'kds-1',
            action: 'ready',
            reason: undefined,
        });
    });

    it('falls back to API when local runtime missing and online', async () => {
        vi.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { submitKdsItemAction } = await import('../command-adapter');
        const result = await submitKdsItemAction({
            orderId: 'order-1',
            itemId: 'item-1',
            kdsItemId: 'kds-1',
            action: 'hold',
            isOnline: true,
        });

        expect(result).toEqual({
            ok: true,
            mode: 'api',
        });
        expect(fetch).toHaveBeenCalledWith('/api/kds/items/kds-1/action', expect.any(Object));
    });

    it('queues legacy action after API server failure', async () => {
        vi.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify({ error: 'boom' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const { submitKdsItemAction } = await import('../command-adapter');
        const result = await submitKdsItemAction({
            orderId: 'order-1',
            itemId: 'item-1',
            kdsItemId: 'kds-1',
            action: 'start',
            isOnline: true,
        });

        expect(result).toEqual({
            ok: true,
            mode: 'queued_legacy',
        });
        expect(mockAddKdsActionToQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                orderId: 'order-1',
                itemId: 'item-1',
                kdsItemId: 'kds-1',
                action: 'start',
                reason: 'queued_after_server_error',
            })
        );
    });
});
