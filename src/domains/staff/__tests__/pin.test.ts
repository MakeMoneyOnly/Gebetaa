import { describe, expect, it } from 'vitest';
import {
    buildStaffSessionExpiry,
    hashStaffPin,
    isHashedStaffPin,
    verifyStoredStaffPin,
} from '../pin';

describe('staff PIN helpers', () => {
    it('hashes PINs into deterministic non-plaintext values', () => {
        const hashed = hashStaffPin('1234');

        expect(hashed).not.toBe('1234');
        expect(hashed).toMatch(/^h1:[a-f0-9]{64}$/);
        expect(hashStaffPin('1234')).toBe(hashed);
        expect(hashStaffPin('4321')).not.toBe(hashed);
    });

    it('recognizes hashed PIN format and verifies legacy/plaintext values', () => {
        const hashed = hashStaffPin('1234');

        expect(isHashedStaffPin(hashed)).toBe(true);
        expect(isHashedStaffPin('1234')).toBe(false);
        expect(verifyStoredStaffPin(hashed, '1234')).toBe(true);
        expect(verifyStoredStaffPin('1234', '1234')).toBe(true);
        expect(verifyStoredStaffPin(hashed, '9999')).toBe(false);
    });

    it('builds future waiter session expiry timestamps', () => {
        const issuedAt = '2026-04-28T10:00:00.000Z';

        expect(buildStaffSessionExpiry(issuedAt, 60)).toBe('2026-04-28T11:00:00.000Z');
    });
});
