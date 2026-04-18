import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChapaProvider } from './chapa';
import { PaymentProviderError } from './types';

describe('ChapaProvider', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('constructor', () => {
        it('creates provider with secret key', () => {
            const provider = new ChapaProvider('test-key');
            expect(provider.name).toBe('chapa');
        });

        it('uses provided appUrl', () => {
            const provider = new ChapaProvider('test-key', 'https://myapp.com');
            expect(provider).toBeDefined();
        });
    });

    describe('initiatePayment', () => {
        const baseInput = {
            amount: 250,
            currency: 'ETB',
            email: 'test@example.com',
            metadata: {},
        };

        it('throws PaymentProviderError when secret key is missing', async () => {
            const provider = new ChapaProvider('');

            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(PaymentProviderError);
        });

        it('throws PaymentProviderError when fetch fails', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ status: 'fail', message: 'Internal error' }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(PaymentProviderError);
        });

        it('throws PaymentProviderError when status is not success', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'fail', message: 'Payment failed' }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(PaymentProviderError);
        });

        it('returns checkout URL on success', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/abc123' },
                }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.initiatePayment(baseInput);

            expect(result.checkoutUrl).toBe('https://checkout.chapa.co/abc123');
            expect(result.provider).toBe('chapa');
            expect(result.transactionReference).toMatch(/^tx-\d+-\d+$/);
        });

        it('uses guest defaults when email and name are not provided', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/xyz' },
                }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const _result = await provider.initiatePayment({
                amount: 100,
                currency: 'ETB',
            });

            const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(callBody.email).toBe('guest@lole.app');
            expect(callBody.first_name).toBe('Guest');
            expect(callBody.last_name).toBe('User');
        });

        it('includes subaccount info when provided', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { checkout_url: 'https://checkout.chapa.co/xyz' },
                }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            await provider.initiatePayment({
                ...baseInput,
                subaccountId: 'sub-123',
                splitType: 'percentage',
                splitValue: 10,
            });

            const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(callBody.subaccounts.id).toBe('sub-123');
            expect(callBody.subaccounts.split_type).toBe('percentage');
            expect(callBody.subaccounts.split_value).toBe(10);
        });

        it('handles array message from Chapa API', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 422,
                json: async () => ({
                    status: 'fail',
                    message: ['Amount is required', 'Currency is required'],
                }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            await expect(provider.initiatePayment(baseInput)).rejects.toThrow(
                'Amount is required, Currency is required'
            );
        });
    });

    describe('verifyPayment', () => {
        it('throws when secret key is missing', async () => {
            const provider = new ChapaProvider('');
            await expect(provider.verifyPayment('tx-ref-123')).rejects.toThrow(
                PaymentProviderError
            );
        });

        it('returns failed status on non-success response', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ status: 'fail', message: 'Not found' }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.verifyPayment('tx-ref-123');

            expect(result.status).toBe('failed');
            expect(result.transactionReference).toBe('tx-ref-123');
            expect(result.amount).toBe(0);
        });

        it('returns success status with data on successful verification', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: {
                        tx_ref: 'tx-ref-123',
                        reference: 'CHPQ12345',
                        amount: '250.00',
                        currency: 'ETB',
                        meta: { orderId: 'order-1' },
                    },
                }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.verifyPayment('tx-ref-123');

            expect(result.status).toBe('success');
            expect(result.transactionReference).toBe('tx-ref-123');
            expect(result.providerReference).toBe('CHPQ12345');
            expect(result.amount).toBe(250);
            expect(result.currency).toBe('ETB');
            expect(result.metadata).toEqual({ orderId: 'order-1' });
        });
    });

    describe('healthCheck', () => {
        it('returns unavailable when secret key is missing', async () => {
            const provider = new ChapaProvider('');
            const result = await provider.healthCheck();

            expect(result.status).toBe('unavailable');
            expect(result.reason).toContain('Missing Chapa secret key');
        });

        it('returns healthy when API responds OK', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', data: [] }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.healthCheck();

            expect(result.status).toBe('healthy');
            expect(result.provider).toBe('chapa');
        });

        it('returns degraded when API returns 4xx', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ message: 'Unauthorized' }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.healthCheck();

            expect(result.status).toBe('degraded');
        });

        it('returns unavailable when API returns 5xx', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => ({ message: 'Service Unavailable' }),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.healthCheck();

            expect(result.status).toBe('unavailable');
        });

        it('returns unavailable on network error', async () => {
            fetchSpy.mockRejectedValueOnce(new Error('Network error'));

            const provider = new ChapaProvider('valid-key');
            const result = await provider.healthCheck();

            expect(result.status).toBe('unavailable');
            expect(result.reason).toBe('Network error');
        });

        it('includes checkedAt timestamp', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            } as Response);

            const provider = new ChapaProvider('valid-key');
            const result = await provider.healthCheck();

            expect(typeof result.checkedAt).toBe('string');
            expect(() => new Date(result.checkedAt)).not.toThrow();
        });
    });
});
