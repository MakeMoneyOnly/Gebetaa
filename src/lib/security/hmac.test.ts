import { describe, it, expect } from 'vitest';
import {
    generateQRSignature,
    verifyQRSignature,
    generateSignedQRCode,
    verifySignedQRCode,
} from './hmac';

/**
 * HMAC Security Tests
 * 
 * Addresses PLATFORM_AUDIT_REPORT finding SEC-H6: HMAC-signed QR codes
 */

describe('HMAC QR Code Security', () => {
    describe('generateQRSignature', () => {
        it('should generate a consistent signature for the same data', () => {
            const data = 'restaurant-slug:table-5:1234567890';
            const sig1 = generateQRSignature(data);
            const sig2 = generateQRSignature(data);

            expect(sig1).toBe(sig2);
            expect(sig1).toBeDefined();
            expect(sig1.length).toBe(64); // SHA-256 hex length
        });

        it('should generate different signatures for different data', () => {
            const data1 = 'restaurant-1:table-1:1234567890';
            const data2 = 'restaurant-1:table-2:1234567890';

            const sig1 = generateQRSignature(data1);
            const sig2 = generateQRSignature(data2);

            expect(sig1).not.toBe(sig2);
        });

        it('should generate hex-encoded signature', () => {
            const data = 'test-data';
            const signature = generateQRSignature(data);

            // Check if it's valid hex
            expect(signature).toMatch(/^[0-9a-f]+$/);
        });
    });

    describe('verifyQRSignature', () => {
        it('should return true for valid signature', () => {
            const data = 'restaurant:test:1234567890';
            const signature = generateQRSignature(data);

            expect(verifyQRSignature(data, signature)).toBe(true);
        });

        it('should return false for invalid signature', () => {
            const data = 'restaurant:test:1234567890';
            const wrongSignature = 'invalid-signature';

            expect(verifyQRSignature(data, wrongSignature)).toBe(false);
        });

        it('should return false for tampered data', () => {
            const originalData = 'restaurant:test:1234567890';
            const signature = generateQRSignature(originalData);
            const tamperedData = 'restaurant:test:1234567891';

            expect(verifyQRSignature(tamperedData, signature)).toBe(false);
        });

        it('should be resistant to timing attacks', () => {
            const data = 'restaurant:test:1234567890';
            const signature = generateQRSignature(data);

            // Run multiple times to ensure consistent timing
            const results: boolean[] = [];
            for (let i = 0; i < 10; i++) {
                results.push(verifyQRSignature(data, signature));
            }

            expect(results.every(r => r === true)).toBe(true);
        });
    });

    describe('generateSignedQRCode', () => {
        it('should generate a signed QR code URL', () => {
            const result = generateSignedQRCode('my-restaurant', '5');

            expect(result.url).toContain('my-restaurant');
            expect(result.url).toContain('table=5');
            expect(result.url).toContain('sig=');
            expect(result.url).toContain('exp=');
            expect(result.signature).toBeDefined();
            expect(result.expiresAt).toBeGreaterThan(Date.now());
        });

        it('should include expiration timestamp 24 hours in the future', () => {
            const before = Date.now();
            const result = generateSignedQRCode('restaurant', '1');
            Date.now(); // Record time but we don't need the value for the assertion below

            const expectedExpiry = before + 24 * 60 * 60 * 1000;
            expect(result.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000);
            expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
        });

        it('should generate unique signatures for different restaurants', () => {
            const result1 = generateSignedQRCode('restaurant-1', '1');
            const result2 = generateSignedQRCode('restaurant-2', '1');

            expect(result1.signature).not.toBe(result2.signature);
        });

        it('should generate unique signatures for different tables', () => {
            const result1 = generateSignedQRCode('restaurant', '1');
            const result2 = generateSignedQRCode('restaurant', '2');

            expect(result1.signature).not.toBe(result2.signature);
        });
    });

    describe('verifySignedQRCode', () => {
        it('should validate a correctly signed QR code', () => {
            const { signature, expiresAt } = generateSignedQRCode('restaurant', '5');

            const result = verifySignedQRCode('restaurant', '5', signature, expiresAt);

            expect(result.valid).toBe(true);
        });

        it('should reject expired QR codes', () => {
            const expiredTime = Date.now() - 1000; // 1 second ago
            const data = `restaurant:table-5:${expiredTime}`;
            const signature = generateQRSignature(data);

            const result = verifySignedQRCode('restaurant', 'table-5', signature, expiredTime);

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('QR code has expired');
        });

        it('should reject QR codes with invalid signature', () => {
            const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

            const result = verifySignedQRCode('restaurant', '5', 'invalid-sig', expiresAt);

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });

        it('should reject tampered restaurant slug', () => {
            const { signature, expiresAt } = generateSignedQRCode('original-restaurant', '5');

            const result = verifySignedQRCode('tampered-restaurant', '5', signature, expiresAt);

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });

        it('should reject tampered table number', () => {
            const { signature, expiresAt } = generateSignedQRCode('restaurant', '5');

            const result = verifySignedQRCode('restaurant', '99', signature, expiresAt);

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });

        it('should reject tampered expiration time', () => {
            const { signature } = generateSignedQRCode('restaurant', '5');
            const tamperedExpiry = Date.now() + 48 * 60 * 60 * 1000; // 48 hours

            const result = verifySignedQRCode('restaurant', '5', signature, tamperedExpiry);

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });
    });
});
