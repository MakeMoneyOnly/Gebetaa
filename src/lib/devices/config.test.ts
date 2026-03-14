import { describe, expect, it } from 'vitest';
import {
    getDeviceTypeLabel,
    getPaymentOptionsForSurface,
    normalizeDeviceMetadata,
} from '@/lib/devices/config';

describe('device config helpers', () => {
    it('normalizes terminal metadata with dedicated-device defaults', () => {
        expect(normalizeDeviceMetadata('terminal')).toEqual({
            station_name: undefined,
            settlement_mode: 'cashier',
            allowed_payment_methods: ['cash', 'chapa'],
            receipt_mode: 'prompt',
            managed_mode: 'dedicated',
            kiosk_required: true,
        });
    });

    it('returns terminal payment options with chapa and cash enabled', () => {
        const options = getPaymentOptionsForSurface('terminal');
        expect(options.map(option => option.method)).toContain('cash');
        expect(options.map(option => option.method)).toContain('chapa');
        expect(options.every(option => option.enabled)).toBe(true);
    });

    it('labels the terminal device type clearly', () => {
        expect(getDeviceTypeLabel('terminal')).toBe('Cashier Terminal');
    });
});
