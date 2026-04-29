import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockEncodeReceiptToEscPos,
    mockGetStoredPrinterSelection,
    mockStorePrinterSelection,
    mockIsCapacitorNativeRuntime,
} = vi.hoisted(() => ({
    mockEncodeReceiptToEscPos: vi.fn(),
    mockGetStoredPrinterSelection: vi.fn(),
    mockStorePrinterSelection: vi.fn(),
    mockIsCapacitorNativeRuntime: vi.fn(),
}));

vi.mock('@/lib/printer/escpos', () => ({
    encodeReceiptToEscPos: mockEncodeReceiptToEscPos,
}));

vi.mock('@/lib/mobile/device-storage', () => ({
    getStoredPrinterSelection: mockGetStoredPrinterSelection,
    storePrinterSelection: mockStorePrinterSelection,
}));

vi.mock('@/lib/mobile/capacitor', () => ({
    isCapacitorNativeRuntime: mockIsCapacitorNativeRuntime,
}));

describe('silentPrintReceipt', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        mockEncodeReceiptToEscPos.mockResolvedValue(new Uint8Array([27, 64]));
        mockGetStoredPrinterSelection.mockResolvedValue(null);
        mockIsCapacitorNativeRuntime.mockReturnValue(false);
    });

    it('queues receipt when native runtime is unavailable and fallback queue exists', async () => {
        const { silentPrintReceipt } = await import('../silent-print');
        const queueFallback = vi.fn().mockResolvedValue({ ok: true, reason: 'queued_locally' });

        const result = await silentPrintReceipt(
            {
                restaurant_name: 'Cafe Lucia',
                transaction_number: 'TXN-1',
                printed_at: '2026-04-28T10:00:00.000Z',
                items: [],
                subtotal: 0,
                total: 0,
                taxes: [],
            },
            null,
            { queueFallback }
        );

        expect(queueFallback).toHaveBeenCalledOnce();
        expect(result).toEqual({
            ok: true,
            channel: 'queue',
            printer: null,
            reason: 'queued_locally',
        });
    });

    it('uses network bridge for network printers before browser fallback', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        mockGetStoredPrinterSelection.mockResolvedValue({
            connection_type: 'network',
            device_id: 'printer-1',
            device_name: 'Front Counter',
        });

        const { silentPrintReceipt } = await import('../silent-print');

        const result = await silentPrintReceipt(
            {
                restaurant_name: 'Cafe Lucia',
                transaction_number: 'TXN-2',
                printed_at: '2026-04-28T10:00:00.000Z',
                items: [],
                subtotal: 0,
                total: 0,
                taxes: [],
            },
            null,
            { networkBridgeUrl: 'https://printer-bridge.local/print' }
        );

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(result.ok).toBe(true);
        expect(result.channel).toBe('native');
        vi.unstubAllGlobals();
    });
});
