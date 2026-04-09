import { describe, expect, it } from 'vitest';
import {
    resolveDeviceProfile,
    resolveDeviceTypeForProfile,
    getDeviceTypeLabel,
    getDeviceProfileLabel,
    getBootPathForDeviceProfile,
    normalizeDeviceMetadata,
} from '@/lib/devices/config';

describe('device config helpers', () => {
    describe('resolveDeviceProfile', () => {
        it('should return cashier for terminal', () => {
            expect(resolveDeviceProfile('terminal')).toBe('cashier');
        });

        it('should return kds for kds', () => {
            expect(resolveDeviceProfile('kds')).toBe('kds');
        });

        it('should return kiosk for kiosk', () => {
            expect(resolveDeviceProfile('kiosk')).toBe('kiosk');
        });

        it('should return waiter for pos (default)', () => {
            expect(resolveDeviceProfile('pos')).toBe('waiter');
        });

        it('should return waiter for unknown type', () => {
            expect(resolveDeviceProfile('unknown' as 'pos')).toBe('waiter');
        });
    });

    describe('resolveDeviceTypeForProfile', () => {
        it('should return terminal for cashier', () => {
            expect(resolveDeviceTypeForProfile('cashier')).toBe('terminal');
        });

        it('should return kds for kds', () => {
            expect(resolveDeviceTypeForProfile('kds')).toBe('kds');
        });

        it('should return kiosk for kiosk', () => {
            expect(resolveDeviceTypeForProfile('kiosk')).toBe('kiosk');
        });

        it('should return pos for waiter (default)', () => {
            expect(resolveDeviceTypeForProfile('waiter')).toBe('pos');
        });
    });

    describe('getDeviceTypeLabel', () => {
        it('should return correct labels for all types', () => {
            expect(getDeviceTypeLabel('kds')).toBe('Kitchen Display System');
            expect(getDeviceTypeLabel('pos')).toBe('Waiter POS');
            expect(getDeviceTypeLabel('kiosk')).toBe('Customer Kiosk');
            expect(getDeviceTypeLabel('digital_menu')).toBe('Digital Menu');
            expect(getDeviceTypeLabel('terminal')).toBe('Cashier Terminal');
        });

        it('should return default label for unknown type', () => {
            expect(getDeviceTypeLabel('unknown')).toBe('Service Terminal');
        });

        it('should return default label for null', () => {
            expect(getDeviceTypeLabel(null)).toBe('Service Terminal');
        });

        it('should return default label for undefined', () => {
            expect(getDeviceTypeLabel(undefined)).toBe('Service Terminal');
        });
    });

    describe('getDeviceProfileLabel', () => {
        it('should return correct labels for all profiles', () => {
            expect(getDeviceProfileLabel('cashier')).toBe('Cashier');
            expect(getDeviceProfileLabel('waiter')).toBe('Waiter');
            expect(getDeviceProfileLabel('kds')).toBe('Kitchen Display');
            expect(getDeviceProfileLabel('kiosk')).toBe('Self-Service Kiosk');
        });

        it('should return default label for unknown profile', () => {
            expect(getDeviceProfileLabel('unknown')).toBe('Device');
        });

        it('should return default label for null', () => {
            expect(getDeviceProfileLabel(null)).toBe('Device');
        });

        it('should return default label for undefined', () => {
            expect(getDeviceProfileLabel(undefined)).toBe('Device');
        });
    });

    describe('getBootPathForDeviceProfile', () => {
        it('should return /terminal for cashier', () => {
            expect(getBootPathForDeviceProfile('cashier')).toBe('/terminal');
        });

        it('should return /kds for kds', () => {
            expect(getBootPathForDeviceProfile('kds')).toBe('/kds');
        });

        it('should return /waiter for waiter', () => {
            expect(getBootPathForDeviceProfile('waiter')).toBe('/waiter');
        });

        it('should return slug path for kiosk with slug', () => {
            expect(getBootPathForDeviceProfile('kiosk', 'my-restaurant')).toBe(
                '/my-restaurant?entry=menu'
            );
        });

        it('should return / for kiosk without slug', () => {
            expect(getBootPathForDeviceProfile('kiosk')).toBe('/');
        });

        it('should return / for kiosk with null slug', () => {
            expect(getBootPathForDeviceProfile('kiosk', null)).toBe('/');
        });

        it('should return / for kiosk with undefined slug', () => {
            expect(getBootPathForDeviceProfile('kiosk', undefined)).toBe('/');
        });
    });

    describe('normalizeDeviceMetadata', () => {
        it('should return defaults for pos with no metadata', () => {
            const result = normalizeDeviceMetadata('pos');
            expect(result.managed_mode).toBe('pwa');
            expect(result.printer).toBeUndefined();
            expect(result.management).toBeUndefined();
            expect(result.fiscal).toBeUndefined();
        });

        it('should return dedicated mode for terminal with no metadata', () => {
            const result = normalizeDeviceMetadata('terminal');
            expect(result.managed_mode).toBe('dedicated');
            expect(result.settlement_mode).toBe('cashier');
            expect(result.allowed_payment_methods).toEqual(['cash', 'chapa']);
            expect(result.receipt_mode).toBe('auto');
            expect(result.kiosk_required).toBe(true);
        });

        it('should return dedicated mode for kiosk with no metadata', () => {
            const result = normalizeDeviceMetadata('kiosk');
            expect(result.managed_mode).toBe('dedicated');
        });

        it('should use explicit profile over device type default', () => {
            const result = normalizeDeviceMetadata('pos', null, 'cashier');
            expect(result.managed_mode).toBe('pwa'); // cashier profile but pos type → pwa
        });

        it('should handle null metadata', () => {
            const result = normalizeDeviceMetadata('pos', null);
            expect(result.managed_mode).toBe('pwa');
        });

        it('should handle printer metadata for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                printer: { connection_type: 'network', auto_connect: false },
            });
            expect(result.printer).toBeDefined();
            expect(result.printer?.connection_type).toBe('network');
            expect(result.printer?.auto_connect).toBe(false);
        });

        it('should default printer connection_type to none for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                printer: {},
            });
            expect(result.printer?.connection_type).toBe('none');
            expect(result.printer?.auto_connect).toBe(true);
        });

        it('should handle management metadata for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                management: { provider: 'esper', kiosk_mode: true },
            });
            expect(result.management?.provider).toBe('esper');
            expect(result.management?.kiosk_mode).toBe(true);
        });

        it('should default management provider to none for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                management: {},
            });
            expect(result.management?.provider).toBe('none');
        });

        it('should default management kiosk_mode for pos', () => {
            const result = normalizeDeviceMetadata('pos', {
                management: {},
            });
            expect(result.management?.kiosk_mode).toBe(false); // pos is not kiosk or terminal
        });

        it('should default management kiosk_mode for terminal', () => {
            const result = normalizeDeviceMetadata('terminal', {
                management: {},
            });
            expect(result.management?.kiosk_mode).toBe(true); // terminal
        });

        it('should handle fiscal metadata for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                fiscal: { mode: 'mor_pending' },
            });
            expect(result.fiscal?.mode).toBe('mor_pending');
        });

        it('should default fiscal mode to stub for non-terminal', () => {
            const result = normalizeDeviceMetadata('pos', {
                fiscal: {},
            });
            expect(result.fiscal?.mode).toBe('stub');
        });

        it('should return base for non-terminal device types', () => {
            const result = normalizeDeviceMetadata('kds');
            expect(result.managed_mode).toBe('pwa');
            expect(result.settlement_mode).toBeUndefined();
        });

        it('should set terminal-specific defaults for terminal device type', () => {
            const result = normalizeDeviceMetadata('terminal');
            expect(result.settlement_mode).toBe('cashier');
            expect(result.allowed_payment_methods).toEqual(['cash', 'chapa']);
            expect(result.receipt_mode).toBe('auto');
            expect(result.kiosk_required).toBe(true);
            expect(result.fiscal?.mode).toBe('mor_pending');
            expect(result.printer?.connection_type).toBe('none');
            expect(result.printer?.auto_connect).toBe(true);
            expect(result.management?.provider).toBe('none');
            expect(result.management?.kiosk_mode).toBe(true);
        });

        it('should use provided terminal metadata over defaults', () => {
            const result = normalizeDeviceMetadata('terminal', {
                settlement_mode: 'counter',
                allowed_payment_methods: ['cash'],
                receipt_mode: 'prompt',
                kiosk_required: false,
                station_name: 'Station 1',
                fiscal: { mode: 'mor_live' },
                printer: { connection_type: 'usb', auto_connect: false },
                management: { provider: 'esper', kiosk_mode: false },
            });
            expect(result.settlement_mode).toBe('counter');
            expect(result.allowed_payment_methods).toEqual(['cash']);
            expect(result.receipt_mode).toBe('prompt');
            expect(result.kiosk_required).toBe(false);
            expect(result.station_name).toBe('Station 1');
            expect(result.fiscal?.mode).toBe('mor_live');
            expect(result.printer?.connection_type).toBe('usb');
            expect(result.printer?.auto_connect).toBe(false);
            expect(result.management?.provider).toBe('esper');
            expect(result.management?.kiosk_mode).toBe(false);
        });

        it('should handle invalid metadata gracefully', () => {
            const result = normalizeDeviceMetadata(
                'pos',
                'invalid' as unknown as Record<string, unknown>
            );
            expect(result.managed_mode).toBe('pwa');
        });
    });
});
