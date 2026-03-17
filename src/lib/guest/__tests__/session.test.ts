import { describe, it, expect, vi } from 'vitest';
import {
    generateHmacSecret,
    signPayload,
    verifySignature,
    signWithMasterSecret,
    verifyMasterSignature,
} from '@/lib/security/hmac';

// Mock the environment variables
const mockEnv = {
    QR_HMAC_SECRET: 'test-qr-secret-key-for-testing-32chars',
    HMAC_SECRET: 'test-master-secret-key-for-testing-32',
};

vi.mock('process.env', () => mockEnv);

describe('Session HMAC Utilities', () => {
    describe('generateHmacSecret', () => {
        it('should generate a base64-encoded secret', () => {
            const secret = generateHmacSecret();

            expect(secret).toBeDefined();
            expect(typeof secret).toBe('string');
            // Base64 encoded 32 bytes should be ~44 chars
            expect(secret.length).toBeGreaterThan(40);
            expect(secret.length).toBeLessThan(50);
        });

        it('should generate unique secrets each time', () => {
            const secret1 = generateHmacSecret();
            const secret2 = generateHmacSecret();

            expect(secret1).not.toBe(secret2);
        });
    });

    describe('signPayload', () => {
        it('should generate a consistent signature for the same payload and secret', () => {
            const secret = generateHmacSecret();
            const payload = 'test-payload-data';

            const sig1 = signPayload(payload, secret);
            const sig2 = signPayload(payload, secret);

            expect(sig1).toBe(sig2);
            expect(sig1).toBeDefined();
        });

        it('should generate different signatures for different payloads', () => {
            const secret = generateHmacSecret();

            const sig1 = signPayload('payload-1', secret);
            const sig2 = signPayload('payload-2', secret);

            expect(sig1).not.toBe(sig2);
        });

        it('should generate different signatures with different secrets', () => {
            const secret1 = generateHmacSecret();
            const secret2 = generateHmacSecret();
            const payload = 'same-payload';

            const sig1 = signPayload(payload, secret1);
            const sig2 = signPayload(payload, secret2);

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('verifySignature', () => {
        it('should return true for valid signature', () => {
            const secret = generateHmacSecret();
            const payload = 'test-payload';

            const signature = signPayload(payload, secret);
            const isValid = verifySignature(payload, signature, secret);

            expect(isValid).toBe(true);
        });

        it('should return false for invalid signature', () => {
            const secret = generateHmacSecret();
            const payload = 'test-payload';

            const isValid = verifySignature(payload, 'invalid-signature', secret);

            expect(isValid).toBe(false);
        });

        it('should return false for tampered payload', () => {
            const secret = generateHmacSecret();
            const originalPayload = 'original-payload';
            const tamperedPayload = 'tampered-payload';

            const signature = signPayload(originalPayload, secret);
            const isValid = verifySignature(tamperedPayload, signature, secret);

            expect(isValid).toBe(false);
        });

        it('should return false for wrong secret', () => {
            const secret1 = generateHmacSecret();
            const secret2 = generateHmacSecret();
            const payload = 'test-payload';

            const signature = signPayload(payload, secret1);
            const isValid = verifySignature(payload, signature, secret2);

            expect(isValid).toBe(false);
        });

        it('should be timing-safe (same result for multiple verifications)', () => {
            const secret = generateHmacSecret();
            const payload = 'test-payload';
            const signature = signPayload(payload, secret);

            const results = Array(10)
                .fill(null)
                .map(() => verifySignature(payload, signature, secret));

            expect(results.every(r => r === true)).toBe(true);
        });
    });
});

describe('Master Secret Functions', () => {
    // These tests verify the master secret functions work with the mocked env

    describe('signWithMasterSecret', () => {
        it('should generate a signature using the master secret', () => {
            const payload = 'test-payload';

            const signature = signWithMasterSecret(payload);

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
        });

        it('should generate consistent signatures for the same payload', () => {
            const payload = 'test-payload';

            const sig1 = signWithMasterSecret(payload);
            const sig2 = signWithMasterSecret(payload);

            expect(sig1).toBe(sig2);
        });
    });

    describe('verifyMasterSignature', () => {
        it('should return true for valid master signature', () => {
            const payload = 'test-payload';

            const signature = signWithMasterSecret(payload);
            const isValid = verifyMasterSignature(payload, signature);

            expect(isValid).toBe(true);
        });

        it('should return false for invalid master signature', () => {
            const payload = 'test-payload';

            const isValid = verifyMasterSignature(payload, 'invalid-sig');

            expect(isValid).toBe(false);
        });
    });
});

// Additional integration tests for session token format
describe('Session Token Format', () => {
    it('should create a token with the correct prefix', () => {
        const secret = generateHmacSecret();
        const payload = '1234567890:1234567890'; // session_id:expires_at
        const signature = signPayload(payload, secret);
        const tokenData = Buffer.from(`${payload}:${signature}`).toString('base64url');
        const token = `session_${tokenData}`;

        expect(token.startsWith('session_')).toBe(true);
    });

    it('should use URL-safe base64 encoding', () => {
        const secret = generateHmacSecret();
        const payload = 'test-payload';
        const signature = signPayload(payload, secret);

        // The signature should be base64 encoded (standard +/ replaced with -_)
        // These characters should NOT appear in base64url encoding
        expect(signature).not.toContain('+');
        expect(signature).not.toContain('/');
        // Base64url uses - and _ as replacements
        // Note: Not all base64url strings will contain both, but they shouldn't contain + or /
    });
});
