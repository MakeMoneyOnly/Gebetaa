/**
 * Confirmation Token Tests
 *
 * Tests for src/lib/security/confirmationToken.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateConfirmationToken,
    verifyConfirmationToken,
    generateConfirmationOTP,
    verifyConfirmationOTP,
    withConfirmation,
    type SensitiveAction,
} from '@/lib/security/confirmationToken';

describe('confirmationToken', () => {
    const TEST_SECRET = 'test-hmac-secret-key-for-testing';

    beforeEach(() => {
        process.env.HMAC_SECRET = TEST_SECRET;
    });

    afterEach(() => {
        delete process.env.HMAC_SECRET;
        delete process.env.JWT_SECRET;
    });

    describe('generateConfirmationToken', () => {
        it('should generate a valid token with correct properties', () => {
            const { token, expiresAt } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
            expect(expiresAt).toBeGreaterThan(Date.now());
        });

        it('should generate unique tokens for same inputs', () => {
            const { token: token1 } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            // Wait a tiny bit to ensure different nonce
            const { token: token2 } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            expect(token1).not.toBe(token2);
        });

        it('should include all sensitive action types', () => {
            const actions: SensitiveAction[] = [
                'delete_restaurant',
                'delete_staff',
                'change_role',
                'transfer_ownership',
                'delete_menu_item',
                'void_order',
                'refund_payment',
                'close_register',
                'export_data',
                'reset_integration',
            ];

            actions.forEach(action => {
                expect(() =>
                    generateConfirmationToken(action, 'resource-1', 'user-1', 'resto-1')
                ).not.toThrow();
            });
        });

        it('should throw when HMAC_SECRET is not set', () => {
            delete process.env.HMAC_SECRET;
            delete process.env.JWT_SECRET;

            expect(() =>
                generateConfirmationToken('void_order', 'order-1', 'user-1', 'resto-1')
            ).toThrow('HMAC_SECRET or JWT_SECRET is required');
        });
    });

    describe('verifyConfirmationToken', () => {
        it('should verify a valid token', () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const result = verifyConfirmationToken(
                token,
                'void_order',
                'user-456',
                'restaurant-789'
            );

            expect(result.valid).toBe(true);
            expect(result.resourceId).toBe('order-123');
        });

        it('should reject expired token', () => {
            // Generate a token but manually create an expired one
            const expiredToken = Buffer.from(
                JSON.stringify({
                    action: 'void_order',
                    resourceId: 'order-123',
                    userId: 'user-456',
                    restaurantId: 'restaurant-789',
                    expiresAt: Date.now() - 1000, // Expired
                    nonce: 'test-nonce',
                    signature: 'test-signature',
                })
            ).toString('base64url');

            const result = verifyConfirmationToken(
                expiredToken,
                'void_order',
                'user-456',
                'restaurant-789'
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Confirmation token has expired');
        });

        it('should reject token with wrong action', () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const result = verifyConfirmationToken(
                token,
                'delete_menu_item', // Different action
                'user-456',
                'restaurant-789'
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid action for confirmation token');
        });

        it('should reject token with wrong user', () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const result = verifyConfirmationToken(
                token,
                'void_order',
                'wrong-user', // Different user
                'restaurant-789'
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Confirmation token does not belong to current user');
        });

        it('should reject token with wrong restaurant', () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const result = verifyConfirmationToken(
                token,
                'void_order',
                'user-456',
                'wrong-restaurant' // Different restaurant
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Confirmation token does not belong to current restaurant');
        });

        it('should reject invalid token format', () => {
            const result = verifyConfirmationToken(
                'not-valid-base64-url',
                'void_order',
                'user-456',
                'restaurant-789'
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid confirmation token format');
        });

        it('should reject tampered token', () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            // Tamper with the token
            const tamperedToken = token.slice(0, -2) + 'xx';

            const result = verifyConfirmationToken(
                tamperedToken,
                'void_order',
                'user-456',
                'restaurant-789'
            );

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Invalid confirmation token signature');
        });
    });

    describe('withConfirmation', () => {
        it('should wrap a handler with confirmation verification', async () => {
            const handler = vi.fn().mockResolvedValue('success');

            const wrappedHandler = withConfirmation('void_order', handler, args => args[0]);

            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const result = await wrappedHandler(token, 'user-456', 'restaurant-789', 'order-123');

            expect(handler).toHaveBeenCalledWith('order-123');
            expect(result).toBe('success');
        });

        it('should throw when confirmation fails', async () => {
            const handler = vi.fn();

            const wrappedHandler = withConfirmation('void_order', handler, args => args[0]);

            await expect(
                wrappedHandler('invalid-token', 'user-456', 'restaurant-789', 'order-123')
            ).rejects.toThrow('Confirmation failed');
        });

        it('should throw when resource ID mismatch', async () => {
            const { token } = generateConfirmationToken(
                'void_order',
                'order-123',
                'user-456',
                'restaurant-789'
            );

            const handler = vi.fn();

            const wrappedHandler = withConfirmation('void_order', handler, args => args[0]);

            // Pass different resource ID than what's in token
            await expect(
                wrappedHandler(token, 'user-456', 'restaurant-789', 'different-order')
            ).rejects.toThrow('Confirmation token resource ID mismatch');
        });
    });

    describe('generateConfirmationOTP', () => {
        it('should generate 6-character OTP', () => {
            const otp = generateConfirmationOTP('void_order', 'order-123', 'user-456');

            expect(otp).toHaveLength(6);
            expect(otp).toMatch(/^[A-F0-9]+$/);
        });

        it('should generate different OTPs for different inputs', () => {
            const otp1 = generateConfirmationOTP('void_order', 'order-123', 'user-456');
            const otp2 = generateConfirmationOTP('delete_menu_item', 'menu-1', 'user-789');

            expect(otp1).not.toBe(otp2);
        });
    });

    describe('verifyConfirmationOTP', () => {
        it('should verify valid OTP', () => {
            const otp = generateConfirmationOTP('void_order', 'order-123', 'user-456');

            const result = verifyConfirmationOTP(otp, 'void_order', 'order-123', 'user-456');

            expect(result).toBe(true);
        });

        it('should reject invalid OTP', () => {
            const result = verifyConfirmationOTP('INVALID', 'void_order', 'order-123', 'user-456');

            expect(result).toBe(false);
        });

        it('should accept OTP from previous time slot', () => {
            // Generate OTP
            const otp = generateConfirmationOTP('void_order', 'order-123', 'user-456');

            // Mock time to move forward 30 seconds (within tolerance)
            const originalDateNow = Date.now;
            const mockTime = Date.now() + 30000;
            Date.now = () => mockTime;

            const result = verifyConfirmationOTP(otp, 'void_order', 'order-123', 'user-456');

            // Restore original Date.now
            Date.now = originalDateNow;

            expect(result).toBe(true);
        });
    });
});
