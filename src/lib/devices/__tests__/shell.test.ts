import { describe, expect, it } from 'vitest';
import {
    resolveDeviceShellPath,
    getDeviceShellSummary,
    type StoredShellSessionLike,
} from '@/lib/devices/shell';

describe('device shell helpers', () => {
    describe('resolveDeviceShellPath', () => {
        it('should return boot_path when provided and non-empty', () => {
            const session: StoredShellSessionLike = {
                boot_path: '/custom-path',
            };
            expect(resolveDeviceShellPath(session)).toBe('/custom-path');
        });

        it('should return boot_path when it has non-whitespace content', () => {
            const session: StoredShellSessionLike = {
                boot_path: '  /spaced-path  ',
            };
            expect(resolveDeviceShellPath(session)).toBe('  /spaced-path  ');
        });

        it('should fall back when boot_path is empty string', () => {
            const session: StoredShellSessionLike = {
                boot_path: '',
                device_profile: 'cashier',
            };
            expect(resolveDeviceShellPath(session)).toBe('/terminal');
        });

        it('should fall back when boot_path is whitespace only', () => {
            const session: StoredShellSessionLike = {
                boot_path: '   ',
                device_profile: 'cashier',
            };
            expect(resolveDeviceShellPath(session)).toBe('/terminal');
        });

        it('should fall back when boot_path is null', () => {
            const session: StoredShellSessionLike = {
                boot_path: null,
                device_profile: 'kds',
            };
            expect(resolveDeviceShellPath(session)).toBe('/kds');
        });

        it('should fall back when boot_path is undefined', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
            };
            expect(resolveDeviceShellPath(session)).toBe('/waiter');
        });

        it('should use valid device_profile when boot_path is missing', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'kiosk',
            };
            expect(resolveDeviceShellPath(session)).toBe('/');
        });

        it('should resolve from device_type=terminal when profile is invalid', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'invalid_profile',
                device_type: 'terminal',
            };
            expect(resolveDeviceShellPath(session)).toBe('/terminal');
        });

        it('should resolve from device_type=kds when profile is invalid', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'invalid_profile',
                device_type: 'kds',
            };
            expect(resolveDeviceShellPath(session)).toBe('/kds');
        });

        it('should resolve from device_type=kiosk when profile is invalid', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'invalid_profile',
                device_type: 'kiosk',
            };
            expect(resolveDeviceShellPath(session)).toBe('/');
        });

        it('should default to pos when device_type is not terminal/kds/kiosk', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'invalid_profile',
                device_type: 'pos',
            };
            expect(resolveDeviceShellPath(session)).toBe('/waiter');
        });

        it('should default to pos when device_type is null and profile is invalid', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'invalid_profile',
                device_type: null,
            };
            expect(resolveDeviceShellPath(session)).toBe('/waiter');
        });

        it('should default to pos when both device_type and device_profile are missing', () => {
            const session: StoredShellSessionLike = {};
            expect(resolveDeviceShellPath(session)).toBe('/waiter');
        });
    });

    describe('getDeviceShellSummary', () => {
        it('should return full summary with all fields', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'cashier',
                device_type: 'terminal',
                name: 'Front Counter',
                boot_path: '/terminal',
                metadata: { managed_mode: 'dedicated' },
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.profileLabel).toBe('Cashier');
            expect(summary.typeLabel).toBe('Cashier Terminal');
            expect(summary.deviceName).toBe('Front Counter');
            expect(summary.launchPath).toBe('/terminal');
            expect(summary.managedModeLabel).toBe('Dedicated device shell');
        });

        it('should use profileLabel as deviceName when name is empty', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'kds',
                device_type: 'kds',
                name: '',
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.deviceName).toBe('Kitchen Display');
        });

        it('should use profileLabel as deviceName when name is whitespace', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'kds',
                device_type: 'kds',
                name: '   ',
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.deviceName).toBe('Kitchen Display');
        });

        it('should use profileLabel as deviceName when name is null', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
                name: null,
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.deviceName).toBe('Waiter');
        });

        it('should return PWA-backed shell label for managed_mode=pwa', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
                metadata: { managed_mode: 'pwa' },
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.managedModeLabel).toBe('PWA-backed shell');
        });

        it('should return default Managed device shell label when managed_mode is unrecognized', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
                metadata: { managed_mode: 'unknown' },
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.managedModeLabel).toBe('Managed device shell');
        });

        it('should return default Managed device shell label when metadata is null', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
                metadata: null,
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.managedModeLabel).toBe('Managed device shell');
        });

        it('should return default Managed device shell label when metadata is undefined', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.managedModeLabel).toBe('Managed device shell');
        });

        it('should return default Managed device shell label when managed_mode is missing from metadata', () => {
            const session: StoredShellSessionLike = {
                device_profile: 'waiter',
                device_type: 'pos',
                metadata: { other_key: 'value' },
            };

            const summary = getDeviceShellSummary(session);
            expect(summary.managedModeLabel).toBe('Managed device shell');
        });
    });
});
