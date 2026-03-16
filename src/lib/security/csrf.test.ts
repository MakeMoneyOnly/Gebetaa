/**
 * CSRF Protection Tests
 *
 * Tests for src/lib/security/csrf.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateCsrfToken,
    validateCsrfToken,
    extractCsrfToken,
    isValidOrigin,
    getExpectedOrigin,
    validateOrigin,
    verifyOrigin,
} from '@/lib/security/csrf';

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
    headers: vi.fn(),
}));

// Mock crypto for token generation
Object.defineProperty(globalThis, 'crypto', {
    value: {
        getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
        subtle: {
            digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
    },
    writable: true,
});

describe('csrf', () => {
    describe('generateCsrfToken', () => {
        it('should generate a token of correct length', () => {
            const token = generateCsrfToken();
            expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
        });

        it('should generate unique tokens', () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            expect(token1).not.toBe(token2);
        });

        it('should only contain hex characters', () => {
            const token = generateCsrfToken();
            expect(token).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe('validateCsrfToken', () => {
        beforeEach(() => {
            vi.mocked(vi.importMock('next/headers') as any).cookies = vi.fn().mockResolvedValue({
                get: vi.fn().mockReturnValue({ value: 'hashed-token-123' }),
            });
        });

        it('should return invalid when token is missing', async () => {
            const result = await validateCsrfToken(null);
            expect(result.valid).toBe(false);
            expect(result.reason).toBe('CSRF token missing');
        });

        it('should return invalid when token is undefined', async () => {
            const result = await validateCsrfToken(undefined);
            expect(result.valid).toBe(false);
            expect(result.reason).toBe('CSRF token missing');
        });

        it('should return invalid when token is empty string', async () => {
            const result = await validateCsrfToken('');
            expect(result.valid).toBe(false);
            expect(result.reason).toBe('CSRF token missing');
        });
    });

    describe('extractCsrfToken', () => {
        it('should extract token from header', () => {
            const request = {
                headers: {
                    get: vi.fn().mockReturnValue('header-token-123'),
                },
            } as unknown as import('next/server').NextRequest;

            const token = extractCsrfToken(request);
            expect(token).toBe('header-token-123');
        });

        it('should return null when no header', () => {
            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(null),
                },
            } as unknown as import('next/server').NextRequest;

            const token = extractCsrfToken(request);
            expect(token).toBeNull();
        });
    });

    describe('getExpectedOrigin', () => {
        afterEach(() => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.ALLOWED_ORIGINS;
        });

        it('should return NEXT_PUBLIC_APP_URL when set', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';
            expect(getExpectedOrigin()).toBe('https://app.gebeta.com');
        });

        it('should return localhost in development', () => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            const origin = getExpectedOrigin();
            expect(origin).toBe('http://localhost:3000');
        });
    });

    describe('isValidOrigin', () => {
        afterEach(() => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.ALLOWED_ORIGINS;
        });

        it('should return false when origin is null', () => {
            expect(isValidOrigin(null)).toBe(false);
        });

        it('should return false when origin is undefined', () => {
            // undefined is treated as null by the type system
            expect(isValidOrigin(null)).toBe(false);
        });

        it('should return true for same origin', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';
            expect(isValidOrigin('https://app.gebeta.com')).toBe(true);
        });

        it('should return true for localhost development', () => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            expect(isValidOrigin('http://localhost:3000')).toBe(true);
        });

        it('should return false for different origin', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';
            expect(isValidOrigin('https://malicious.com')).toBe(false);
        });

        it('should return true for allowed origins from env', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';
            process.env.ALLOWED_ORIGINS = 'https://admin.gebeta.com,https://partner.gebeta.com';

            expect(isValidOrigin('https://admin.gebeta.com')).toBe(true);
            expect(isValidOrigin('https://partner.gebeta.com')).toBe(true);
        });

        it('should return false for invalid origin URL', () => {
            expect(isValidOrigin('not-a-valid-url')).toBe(false);
        });

        it('should handle port differences correctly', () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';
            // Same domain but different port - should be considered different origin
            expect(isValidOrigin('https://app.gebeta.com:8080')).toBe(false);
        });
    });

    describe('validateOrigin', () => {
        beforeEach(() => {
            vi.mock('next/headers', () => ({
                headers: vi.fn().mockResolvedValue({
                    get: vi.fn().mockImplementation((key: string) => {
                        if (key === 'origin') return 'https://app.gebeta.com';
                        if (key === 'referer') return 'https://app.gebeta.com/page';
                        return null;
                    }),
                }),
            }));
        });

        afterEach(() => {
            delete process.env.NEXT_PUBLIC_APP_URL;
        });

        it('should return valid when origin matches', async () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';

            const result = await validateOrigin();
            expect(result.valid).toBe(true);
            expect(result.details?.origin).toBe('https://app.gebeta.com');
        });
    });

    describe('verifyOrigin', () => {
        beforeEach(() => {
            vi.mock('next/headers', () => ({
                headers: vi.fn().mockResolvedValue({
                    get: vi.fn().mockImplementation((key: string) => {
                        if (key === 'origin') return 'https://app.gebeta.com';
                        if (key === 'referer') return 'https://app.gebeta.com/page';
                        return null;
                    }),
                }),
            }));
        });

        afterEach(() => {
            delete process.env.NEXT_PUBLIC_APP_URL;
        });

        it('should not throw when origin is valid', async () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';

            await expect(verifyOrigin()).resolves.not.toThrow();
        });

        it('should throw when origin is invalid', async () => {
            process.env.NEXT_PUBLIC_APP_URL = 'https://app.gebeta.com';

            vi.mock('next/headers', () => ({
                headers: vi.fn().mockResolvedValue({
                    get: vi.fn().mockReturnValue(null),
                }),
            }));

            await expect(verifyOrigin()).rejects.toThrow('Invalid origin');
        });
    });
});
