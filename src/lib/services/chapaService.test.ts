import { afterEach, describe, expect, it, vi } from 'vitest';
import { listChapaBanks } from '@/lib/services/chapaService';

describe('chapaService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.CHAPA_SECRET_KEY;
    });

    it('accepts Chapa bank responses that only include "Banks retrieved"', async () => {
        process.env.CHAPA_SECRET_KEY = 'CHASECK_test_key_value';

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    message: 'Banks retrieved',
                    data: [
                        {
                            id: 128,
                            name: 'Commercial Bank of Ethiopia',
                        },
                    ],
                }),
            })
        );

        const banks = await listChapaBanks();

        expect(banks).toEqual([
            {
                id: '128',
                name: 'Commercial Bank of Ethiopia',
                code: '128',
            },
        ]);
    });

    it('keeps wallet-style rails in the live payout directory response', async () => {
        process.env.CHAPA_SECRET_KEY = 'CHASECK_test_key_value';

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    message: 'Banks retrieved',
                    data: [
                        {
                            id: 128,
                            name: 'Commercial Bank of Ethiopia',
                        },
                        {
                            id: 501,
                            name: 'Telebirr Wallet',
                        },
                    ],
                }),
            })
        );

        const banks = await listChapaBanks();

        expect(banks).toEqual([
            {
                id: '128',
                name: 'Commercial Bank of Ethiopia',
                code: '128',
            },
            {
                id: '501',
                name: 'Telebirr Wallet',
                code: '501',
            },
        ]);
    });
});
