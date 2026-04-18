import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    handleApprovedTransactionReceipt,
    buildReceiptFromPaymentPayload,
} from '@/lib/printer/transaction-print';
import type { EscPosReceiptPayload } from '@/lib/printer/escpos';
import type { FiscalSubmissionRequest, FiscalSubmissionResult } from '@/lib/fiscal/mor-client';

// Mock dependencies
vi.mock('@/lib/fiscal/offline-queue', () => ({
    queueFiscalJob: vi.fn().mockResolvedValue({ id: 'job-1', status: 'pending' }),
}));

vi.mock('@/lib/fiscal/mor-client', () => ({
    submitFiscalTransaction: vi.fn().mockResolvedValue({
        ok: true,
        mode: 'stub',
        transaction_number: 'TXN-001',
        qr_payload: 'qr-data',
        warning: null,
    }),
    isMorLiveConfigured: vi.fn().mockReturnValue(false),
    FiscalSubmissionError: class FiscalSubmissionError extends Error {
        code: 'network' | 'rejected';
        offlineFallbackAllowed: boolean;
        constructor(
            message: string,
            code: 'network' | 'rejected',
            offlineFallbackAllowed: boolean
        ) {
            super(message);
            this.name = 'FiscalSubmissionError';
            this.code = code;
            this.offlineFallbackAllowed = offlineFallbackAllowed;
        }
    },
}));

vi.mock('@/lib/printer/silent-print', () => ({
    silentPrintReceipt: vi
        .fn()
        .mockResolvedValue({ ok: true, channel: 'browser-fallback' as const }),
}));

import { queueFiscalJob } from '@/lib/fiscal/offline-queue';
import {
    submitFiscalTransaction,
    isMorLiveConfigured,
    FiscalSubmissionError,
} from '@/lib/fiscal/mor-client';
import { silentPrintReceipt } from '@/lib/printer/silent-print';

const mockQueueFiscalJob = vi.mocked(queueFiscalJob);
const mockSubmitFiscalTransaction = vi.mocked(submitFiscalTransaction);
const mockIsMorLiveConfigured = vi.mocked(isMorLiveConfigured);
const mockSilentPrintReceipt = vi.mocked(silentPrintReceipt);

function createBaseReceipt(): EscPosReceiptPayload {
    return {
        restaurant_name: 'Test Restaurant',
        restaurant_tin: null,
        transaction_number: 'TXN-001',
        printed_at: new Date().toISOString(),
        items: [{ name: 'Injera', quantity: 2, unit_price: 50, total_price: 100, notes: null }],
        subtotal: 100,
        total: 100,
        taxes: [],
        footer_lines: ['Thank you'],
    };
}

function createFiscalRequest(): FiscalSubmissionRequest {
    return {
        restaurant_tin: 'TIN-123',
        transaction_number: 'TXN-001',
        occurred_at: new Date().toISOString(),
        items: [{ name: 'Injera', quantity: 2, unit_price: 50, tax_rate: 0.15, total: 100 }],
        subtotal: 100,
        tax_total: 15,
        grand_total: 115,
        order_id: 'order-1',
    };
}

function createFiscalResult(overrides?: Partial<FiscalSubmissionResult>): FiscalSubmissionResult {
    return {
        ok: true,
        mode: 'stub',
        transaction_number: 'TXN-001',
        qr_payload: 'qr-data',
        warning: null,
        ...overrides,
    };
}

