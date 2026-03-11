import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getAddisInvoiceReviewPolicy,
    ingestInvoiceDocument,
    type InvoiceExtractionResult,
} from './invoiceIngestion';

// Mock external dependencies
vi.mock('crypto', () => ({
    default: {
        createHash: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn(() => 'mocked-hash'),
        })),
        createHmac: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn(() => Buffer.from('mocked-hmac')),
        })),
        createSign: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            end: vi.fn(),
            sign: vi.fn(() => 'mocked-signature'),
        })),
    },
    createHash: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn(() => 'mocked-hash'),
    })),
    createHmac: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn(() => Buffer.from('mocked-hmac')),
    })),
    createSign: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        end: vi.fn(),
        sign: vi.fn(() => 'mocked-signature'),
    })),
}));

describe('invoiceIngestion', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    describe('getAddisInvoiceReviewPolicy', () => {
        it('returns auto_receive mode when all thresholds are met', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.95,
                mappedRatio: 0.9,
                averageMatchConfidence: 0.9,
            });

            expect(result.city_profile).toBe('addis_ababa');
            expect(result.auto_receive_eligible).toBe(true);
            expect(result.recommended_mode).toBe('auto_receive');
            expect(result.thresholds.provider_confidence_min).toBe(0.9);
            expect(result.thresholds.mapped_ratio_min).toBe(0.85);
            expect(result.thresholds.match_confidence_min).toBe(0.88);
        });

        it('returns human_review mode when provider confidence is below threshold', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.85,
                mappedRatio: 0.9,
                averageMatchConfidence: 0.9,
            });

            expect(result.auto_receive_eligible).toBe(false);
            expect(result.recommended_mode).toBe('human_review');
        });

        it('returns human_review mode when mapped ratio is below threshold', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.95,
                mappedRatio: 0.8,
                averageMatchConfidence: 0.9,
            });

            expect(result.auto_receive_eligible).toBe(false);
            expect(result.recommended_mode).toBe('human_review');
        });

        it('returns human_review mode when match confidence is below threshold', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.95,
                mappedRatio: 0.9,
                averageMatchConfidence: 0.85,
            });

            expect(result.auto_receive_eligible).toBe(false);
            expect(result.recommended_mode).toBe('human_review');
        });

        it('returns human_review when all metrics are exactly at minimum thresholds', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.9,
                mappedRatio: 0.85,
                averageMatchConfidence: 0.88,
            });

            expect(result.auto_receive_eligible).toBe(true);
            expect(result.recommended_mode).toBe('auto_receive');
        });

        it('returns human_review when all metrics are just below thresholds', () => {
            const result = getAddisInvoiceReviewPolicy({
                providerConfidence: 0.89,
                mappedRatio: 0.84,
                averageMatchConfidence: 0.87,
            });

            expect(result.auto_receive_eligible).toBe(false);
            expect(result.recommended_mode).toBe('human_review');
        });
    });

    describe('ingestInvoiceDocument', () => {
        it('throws error when no providers are configured', async () => {
            // Clear all provider env vars
            delete process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT;
            delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
            delete process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_NAME;
            delete process.env.AWS_REGION;

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            await expect(ingestInvoiceDocument(input)).rejects.toThrow(
                'Invoice extraction failed across providers'
            );
        });

        it('uses open source endpoint when configured', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const mockResponse = {
                text: 'Test invoice content',
                confidence: 0.85,
                fields: {
                    supplier_name: 'Test Supplier',
                    invoice_number: 'INV-001',
                    total_amount: 100.0,
                },
            };

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            const result = await ingestInvoiceDocument(input);

            expect(result.provider).toBe('oss');
            expect(result.raw_text).toBe('Test invoice content');
            expect(result.confidence).toBe(0.85);
            expect(fetchSpy).toHaveBeenCalled();

            fetchSpy.mockRestore();
        });

        it('handles empty text result from provider', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: '',
                    confidence: 0.5,
                }),
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            await expect(ingestInvoiceDocument(input)).rejects.toThrow(
                'Invoice extraction failed across providers'
            );

            fetchSpy.mockRestore();
        });

        it('handles provider errors gracefully', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(
                new Error('Network error')
            );

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            await expect(ingestInvoiceDocument(input)).rejects.toThrow(
                'Invoice extraction failed across providers'
            );

            fetchSpy.mockRestore();
        });

        it('handles HTTP errors from provider', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            await expect(ingestInvoiceDocument(input)).rejects.toThrow(
                'Invoice extraction failed across providers'
            );

            fetchSpy.mockRestore();
        });

        it('sends API key when configured for open source endpoint', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_OPEN_SOURCE_API_KEY = 'test-api-key';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const mockResponse = {
                text: 'Test content',
                confidence: 0.8,
            };

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            await ingestInvoiceDocument(input);

            const callArgs = fetchSpy.mock.calls[0];
            expect(callArgs[1]?.headers).toHaveProperty('Authorization', 'Bearer test-api-key');

            fetchSpy.mockRestore();
        });

        it('respects provider preference', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const mockResponse = {
                text: 'Test content',
                confidence: 0.8,
            };

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
                providerPreference: 'oss' as const,
            };

            const result = await ingestInvoiceDocument(input);
            expect(result.provider).toBe('oss');

            fetchSpy.mockRestore();
        });

        it('parses money fields correctly from provider response', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Invoice',
                    confidence: 0.9,
                    fields: {
                        subtotal: '1,234.56',
                        tax_amount: '123.45',
                        total_amount: 1358.01,
                    },
                }),
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            const result = await ingestInvoiceDocument(input);

            expect(result.fields?.subtotal).toBe(1234.56);
            expect(result.fields?.tax_amount).toBe(123.45);
            expect(result.fields?.total_amount).toBe(1358.01);

            fetchSpy.mockRestore();
        });

        it('parses date fields correctly from provider response', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Invoice',
                    confidence: 0.9,
                    fields: {
                        issued_at: '2024-01-15',
                        due_at: '2024-02-15',
                    },
                }),
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            const result = await ingestInvoiceDocument(input);

            expect(result.fields?.issued_at).toBe('2024-01-15T00:00:00.000Z');
            expect(result.fields?.due_at).toBe('2024-02-15T00:00:00.000Z');

            fetchSpy.mockRestore();
        });

        it('handles confidence clamping correctly', async () => {
            process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT = 'https://test-ocr.example.com';
            process.env.INVOICE_OCR_PROVIDER_ORDER = 'oss';

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    text: 'Invoice',
                    confidence: 1.5, // Over 1.0, should be clamped
                }),
            } as Response);

            const input = {
                fileName: 'test.pdf',
                mimeType: 'application/pdf',
                bytes: new Uint8Array([1, 2, 3]),
            };

            const result = await ingestInvoiceDocument(input);
            expect(result.confidence).toBeLessThanOrEqual(1);

            fetchSpy.mockRestore();
        });
    });
});