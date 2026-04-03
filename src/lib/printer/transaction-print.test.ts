import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalSubmissionError } from '@/lib/fiscal/mor-client';
import { handleApprovedTransactionReceipt } from '@/lib/printer/transaction-print';
import { queueFiscalJob } from '@/lib/fiscal/offline-queue';
import { silentPrintReceipt } from '@/lib/printer/silent-print';
import { isMorLiveConfigured, submitFiscalTransaction } from '@/lib/fiscal/mor-client';

vi.mock('@/lib/fiscal/offline-queue', () => ({
    queueFiscalJob: vi.fn(),
}));

vi.mock('@/lib/printer/silent-print', () => ({
    silentPrintReceipt: vi.fn(),
}));

vi.mock('@/lib/fiscal/mor-client', async importOriginal => {
    const actual = await importOriginal<typeof import('@/lib/fiscal/mor-client')>();
    return {
        ...actual,
        isMorLiveConfigured: vi.fn(),
        submitFiscalTransaction: vi.fn(),
    };
});

describe('handleApprovedTransactionReceipt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isMorLiveConfigured).mockReturnValue(true);
        vi.mocked(silentPrintReceipt).mockResolvedValue({ ok: true, channel: 'native' });
    });

    it('blocks receipt printing when live fiscalization fails while online', async () => {
        vi.mocked(submitFiscalTransaction).mockRejectedValue(
            new FiscalSubmissionError('Rejected by MoR', 'rejected', false)
        );

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            orderId: 'order-1',
            transactionNumber: 'TX-1',
            isOnline: true,
            receipt: {
                restaurant_name: 'Gebeta',
                transaction_number: 'TX-1',
                printed_at: '2026-04-03T12:00:00.000Z',
                items: [],
                subtotal: 100,
                total: 115,
            },
            fiscalRequest: {
                restaurant_tin: '123456789',
                transaction_number: 'TX-1',
                occurred_at: '2026-04-03T12:00:00.000Z',
                items: [],
                subtotal: 100,
                tax_total: 15,
                grand_total: 115,
                order_id: 'order-1',
            },
        });

        expect(result).toMatchObject({
            printed: false,
            queuedFiscal: false,
            blocked: true,
        });
        expect(queueFiscalJob).not.toHaveBeenCalled();
        expect(silentPrintReceipt).not.toHaveBeenCalled();
    });

    it('queues fiscal work and prints when the device is offline', async () => {
        vi.mocked(submitFiscalTransaction).mockRejectedValue(
            new FiscalSubmissionError('Network unavailable', 'network', true)
        );

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            orderId: 'order-2',
            transactionNumber: 'TX-2',
            isOnline: false,
            receipt: {
                restaurant_name: 'Gebeta',
                transaction_number: 'TX-2',
                printed_at: '2026-04-03T12:00:00.000Z',
                items: [],
                subtotal: 200,
                total: 230,
            },
            fiscalRequest: {
                restaurant_tin: '123456789',
                transaction_number: 'TX-2',
                occurred_at: '2026-04-03T12:00:00.000Z',
                items: [],
                subtotal: 200,
                tax_total: 30,
                grand_total: 230,
                order_id: 'order-2',
            },
        });

        expect(result).toMatchObject({
            printed: true,
            queuedFiscal: true,
            blocked: false,
            warning: 'Pending fiscalization',
        });
        expect(queueFiscalJob).toHaveBeenCalledOnce();
        expect(silentPrintReceipt).toHaveBeenCalledOnce();
    });
});
