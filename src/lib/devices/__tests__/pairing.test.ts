import { describe, expect, it } from 'vitest';
import {
    normalizePairingCode,
    generatePairingCode,
    buildPairingExpiry,
    generateDeviceToken,
    resolveProvisionedDeviceShape,
    getDeviceBootPathFromRecord,
    PairDeviceSchema,
    ProvisionDeviceSchema,
} from '@/lib/devices/pairing';

describe('device pairing helpers', () => {
    describe('normalizePairingCode', () => {
        it('should uppercase the code', () => {
            expect(normalizePairingCode('abc123')).toBe('ABC123');
        });

        it('should remove non-alphanumeric characters', () => {
            expect(normalizePairingCode('AB-C D!12')).toBe('ABCD12');
        });

        it('should truncate to 12 characters', () => {
            expect(normalizePairingCode('ABCDEFGHIJKLMNOP')).toBe('ABCDEFGHIJKL');
        });

        it('should handle already normalized codes', () => {
            expect(normalizePairingCode('ABC123')).toBe('ABC123');
        });
    });

    describe('generatePairingCode', () => {
        it('should generate a code of default length', () => {
            const code = generatePairingCode();
            expect(code.length).toBe(6); // DEVICE_PAIRING_CODE_LENGTH default
        });

        it('should generate a code of custom length', () => {
            const code = generatePairingCode(8);
            expect(code.length).toBe(8);
        });

        it('should only contain valid characters', () => {
            const code = generatePairingCode(20);
            const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            for (const char of code) {
                expect(validChars).toContain(char);
            }
        });

        it('should generate different codes on successive calls', () => {
            const codes = new Set(Array.from({ length: 10 }, () => generatePairingCode()));
            // At least some should be different (extremely unlikely all 10 are the same)
            expect(codes.size).toBeGreaterThan(1);
        });
    });

    describe('buildPairingExpiry', () => {
        it('should return ISO date string in the future', () => {
            const before = Date.now() + 14 * 60_000;
            const expiry = buildPairingExpiry();
            const after = Date.now() + 16 * 60_000;
            const expiryMs = new Date(expiry).getTime();
            expect(expiryMs).toBeGreaterThan(before);
            expect(expiryMs).toBeLessThan(after);
        });

        it('should use custom minutes', () => {
            const before = Date.now() + 29 * 60_000;
            const expiry = buildPairingExpiry(30);
            const after = Date.now() + 31 * 60_000;
            const expiryMs = new Date(expiry).getTime();
            expect(expiryMs).toBeGreaterThan(before);
            expect(expiryMs).toBeLessThan(after);
        });
    });

    describe('generateDeviceToken', () => {
        it('should return a UUID string', () => {
            const token = generateDeviceToken();
            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );
        });

        it('should generate unique tokens', () => {
            const tokens = new Set(Array.from({ length: 10 }, () => generateDeviceToken()));
            expect(tokens.size).toBe(10);
        });
    });

    describe('resolveProvisionedDeviceShape', () => {
        it('should use provided device_type and device_profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_type: 'kds',
                device_profile: 'kds',
            });
            expect(result.deviceType).toBe('kds');
            expect(result.deviceProfile).toBe('kds');
        });

        it('should resolve profile from device_type when no profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_type: 'kds',
            });
            expect(result.deviceProfile).toBe('kds');
        });

        it('should default device_type to pos when not provided', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
            });
            expect(result.deviceType).toBe('pos');
        });

        it('should resolve terminal device_type from cashier profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_profile: 'cashier',
            });
            expect(result.deviceType).toBe('terminal');
        });

        it('should resolve kds device_type from kds profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_profile: 'kds',
            });
            expect(result.deviceType).toBe('kds');
        });

        it('should resolve kiosk device_type from kiosk profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_profile: 'kiosk',
            });
            expect(result.deviceType).toBe('kiosk');
        });

        it('should resolve pos device_type from waiter profile', () => {
            const result = resolveProvisionedDeviceShape({
                name: 'Test Device',
                device_profile: 'waiter',
            });
            expect(result.deviceType).toBe('pos');
        });
    });

    describe('getDeviceBootPathFromRecord', () => {
        it('should return boot path for valid device_profile', () => {
            const path = getDeviceBootPathFromRecord({
                device_profile: 'kds',
                device_type: 'kds',
            });
            expect(path).toBeDefined();
            expect(typeof path).toBe('string');
        });

        it('should fall back to resolveDeviceProfile when profile is invalid', () => {
            const path = getDeviceBootPathFromRecord({
                device_profile: 'invalid_profile',
                device_type: 'kds',
            });
            expect(path).toBeDefined();
        });

        it('should fall back to pos when profile and type are null', () => {
            const path = getDeviceBootPathFromRecord({
                device_profile: null,
                device_type: null,
            });
            expect(path).toBeDefined();
        });

        it('should include restaurant_slug in kiosk path when provided', () => {
            const path = getDeviceBootPathFromRecord({
                device_profile: 'kiosk',
                restaurant_slug: 'my-restaurant',
            });
            expect(path).toContain('my-restaurant');
            expect(path).toBe('/my-restaurant?entry=menu');
        });

        it('should return root path for kiosk without slug', () => {
            const path = getDeviceBootPathFromRecord({
                device_profile: 'kiosk',
            });
            expect(path).toBe('/');
        });
    });

    describe('PairDeviceSchema', () => {
        it('should validate a minimal pair request', () => {
            const result = PairDeviceSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should validate a full pair request', () => {
            const result = PairDeviceSchema.safeParse({
                code: 'ABC123',
                pairing_code: 'XYZ789',
                device_uuid: '550e8400-e29b-41d4-a716-446655440000',
                app_version: '1.0.0',
                platform: 'android',
                profile_hint: 'cashier',
                printer: {
                    connection_type: 'bluetooth',
                    device_id: 'printer-1',
                    device_name: 'Thermal Printer',
                    mac_address: '00:11:22:33:44:55',
                },
            });
            expect(result.success).toBe(true);
        });

        it('should reject code that is too short', () => {
            const result = PairDeviceSchema.safeParse({ code: 'AB' });
            expect(result.success).toBe(false);
        });
    });

    describe('ProvisionDeviceSchema', () => {
        it('should validate a minimal provision request', () => {
            const result = ProvisionDeviceSchema.safeParse({ name: 'Test Device' });
            expect(result.success).toBe(true);
        });

        it('should reject when name is missing', () => {
            const result = ProvisionDeviceSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('should validate a full provision request', () => {
            const result = ProvisionDeviceSchema.safeParse({
                name: 'KDS Device',
                device_type: 'kds',
                device_profile: 'kds',
                location_id: '550e8400-e29b-41d4-a716-446655440000',
                assigned_zones: ['kitchen'],
                management_provider: 'esper',
                metadata: { key: 'value' },
            });
            expect(result.success).toBe(true);
        });
    });
});
