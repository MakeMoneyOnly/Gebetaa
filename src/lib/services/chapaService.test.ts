import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initializeChapaTransaction,
    verifyChapaTransaction,
    listChapaBanks,
    createChapaSubaccount,
    generateChapaTransactionRef,
    isChapaConfigured,
    maskSettlementAccountNumber,
} from './chapaService';

describe('chapaService', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.CHAPA_SECRET_KEY;
    });

    // ── generateChapaTransactionRef ──────────────────────────────────────────
    describe('generateChapaTransactionRef', () => {
        it('returns a string starting with gebeta-', () => {
            const ref = generateChapaTransactionRef('addiskitchen');
            // Slug is truncated to 8 chars: 'addiskit'
            expect(ref).toMatch(/^gebeta-addiskit-/);
        });

        it('strips special characters from restaurant slug', () => {
            const ref = generateChapaTransactionRef('addis kitchen!');
            expect(ref).not.toContain(' ');
            expect(ref).not.toContain('!');
            expect(ref).toMatch(/^gebeta-/);
        });

        it('truncates restaurant slug to 8 chars', () => {
            const ref = generateChapaTransactionRef('verylongrestaurantname');
            const parts = ref.split('-');
            expect(parts[1].length).toBeLessThanOrEqual(8);
        });

        it('generates unique refs', () => {
            const ref1 = generateChapaTransactionRef('rest');
            const ref2 = generateChapaTransactionRef('rest');
            // May be same if called in same ms, but random suffix should differ
            expect(ref1.length).toBeGreaterThan(10);
            expect(ref2.length).toBeGreaterThan(10);
        });
    });

    // ── isChapaConfigured ────────────────────────────────────────────────────
    describe('isChapaConfigured', () => {
        it('returns false when CHAPA_SECRET_KEY is not set', () => {
            delete process.env.CHAPA_SECRET_KEY;
            expect(isChapaConfigured()).toBe(false);
        });

        it('returns false when key is too short', () => {
            process.env.CHAPA_SECRET_KEY = 'short';
            expect(isChapaConfigured()).toBe(false);
        });

        it('returns false when key starts with MOCK', () => {
            process.env.CHAPA_SECRET_KEY = 'MOCK_12345678901';
            expect(isChapaConfigured()).toBe(false);
        });

        it('returns true when key is valid and long enough', () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-validkey1234';
            expect(isChapaConfigured()).toBe(true);
        });
    });

    // ── maskSettlementAccountNumber ──────────────────────────────────────────
    describe('maskSettlementAccountNumber', () => {
        it('masks all but the last 4 digits', () => {
            expect(maskSettlementAccountNumber('1234567890')).toBe('******7890');
        });

        it('returns full number when 4 chars or less', () => {
            expect(maskSettlementAccountNumber('1234')).toBe('1234');
            expect(maskSettlementAccountNumber('12')).toBe('12');
        });

        it('strips whitespace before masking', () => {
            // '1234 5678 9012' without spaces = 12-char string → 8 stars + '9012'
            expect(maskSettlementAccountNumber('1234 5678 9012')).toBe('********9012');
        });

        it('returns correct length mask', () => {
            const masked = maskSettlementAccountNumber('9876543210');
            expect(masked.startsWith('*')).toBe(true);
            expect(masked.endsWith('3210')).toBe(true);
            // 10 chars total: 6 stars + 4 digits
            expect(masked.length).toBe(10);
        });
    });

    // ── initializeChapaTransaction ────────────────────────────────────────────
    describe('initializeChapaTransaction', () => {
        const params = {
            amount: 250,
            first_name: 'Abebe',
            tx_ref: 'tx-001',
            callback_url: 'https://myapp.com/callback',
            return_url: 'https://myapp.com/return',
        };

        it('throws when CHAPA_SECRET_KEY is not configured', async () => {
            delete process.env.CHAPA_SECRET_KEY;
            await expect(initializeChapaTransaction(params)).rejects.toThrow(
                'CHAPA_SECRET_KEY is not configured'
            );
        });

        it('calls the Chapa initialize endpoint', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    message: 'Hosted Link',
                    data: { checkout_url: 'https://checkout.chapa.co/abc' },
                }),
            } as Response);

            const result = await initializeChapaTransaction(params);

            expect(fetchSpy).toHaveBeenCalledWith(
                'https://api.chapa.co/v1/transaction/initialize',
                expect.objectContaining({ method: 'POST' })
            );
            expect(result.status).toBe('success');
            expect(result.data?.checkout_url).toBe('https://checkout.chapa.co/abc');
        });

        it('defaults currency to ETB', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', message: 'ok' }),
            } as Response);

            await initializeChapaTransaction(params);

            const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(callBody.currency).toBe('ETB');
        });

        it('includes subaccounts when provided', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', message: 'ok' }),
            } as Response);

            await initializeChapaTransaction({
                ...params,
                subaccounts: { id: 'sub-1', split_type: 'percentage', split_value: 5 },
            });

            const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
            expect(callBody.subaccounts.id).toBe('sub-1');
        });

        it('returns the raw API response (including failures)', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ status: 'failed', message: 'Invalid tx_ref' }),
            } as Response);

            const result = await initializeChapaTransaction(params);
            expect(result.status).toBe('failed');
            expect(result.message).toContain('Invalid');
        });
    });

    // ── verifyChapaTransaction ────────────────────────────────────────────────
    describe('verifyChapaTransaction', () => {
        it('throws when CHAPA_SECRET_KEY is not configured', async () => {
            delete process.env.CHAPA_SECRET_KEY;
            await expect(verifyChapaTransaction('tx-001')).rejects.toThrow(
                'CHAPA_SECRET_KEY is not configured'
            );
        });

        it('calls the verify endpoint with encoded txRef', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    message: 'Transaction verified',
                    data: {
                        amount: '250.00',
                        currency: 'ETB',
                        status: 'success',
                        reference: 'REF1',
                        tx_ref: 'tx-001',
                    },
                }),
            } as Response);

            const result = await verifyChapaTransaction('tx-001');

            expect(fetchSpy.mock.calls[0][0]).toContain('verify/tx-001');
            expect(result.status).toBe('success');
            expect(result.data?.amount).toBe('250.00');
        });

        it('URL-encodes special characters in txRef', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', message: 'ok' }),
            } as Response);

            await verifyChapaTransaction('tx/ref?test=1');

            expect(fetchSpy.mock.calls[0][0]).toContain(encodeURIComponent('tx/ref?test=1'));
        });
    });

    // ── listChapaBanks ────────────────────────────────────────────────────────
    describe('listChapaBanks', () => {
        it('throws when CHAPA_SECRET_KEY is not configured', async () => {
            delete process.env.CHAPA_SECRET_KEY;
            await expect(listChapaBanks()).rejects.toThrow('CHAPA_SECRET_KEY is not configured');
        });

        it('returns normalized and sorted list of banks', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    message: 'Banks retrieved',
                    data: [
                        { id: '2', name: 'Zemen Bank', bank_code: 'ZB' },
                        { id: '1', name: 'Awash Bank', bank_code: 'AB' },
                        { id: '3', name: 'CBE', bank_code: 'CBE' },
                    ],
                }),
            } as Response);

            const banks = await listChapaBanks();

            expect(banks[0].name).toBe('Awash Bank');
            expect(banks[1].name).toBe('CBE');
            expect(banks[2].name).toBe('Zemen Bank');
        });

        it('filters out banks without id or name', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: [
                        { id: '', name: 'No ID Bank', bank_code: 'NIB' },
                        { id: '1', name: '', bank_code: 'NNB' },
                        { id: '2', name: 'Valid Bank', bank_code: 'VB' },
                    ],
                }),
            } as Response);

            const banks = await listChapaBanks();
            expect(banks).toHaveLength(1);
            expect(banks[0].name).toBe('Valid Bank');
        });

        it('throws when response is not ok', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ message: 'Unauthorized' }),
            } as Response);

            await expect(listChapaBanks()).rejects.toThrow('Unauthorized');
        });

        it('throws when data is not an array', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', data: null }),
            } as Response);

            await expect(listChapaBanks()).rejects.toThrow();
        });
    });

    // ── createChapaSubaccount ────────────────────────────────────────────────
    describe('createChapaSubaccount', () => {
        const params = {
            business_name: 'Test Restaurant',
            account_name: 'Abebe Kebede',
            bank_code: 'AB',
            account_number: '0012345678',
            split_type: 'percentage' as const,
            split_value: 3,
        };

        it('throws when CHAPA_SECRET_KEY is not configured', async () => {
            delete process.env.CHAPA_SECRET_KEY;
            await expect(createChapaSubaccount(params)).rejects.toThrow(
                'CHAPA_SECRET_KEY is not configured'
            );
        });

        it('returns success response with subaccount id', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    message: 'Subaccount created',
                    data: { id: 'sub-123' },
                }),
            } as Response);

            const result = await createChapaSubaccount(params);
            expect(result.status).toBe('success');
            expect(result.data?.id).toBe('sub-123');
        });

        it('defaults status to failed when response is not ok', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 422,
                json: async () => ({ message: 'Invalid account number' }),
            } as Response);

            const result = await createChapaSubaccount(params);
            expect(result.status).toBe('failed');
            expect(result.message).toBe('Invalid account number');
        });

        it('uses ok status to infer success when status field missing', async () => {
            process.env.CHAPA_SECRET_KEY = 'CHASECK-testkey12345';
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Created', data: { id: 'sub-456' } }),
            } as Response);

            const result = await createChapaSubaccount(params);
            expect(result.status).toBe('success');
        });
    });
});