describe('handleApprovedTransactionReceipt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsMorLiveConfigured.mockReturnValue(false);
        mockSubmitFiscalTransaction.mockResolvedValue(createFiscalResult());
        mockSilentPrintReceipt.mockResolvedValue({ ok: true, channel: 'browser-fallback' });
        mockQueueFiscalJob.mockResolvedValue({ id: 'job-1', status: 'pending' } as never);
    });

    it('should print receipt when autoPrint is true and no fiscal request', async () => {
        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
        });

        expect(result.printed).toBe(true);
        expect(result.queuedFiscal).toBe(false);
        expect(result.blocked).toBe(false);
        expect(mockSilentPrintReceipt).toHaveBeenCalledOnce();
    });

    it('should not print when autoPrint is false', async () => {
        const result = await handleApprovedTransactionReceipt({
            autoPrint: false,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
        });

        expect(result.printed).toBe(false);
        expect(result.queuedFiscal).toBe(false);
        expect(result.blocked).toBe(false);
        expect(mockSilentPrintReceipt).not.toHaveBeenCalled();
    });

    it('should submit fiscal transaction when fiscalRequest is provided', async () => {
        const fiscalRequest = createFiscalRequest();

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest,
        });

        expect(mockSubmitFiscalTransaction).toHaveBeenCalledWith(fiscalRequest);
        expect(result.printed).toBe(true);
        expect(result.queuedFiscal).toBe(false);
        expect(result.blocked).toBe(false);
    });

    it('should set fiscal_qr_payload on receipt when fiscal succeeds', async () => {
        const receipt = createBaseReceipt();
        mockSubmitFiscalTransaction.mockResolvedValue(createFiscalResult({ qr_payload: 'qr-123' }));

        await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt,
            fiscalRequest: createFiscalRequest(),
        });

        expect(receipt.fiscal_qr_payload).toBe('qr-123');
    });

    it('should set fiscal_warning on receipt when fiscal returns warning', async () => {
        const receipt = createBaseReceipt();
        mockSubmitFiscalTransaction.mockResolvedValue(
            createFiscalResult({ warning: 'Pending fiscalization' })
        );

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt,
            fiscalRequest: createFiscalRequest(),
        });

        expect(receipt.fiscal_warning).toBe('Pending fiscalization');
        expect(result.warning).toBe('Pending fiscalization');
    });

    it('should block printing when fiscal fails while online and live fiscal required', async () => {
        mockIsMorLiveConfigured.mockReturnValue(true);
        mockSubmitFiscalTransaction.mockRejectedValue(new Error('Fiscal service unavailable'));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
            isOnline: true,
        });

        expect(result.blocked).toBe(true);
        expect(result.printed).toBe(false);
        expect(result.warning).toBe(
            'Fiscalization failed while online. Receipt printing was blocked.'
        );
    });

    it('should queue fiscal job when offline and FiscalSubmissionError allows fallback', async () => {
        mockIsMorLiveConfigured.mockReturnValue(true);
        const fiscalError = new FiscalSubmissionError('Network error', 'network', true);
        mockSubmitFiscalTransaction.mockRejectedValue(fiscalError);

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            orderId: 'order-1',
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
            isOnline: false,
        });

        expect(result.blocked).toBe(false);
        expect(result.queuedFiscal).toBe(true);
        expect(result.warning).toBe('Pending fiscalization');
        expect(mockQueueFiscalJob).toHaveBeenCalledOnce();
    });

    it('should queue fiscal job when isOnline is false even with live fiscal', async () => {
        mockIsMorLiveConfigured.mockReturnValue(true);
        mockSubmitFiscalTransaction.mockRejectedValue(new Error('Connection failed'));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            orderId: 'order-1',
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
            isOnline: false,
        });

        expect(result.blocked).toBe(false);
        expect(result.queuedFiscal).toBe(true);
    });

    it('should not queue fiscal job when orderId is missing', async () => {
        mockIsMorLiveConfigured.mockReturnValue(false);
        mockSubmitFiscalTransaction.mockRejectedValue(new Error('Fiscal error'));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
        });

        expect(result.queuedFiscal).toBe(false);
        expect(result.warning).toBe('Pending fiscalization');
    });

    it('should not print when blocked is true', async () => {
        mockIsMorLiveConfigured.mockReturnValue(true);
        mockSubmitFiscalTransaction.mockRejectedValue(new Error('Fiscal error'));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
            isOnline: true,
        });

        expect(result.blocked).toBe(true);
        expect(result.printed).toBe(false);
        expect(mockSilentPrintReceipt).not.toHaveBeenCalled();
    });

    it('should include print failure reason in warning', async () => {
        mockSilentPrintReceipt.mockResolvedValue({
            ok: false,
            channel: 'browser-fallback',
            reason: 'Printer not connected',
        });

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
        });

        expect(result.printed).toBe(false);
        expect(result.warning).toBe('Printer not connected');
    });

    it('should handle FiscalSubmissionError with offlineFallbackAllowed=false when online', async () => {
        mockIsMorLiveConfigured.mockReturnValue(true);
        const fiscalError = new FiscalSubmissionError('Server rejected', 'rejected', false);
        mockSubmitFiscalTransaction.mockRejectedValue(fiscalError);

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
            isOnline: true,
        });

        expect(result.blocked).toBe(true);
    });

    it('should allow fallback when not live fiscal configured and fiscal fails', async () => {
        mockIsMorLiveConfigured.mockReturnValue(false);
        mockSubmitFiscalTransaction.mockRejectedValue(new Error('Fiscal error'));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            orderId: 'order-1',
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
        });

        expect(result.blocked).toBe(false);
        expect(result.queuedFiscal).toBe(true);
    });

    it('should return no warning when fiscal succeeds without warning', async () => {
        mockSubmitFiscalTransaction.mockResolvedValue(createFiscalResult({ warning: null }));

        const result = await handleApprovedTransactionReceipt({
            autoPrint: true,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
        });

        expect(result.warning).toBeNull();
    });

    it('should return printed=false when autoPrint is false even with fiscal', async () => {
        const result = await handleApprovedTransactionReceipt({
            autoPrint: false,
            transactionNumber: 'TXN-001',
            receipt: createBaseReceipt(),
            fiscalRequest: createFiscalRequest(),
        });

        expect(result.printed).toBe(false);
        expect(mockSilentPrintReceipt).not.toHaveBeenCalled();
    });
});

