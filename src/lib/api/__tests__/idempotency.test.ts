import { describe, expect, it, vi } from 'vitest';
import { resolveIdempotencyKey, isIdempotencyKeyValid } from '@/lib/api/idempotency';

describe('idempotency helpers', () => {
    describe('resolveIdempotencyKey', () => {
        it('should return trimmed explicit key when provided', () => {
            const key = resolveIdempotencyKey('  my-key-123  ');
            expect(key).toBe('my-key-123');
        });

        it('should return explicit key as-is when already trimmed', () => {
            const key = resolveIdempotencyKey('my-key');
            expect(key).toBe('my-key');
        });

        it('should generate a UUID when no key is provided', () => {
            const key = resolveIdempotencyKey();
            expect(key).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });

        it('should generate a UUID when key is null', () => {
            const key = resolveIdempotencyKey(null);
            expect(key).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });

        it('should generate a UUID when key is empty string', () => {
            const key = resolveIdempotencyKey('');
            expect(key).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });

        it('should generate a UUID when key is whitespace only', () => {
            const key = resolveIdempotencyKey('   ');
            expect(key).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });

        it('should generate unique UUIDs on successive calls', () => {
            const key1 = resolveIdempotencyKey();
            const key2 = resolveIdempotencyKey();
            expect(key1).not.toBe(key2);
        });
    });

    describe('isIdempotencyKeyValid', () => {
        it('should return true for a valid UUID v4', () => {
            expect(isIdempotencyKeyValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        });

        it('should return true for uppercase UUID v4', () => {
            expect(isIdempotencyKeyValid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
        });

        it('should return true for mixed case UUID v4', () => {
            expect(isIdempotencyKeyValid('550e8400-E29b-41d4-A716-446655440000')).toBe(true);
        });

        it('should return false for null', () => {
            expect(isIdempotencyKeyValid(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isIdempotencyKeyValid(undefined)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isIdempotencyKeyValid('')).toBe(false);
        });

        it('should return false for non-UUID string', () => {
            expect(isIdempotencyKeyValid('not-a-uuid')).toBe(false);
        });

        it('should return false for UUID with wrong version', () => {
            // Version 3 instead of 4
            expect(isIdempotencyKeyValid('550e8400-e29b-31d4-a716-446655440000')).toBe(false);
        });

        it('should return false for UUID with wrong variant', () => {
            // Variant bits 0 instead of 10
            expect(isIdempotencyKeyValid('550e8400-e29b-41d4-0716-446655440000')).toBe(false);
        });

        it('should return false for UUID missing hyphens', () => {
            expect(isIdempotencyKeyValid('550e8400e29b41d4a716446655440000')).toBe(false);
        });
    });
});
