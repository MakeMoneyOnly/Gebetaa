/**
 * Tests for Chapa Payment Provider
 *
 * Focuses on branch coverage for:
 * - normalizeChapaMessage (string, array, object, fallback branches)
 * - initiatePayment (missing secret, metadata branches, subaccount/split branches)
 * - verifyPayment (missing secret, success/failure branches)
 * - healthCheck (missing secret, healthy/degraded/unavailable branches)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChapaProvider } from '../chapa';
import { PaymentProviderError } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ChapaProvider', () => {
    let provider: ChapaProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new ChapaProvider('test-secret-key', 'https://test.app');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should use provided secretKey and appUrl', () => {
            const custom = new ChapaProvider('sk-123', 'https://custom.app');
            expect(custom.name).toBe('chapa');
        });

        it('should default appUrl from NEXT_PUBLIC_APP_URL env', () => {
            const original = process.env.NEXT_PUBLIC_APP_URL;
            process.env.NEXT_PUBLIC_APP_URL = 'https://env.app';
            const envProvider = new ChapaProvider('sk-123');
            process.env.NEXT_PUBLIC_APP_URL = original;
            expect(envProvider.name).toBe('chapa');
        });

        it('should fallback to localhost when no appUrl provided', () => {
            const original = process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.NEXT_PUBLIC_APP_URL;
            const defaultProvider = new ChapaProvider('sk-123');
            process.env.NEXT_PUBLIC_APP_URL = original;
            expect(defaultProvider.name).toBe('chapa');
        });
    });

    describe('initiatePayment', () => {
        const baseInput = {
            amount: 100,
            currency: 'ETB',
            email: 'test@example.com',
        };

        it('should throw when secret key is not configured', async () => {
            const noKeyProvider = new ChapaProvider('');
            try {
                await noKeyProvider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                const ppe = error as PaymentProviderError;
                expect(ppe.code).toBe('CHAPA_MISSING_SECRET');
                expect(ppe.statusCode).toBe(500);
            }
        });

        it('should initiate payment successfully with minimal input', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            const result = await provider.initiatePayment(baseInput);
            expect(result.checkoutUrl).toBe('https://checkout.chapa.co/tx-123');
            expect(result.provider).toBe('chapa');
            expect(result.transactionReference).toMatch(/^tx-/);
        });

        it('should use guest email when email is not provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            const result = await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
            });
            expect(result.provider).toBe('chapa');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.email).toBe('guest@gebeta.app');
        });

        it('should use metadata firstName when valid string', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                metadata: { firstName: 'Abebe', lastName: 'Kebede' },
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.first_name).toBe('Abebe');
            expect(callBody.last_name).toBe('Kebede');
        });

        it('should default firstName to Guest when metadata firstName is empty string', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                metadata: { firstName: '  ', lastName: '' },
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.first_name).toBe('Guest');
            expect(callBody.last_name).toBe('User');
        });

        it('should default lastName to User when metadata lastName is not a string', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                metadata: { firstName: 'Abebe', lastName: 123 },
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.first_name).toBe('Abebe');
            expect(callBody.last_name).toBe('User');
        });

        it('should include subaccount when subaccountId is provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                subaccountId: 'sub-acc-1',
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.subaccounts).toBeDefined();
            expect(callBody.subaccounts.id).toBe('sub-acc-1');
        });

        it('should include split_type when splitType is provided with subaccountId', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                subaccountId: 'sub-acc-1',
                splitType: 'percentage',
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.subaccounts.split_type).toBe('percentage');
        });

        it('should include split_value when splitValue is a number with subaccountId', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                subaccountId: 'sub-acc-1',
                splitValue: 0.15,
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.subaccounts.split_value).toBe(0.15);
        });

        it('should not include split_value when splitValue is not a number', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                subaccountId: 'sub-acc-1',
                splitValue: undefined,
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.subaccounts.split_value).toBeUndefined();
        });

        it('should use custom callbackUrl when provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                callbackUrl: 'https://custom.callback/webhook',
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.callback_url).toBe('https://custom.callback/webhook');
        });

        it('should use custom returnUrl when provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/tx-123' },
                }),
            });

            await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
                returnUrl: 'https://custom.return/status',
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.return_url).toBe('https://custom.return/status');
        });

        it('should throw PaymentProviderError when response is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: 'Invalid amount',
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                const ppe = error as PaymentProviderError;
                expect(ppe.code).toBe('CHAPA_INITIATE_FAILED');
                expect(ppe.message).toBe('Invalid amount');
            }
        });

        it('should handle trimmed string error message from API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: '  Invalid request  ',
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toBe('Invalid request');
            }
        });

        it('should handle array error message from API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: ['Field amount is required', 'Invalid currency'],
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toBe(
                    'Field amount is required, Invalid currency'
                );
            }
        });

        it('should handle array error message with non-string items', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: [{ field: 'amount' }, 42],
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                // Non-string items are JSON.stringified, then filtered by Boolean
                expect((error as PaymentProviderError).message).toContain('field');
            }
        });

        it('should handle empty array error message with fallback', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: [],
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toBe(
                    'Failed to initiate Chapa payment'
                );
            }
        });

        it('should handle object error message from API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: { error: 'validation', fields: ['amount'] },
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toContain('error');
            }
        });

        it('should handle null error message with fallback', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    status: 'failed',
                    message: null,
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toBe(
                    'Failed to initiate Chapa payment'
                );
            }
        });

        it('should handle undefined error message with fallback', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 502,
                json: async () => ({
                    status: 'failed',
                }),
            });

            try {
                await provider.initiatePayment(baseInput);
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).message).toBe(
                    'Failed to initiate Chapa payment'
                );
                expect((error as PaymentProviderError).statusCode).toBe(502);
            }
        });

        it('should throw when response ok but status is not success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'failed',
                    message: 'Something went wrong',
                }),
            });

            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(PaymentProviderError);
        });

        it('should throw when checkout_url is missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {},
                }),
            });

            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(PaymentProviderError);
        });
    });

    describe('verifyPayment', () => {
        it('should throw when secret key is not configured', async () => {
            const noKeyProvider = new ChapaProvider('');
            try {
                await noKeyProvider.verifyPayment('tx-123');
                expect.unreachable('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(PaymentProviderError);
                expect((error as PaymentProviderError).code).toBe('CHAPA_MISSING_SECRET');
            }
        });

        it('should return success response for valid payment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        tx_ref: 'tx-123',
                        reference: 'chapa-ref-456',
                        amount: '100',
                        currency: 'ETB',
                        meta: { guestId: 'g-1' },
                    },
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.status).toBe('success');
            expect(result.transactionReference).toBe('tx-123');
            expect(result.providerReference).toBe('chapa-ref-456');
            expect(result.amount).toBe(100);
            expect(result.currency).toBe('ETB');
            expect(result.metadata).toEqual({ guestId: 'g-1' });
        });

        it('should use transactionReference when tx_ref is missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        reference: 'chapa-ref-456',
                        amount: '200',
                        currency: 'ETB',
                    },
                }),
            });

            const result = await provider.verifyPayment('my-tx-ref');
            expect(result.transactionReference).toBe('my-tx-ref');
        });

        it('should default amount to 0 when missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        tx_ref: 'tx-123',
                        reference: 'chapa-ref-456',
                        currency: 'ETB',
                    },
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.amount).toBe(0);
        });

        it('should default currency to ETB when missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        tx_ref: 'tx-123',
                        reference: 'chapa-ref-456',
                        amount: '100',
                    },
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.currency).toBe('ETB');
        });

        it('should return failed status when response is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({
                    status: 'failed',
                    message: 'Transaction not found',
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.status).toBe('failed');
            expect(result.amount).toBe(0);
            expect(result.currency).toBe('ETB');
        });

        it('should return failed status when data is missing', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.status).toBe('failed');
        });

        it('should handle numeric amount', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        tx_ref: 'tx-123',
                        reference: 'chapa-ref-456',
                        amount: 250,
                        currency: 'ETB',
                    },
                }),
            });

            const result = await provider.verifyPayment('tx-123');
            expect(result.amount).toBe(250);
        });
    });

    describe('healthCheck', () => {
        it('should return unavailable when secret key is not configured', async () => {
            const noKeyProvider = new ChapaProvider('');
            const result = await noKeyProvider.healthCheck();
            expect(result.provider).toBe('chapa');
            expect(result.status).toBe('unavailable');
            expect(result.reason).toContain('Missing Chapa secret key');
        });

        it('should return healthy when API responds ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            const result = await provider.healthCheck();
            expect(result.provider).toBe('chapa');
            expect(result.status).toBe('healthy');
            expect(result.reason).toBeUndefined();
        });

        it('should return unavailable when API responds with 500+', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
            });

            const result = await provider.healthCheck();
            expect(result.status).toBe('unavailable');
            expect(result.reason).toContain('503');
        });

        it('should return degraded when API responds with 4xx', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
            });

            const result = await provider.healthCheck();
            expect(result.status).toBe('degraded');
            expect(result.reason).toContain('401');
        });

        it('should return unavailable when fetch throws', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await provider.healthCheck();
            expect(result.status).toBe('unavailable');
            expect(result.reason).toBe('Network error');
        });

        it('should return unavailable with generic message when non-Error thrown', async () => {
            mockFetch.mockRejectedValueOnce('string error');

            const result = await provider.healthCheck();
            expect(result.status).toBe('unavailable');
            expect(result.reason).toBe('Unknown health check error');
        });
    });
});