describe('buildReceiptFromPaymentPayload', () => {
    it('should build receipt with all fields', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            restaurantTin: 'TIN-123',
            transactionNumber: 'TXN-001',
            orderNumber: 'ORD-42',
            paymentLabel: 'Cash',
            subtotal: 100,
            total: 115,
            taxSummary: [{ label: 'VAT', amount: 15 }],
            items: [
                {
                    name: 'Injera',
                    quantity: 2,
                    unit_price: 50,
                    total_price: 100,
                    notes: 'Extra spicy',
                },
            ],
        });

        expect(receipt.restaurant_name).toBe('Test Restaurant');
        expect(receipt.restaurant_tin).toBe('TIN-123');
        expect(receipt.transaction_number).toBe('TXN-001');
        expect(receipt.order_label).toBe('Order ORD-42');
        expect(receipt.payment_label).toBe('Cash');
        expect(receipt.subtotal).toBe(100);
        expect(receipt.total).toBe(115);
        expect(receipt.taxes).toEqual([{ label: 'VAT', amount: 15 }]);
        expect(receipt.items).toHaveLength(1);
        expect(receipt.items[0].name).toBe('Injera');
        expect(receipt.items[0].quantity).toBe(2);
        expect(receipt.items[0].notes).toBe('Extra spicy');
    });

    it('should handle null optional fields', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
        });

        expect(receipt.restaurant_tin).toBeNull();
        expect(receipt.order_label).toBeNull();
        expect(receipt.payment_label).toBeNull();
        expect(receipt.items).toEqual([]);
        expect(receipt.taxes).toEqual([]);
    });

    it('should default quantity to 1 when null', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: [{ name: 'Coffee', quantity: null, unit_price: 25, total_price: 25 }],
        });

        expect(receipt.items[0].quantity).toBe(1);
    });

    it('should default quantity to 1 when undefined', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: [{ name: 'Coffee', unit_price: 25, total_price: 25 }],
        });

        expect(receipt.items[0].quantity).toBe(1);
    });

    it('should use total_price as fallback for unit_price', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: [{ name: 'Coffee', total_price: 25 }],
        });

        expect(receipt.items[0].unit_price).toBe(25);
    });

    it('should use unit_price as fallback for total_price', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: [{ name: 'Coffee', unit_price: 25 }],
        });

        expect(receipt.items[0].total_price).toBe(25);
    });

    it('should handle null item notes', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: [{ name: 'Coffee', unit_price: 25, total_price: 25, notes: null }],
        });

        expect(receipt.items[0].notes).toBeNull();
    });

    it('should handle null items array', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            items: null,
        });

        expect(receipt.items).toEqual([]);
    });

    it('should use total as fallback for subtotal when subtotal is null', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            subtotal: null,
            total: 115,
        });

        expect(receipt.subtotal).toBe(115);
    });

    it('should use subtotal as fallback for total when total is null', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            subtotal: 100,
            total: null,
        });

        expect(receipt.total).toBe(100);
    });

    it('should handle non-numeric subtotal gracefully', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            subtotal: 'invalid' as unknown as number,
            total: 100,
        });

        expect(typeof receipt.subtotal).toBe('number');
    });

    it('should handle non-numeric total gracefully', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            subtotal: 100,
            total: 'invalid' as unknown as number,
        });

        expect(typeof receipt.total).toBe('number');
    });

    it('should include footer lines', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
        });

        expect(receipt.footer_lines).toContain('lole Restaurant OS');
    });

    it('should not include order_label when orderNumber is null', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            orderNumber: null,
        });

        expect(receipt.order_label).toBeNull();
    });

    it('should handle null taxSummary', () => {
        const receipt = buildReceiptFromPaymentPayload({
            restaurantName: 'Test Restaurant',
            transactionNumber: 'TXN-001',
            taxSummary: null,
        });

        expect(receipt.taxes).toEqual([]);
    });
});
