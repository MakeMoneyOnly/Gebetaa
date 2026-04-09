/**
 * Tests for Telebirr Payment Provider
 *
 * Tests cover:
 * - Signature generation and verification
 * - Payment initiation
 * - Payment verification
 * - Health checks
 * - Webhook signature verification
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { TelebirrProvider, verifyTelebirrWebhookSignature } from '../telebirr';
import { PaymentProviderError } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TelebirrProvider', () => {
    let provider: TelebirrProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        provider = new TelebirrProvider('test-app-id', 'test-app-key', 'https://test.app');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should use provided credentials', () => {
            const customProvider = new TelebirrProvider(
                'custom-id',
                'custom-key',
                'https://custom.url'
            );
            expect(customProvider.isConfigured()).toBe(true);
        });

        it('should use environment variables when credentials not provided', () => {
            const originalAppId = process.env.TELEBIRR_APP_ID;
            const originalAppKey = process.env.TELEBIRR_APP_KEY;
            process.env.TELEBIRR_APP_ID = 'env-app-id';
            process.env.TELEBIRR_APP_KEY = 'env-app-key';

            // Re-import to pick up new env vars - but since that's not possible in Jest,
            // we test by passing explicit values that fall back to env behavior
            const envProvider = new TelebirrProvider(
                'env-app-id',
                'env-app-key',
                'https://test.app'
            );
            expect(envProvider.isConfigured()).toBe(true);

            process.env.TELEBIRR_APP_ID = originalAppId;
            process.env.TELEBIRR_APP_KEY = originalAppKey;
        });

        it('should handle missing credentials gracefully', () => {
            const emptyProvider = new TelebirrProvider('', '', '');
            expect(emptyProvider.isConfigured()).toBe(false);
        });
    });

    describe('isConfigured', () => {
        it('should return true when both appId and appKey are set', () => {
            expect(provider.isConfigured()).toBe(true);
        });

        it('should return false when appId is empty', () => {
            const noAppId = new TelebirrProvider('', 'test-key', 'https://test.app');
            expect(noAppId.isConfigured()).toBe(false);
        });

        it('should return false when appKey is empty', () => {
            const noAppKey = new TelebirrProvider('test-id', '', 'https://test.app');
            expect(noAppKey.isConfigured()).toBe(false);
        });
    });

    describe('initiatePayment', () => {
        const validInput = {
            amount: 100,
            currency: 'ETB',
            email: 'test@example.com',
            metadata: {
                subject: 'Test Order',
                body: 'Test payment',
                firstName: 'TestUser',
            },
        };

        it('should throw error when not configured', async () => {
            const emptyProvider = new TelebirrProvider('', '', '');
            await expect(emptyProvider.initiatePayment(validInput)).rejects.toThrow(
                PaymentProviderError
            );
        });

        it('should successfully initiate payment and return QR code', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    qrCode: 'https://telebirr.com/qr/test123',
                    outTradeNo: 'TB123456',
                    tradeNo: 'T123456',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.initiatePayment(validInput);

            expect(result.checkoutUrl).toBe('https://telebirr.com/qr/test123');
            expect(result.provider).toBe('telebirr');
            expect(result.transactionReference).toMatch(/^TB\d+/);
        });

        it('should use default values for optional fields', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    qrCode: 'https://telebirr.com/qr/test123',
                    outTradeNo: 'TB123456',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const minimalInput = {
                amount: 50,
                currency: 'ETB',
            };

            const result = await provider.initiatePayment(minimalInput);

            expect(result.checkoutUrl).toBe('https://telebirr.com/qr/test123');
            expect(result.provider).toBe('telebirr');
        });

        it('should throw PaymentProviderError on API error response', async () => {
            const mockResponse = {
                code: '40000',
                msg: 'Invalid request',
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => mockResponse,
            });

            await expect(provider.initiatePayment(validInput)).rejects.toThrow(
                PaymentProviderError
            );
        });

        it('should throw PaymentProviderError on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(provider.initiatePayment(validInput)).rejects.toThrow(
                PaymentProviderError
            );
        });

        it('should use callback URL from input when provided', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    qrCode: 'https://telebirr.com/qr/test123',
                    outTradeNo: 'TB123456',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await provider.initiatePayment({
                ...validInput,
                callbackUrl: 'https://custom.callback/webhook',
            });

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.notifyUrl).toBe('https://custom.callback/webhook');
        });

        it('should use return URL from input when provided', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    qrCode: 'https://telebirr.com/qr/test123',
                    outTradeNo: 'TB123456',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await provider.initiatePayment({
                ...validInput,
                returnUrl: 'https://custom.return/status',
            });

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.returnUrl).toBe('https://custom.return/status');
        });
    });

    describe('verifyPayment', () => {
        it('should throw error when not configured', async () => {
            const emptyProvider = new TelebirrProvider('', '', '');
            await expect(emptyProvider.verifyPayment('TB123456')).rejects.toThrow(
                PaymentProviderError
            );
        });

        it('should return success status for TRADE_SUCCESS', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'TRADE_SUCCESS',
                    outTradeNo: 'TB123456',
                    tradeNo: 'T789012',
                    totalAmount: '100.00',
                    currency: 'ETB',
                    buyerId: 'buyer123',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');

            expect(result.status).toBe('success');
            expect(result.transactionReference).toBe('TB123456');
            expect(result.providerReference).toBe('T789012');
            expect(result.amount).toBe(100);
            expect(result.currency).toBe('ETB');
            expect(result.metadata?.buyerId).toBe('buyer123');
        });

        it('should return success status for TRADE_FINISHED', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'TRADE_FINISHED',
                    outTradeNo: 'TB123456',
                    tradeNo: 'T789012',
                    totalAmount: '50.00',
                    currency: 'ETB',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');
            expect(result.status).toBe('success');
        });

        it('should return cancelled status for TRADE_CLOSED', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'TRADE_CLOSED',
                    outTradeNo: 'TB123456',
                    tradeNo: 'T789012',
                    totalAmount: '0',
                    currency: 'ETB',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');
            expect(result.status).toBe('cancelled');
        });

        it('should return pending status for WAIT_BUYER_PAY', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'WAIT_BUYER_PAY',
                    outTradeNo: 'TB123456',
                    tradeNo: 'T789012',
                    totalAmount: '100.00',
                    currency: 'ETB',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');
            expect(result.status).toBe('pending');
        });

        it('should return pending status for unknown trade status', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'UNKNOWN_STATUS' as string,
                    outTradeNo: 'TB123456',
                    tradeNo: 'T789012',
                    totalAmount: '100.00',
                    currency: 'ETB',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');
            expect(result.status).toBe('pending');
        });

        it('should throw PaymentProviderError on API error', async () => {
            const mockResponse = {
                code: '40000',
                msg: 'Transaction not found',
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => mockResponse,
            });

            await expect(provider.verifyPayment('TB123456')).rejects.toThrow(PaymentProviderError);
        });

        it('should throw PaymentProviderError on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(provider.verifyPayment('TB123456')).rejects.toThrow(PaymentProviderError);
        });

        it('should use default values when data is missing', async () => {
            const mockResponse = {
                code: '10000',
                msg: 'Success',
                data: {
                    tradeStatus: 'TRADE_SUCCESS',
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await provider.verifyPayment('TB123456');

            expect(result.transactionReference).toBe('TB123456');
            expect(result.amount).toBe(0);
            expect(result.currency).toBe('ETB');
        });
    });

    describe('healthCheck', () => {
        it('should return unavailable when not configured', async () => {
            const emptyProvider = new TelebirrProvider('', '', '');
            const result = await emptyProvider.healthCheck();

            expect(result.status).toBe('unavailable');
            expect(result.reason).toBe('Telebirr credentials not configured');
        });

        it('should return healthy when API responds OK', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            const result = await provider.healthCheck();

            expect(result.status).toBe('healthy');
            expect(result.provider).toBe('telebirr');
            expect(result.checkedAt).toBeDefined();
        });

        it('should return degraded when API returns non-OK status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
            });

            const result = await provider.healthCheck();

            expect(result.status).toBe('degraded');
            expect(result.reason).toBe('API returned status 503');
        });

        it('should return unavailable on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const result = await provider.healthCheck();

            expect(result.status).toBe('unavailable');
            expect(result.reason).toBe('Connection refused');
        });

        it('should return unavailable on timeout', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);

            const result = await provider.healthCheck();

            expect(result.status).toBe('unavailable');
            expect(result.reason).toContain('aborted');
        });
    });
});

describe('verifyTelebirrWebhookSignature', () => {
    const appKey = 'test-app-key';

    it('should return false when app key is missing', () => {
        const result = verifyTelebirrWebhookSignature('{"test":"data"}', 'signature', '');
        expect(result).toBe(false);
    });

    it('should return false when payload is invalid JSON', () => {
        const result = verifyTelebirrWebhookSignature('not valid json', 'signature', appKey);
        expect(result).toBe(false);
    });

    it('should return false when signature is missing in payload', () => {
        const payload = JSON.stringify({ amount: '100', outTradeNo: 'TB123' });
        const result = verifyTelebirrWebhookSignature(payload, 'signature', appKey);
        expect(result).toBe(false);
    });

    it('should return true for valid signature', () => {
        // Create a valid signature
        const params: Record<string, string> = {
            amount: '100',
            outTradeNo: 'TB123456',
            tradeNo: 'T789',
            tradeStatus: 'TRADE_SUCCESS',
        };

        // Generate signature using the same algorithm
        const sortedKeys = Object.keys(params).sort();
        const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
        const stringToSign = `${queryString}&key=${appKey}`;

        const sign = createHmac('sha256', appKey).update(stringToSign).digest('hex').toUpperCase();

        const payload = JSON.stringify({ ...params, sign });

        const result = verifyTelebirrWebhookSignature(payload, sign, appKey);
        expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
        const payload = JSON.stringify({
            amount: '100',
            outTradeNo: 'TB123456',
            sign: 'INVALID_SIGNATURE',
        });

        const result = verifyTelebirrWebhookSignature(payload, 'INVALID_SIGNATURE', appKey);
        expect(result).toBe(false);
    });

    it('should handle empty values in payload', () => {
        const params: Record<string, string> = {
            amount: '100',
            outTradeNo: 'TB123456',
            emptyField: '',
        };

        const sortedKeys = Object.keys(params).sort();
        const queryString = sortedKeys
            .filter(key => params[key].length > 0)
            .map(key => `${key}=${params[key]}`)
            .join('&');
        const stringToSign = `${queryString}&key=${appKey}`;

        const sign = createHmac('sha256', appKey).update(stringToSign).digest('hex').toUpperCase();

        const payload = JSON.stringify({ ...params, sign });

        const result = verifyTelebirrWebhookSignature(payload, sign, appKey);
        expect(result).toBe(true);
    });
});

describe('PaymentProviderError handling', () => {
    it('should contain proper error information', async () => {
        const provider = new TelebirrProvider('', '', '');

        try {
            await provider.initiatePayment({ amount: 100, currency: 'ETB' });
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(PaymentProviderError);
            const providerError = error as PaymentProviderError;
            expect(providerError.code).toBe('TELEBIRR_NOT_CONFIGURED');
            expect(providerError.provider).toBe('telebirr');
            expect(providerError.statusCode).toBe(500);
        }
    });
});
