/**
 * Rate Limiter Tests
 *
 * Tests for src/lib/security/rateLimiter.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getClientIdentifier,
    checkRateLimit,
    logRateLimitedRequest,
    cleanupRateLimitLogs,
    createRateLimitMiddleware,
    withRateLimit,
    RATE_LIMIT_CONFIGS,
} from '@/lib/security/rateLimiter';

// Mock NextRequest with proper Headers interface
const createMockRequest = (
    overrides: {
        fingerprint?: string;
        ip?: string;
        userAgent?: string;
        method?: string;
    } = {}
): import('next/server').NextRequest => {
    const headersMap = new Map<string, string>([
        ['x-fingerprint', overrides.fingerprint || ''],
        ['x-device-id', ''],
        ['x-forwarded-for', overrides.ip || ''],
        ['x-real-ip', ''],
        ['user-agent', overrides.userAgent || 'test-agent'],
    ]);

    const headers = {
        get: (key: string) => headersMap.get(key) || null,
        set: (key: string, value: string) => headersMap.set(key, value),
    };

    return {
        headers,
        method: overrides.method || 'GET',
        get: (key: string) => headers.get(key),
    } as unknown as import('next/server').NextRequest;
};

// Helper to set header on mock request
const setMockHeader = (request: import('next/server').NextRequest, key: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request.headers as any).set(key, value);
};

describe('rateLimiter', () => {
    describe('getClientIdentifier', () => {
        it('should extract fingerprint from x-fingerprint header', () => {
            const request = createMockRequest({ fingerprint: 'device-123' });
            const result = getClientIdentifier(request);

            expect(result.fingerprint).toBe('device-123');
        });

        it('should extract fingerprint from x-device-id when x-fingerprint is missing', () => {
            const request = createMockRequest({ fingerprint: '' });
            setMockHeader(request, 'x-device-id', 'device-456');

            const result = getClientIdentifier(request);
            expect(result.fingerprint).toBe('device-456');
        });

        it('should fall back to IP:UserAgent when no fingerprint available', () => {
            const request = createMockRequest({ ip: '192.168.1.1', userAgent: 'Mozilla/5.0' });
            setMockHeader(request, 'x-fingerprint', '');
            setMockHeader(request, 'x-device-id', '');

            const result = getClientIdentifier(request);
            expect(result.fingerprint).toContain('192.168.1.1');
        });

        it('should extract IP from x-forwarded-for', () => {
            const request = createMockRequest({ ip: '10.0.0.1, 10.0.0.2' });
            const result = getClientIdentifier(request);

            expect(result.ipAddress).toBe('10.0.0.1');
        });

        it('should extract IP from x-real-ip when x-forwarded-for is missing', () => {
            const request = createMockRequest({ ip: '' });
            setMockHeader(request, 'x-real-ip', '172.16.0.1');

            const result = getClientIdentifier(request);
            expect(result.ipAddress).toBe('172.16.0.1');
        });

        it('should return unknown for missing IP', () => {
            const request = createMockRequest({ ip: '' });
            const result = getClientIdentifier(request);

            expect(result.ipAddress).toBe('unknown');
        });

        it('should extract user agent', () => {
            const request = createMockRequest({ userAgent: 'Chrome/120.0' });
            const result = getClientIdentifier(request);

            expect(result.userAgent).toBe('Chrome/120.0');
        });
    });

    describe('RATE_LIMIT_CONFIGS', () => {
        it('should have auth config with stricter limits', () => {
            expect(RATE_LIMIT_CONFIGS.auth.windowSec).toBe(15 * 60);
            expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5);
            expect(RATE_LIMIT_CONFIGS.auth.keyPrefix).toBe('rl:auth');
        });

        it('should have orderCreate config', () => {
            expect(RATE_LIMIT_CONFIGS.orderCreate.windowSec).toBe(60);
            expect(RATE_LIMIT_CONFIGS.orderCreate.maxRequests).toBe(10);
        });

        it('should have guest config', () => {
            expect(RATE_LIMIT_CONFIGS.guest.windowSec).toBe(60);
            expect(RATE_LIMIT_CONFIGS.guest.maxRequests).toBe(60);
        });

        it('should have api config', () => {
            expect(RATE_LIMIT_CONFIGS.api.windowSec).toBe(60);
            expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100);
        });
    });

    describe('checkRateLimit', () => {
        beforeEach(() => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 5, error: null }),
                                }),
                            }),
                        }),
                    }),
                }),
            }));
        });

        it('should allow request when under limit', async () => {
            const result = await checkRateLimit(
                'test-fingerprint',
                'rl:api',
                RATE_LIMIT_CONFIGS.api
            );

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(95);
            expect(result.resetAt).toBeInstanceOf(Date);
        });

        it('should deny request when at limit', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 100, error: null }),
                                }),
                            }),
                        }),
                    }),
                }),
            }));

            const result = await checkRateLimit(
                'test-fingerprint',
                'rl:api',
                RATE_LIMIT_CONFIGS.api
            );

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBe(60);
        });

        it('should fail closed on database error', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (_cb: unknown, reject: (err: Error) => void) =>
                                        reject(new Error('DB error')),
                                }),
                            }),
                        }),
                    }),
                }),
            }));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await checkRateLimit(
                'test-fingerprint',
                'rl:api',
                RATE_LIMIT_CONFIGS.api
            );

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBe(60);

            consoleSpy.mockRestore();
        });

        it('should handle null count gracefully', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: null; error: null }) => void) =>
                                        cb({ count: null, error: null }),
                                }),
                            }),
                        }),
                    }),
                }),
            }));

            const result = await checkRateLimit(
                'test-fingerprint',
                'rl:api',
                RATE_LIMIT_CONFIGS.api
            );

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(100);
        });
    });

    describe('logRateLimitedRequest', () => {
        it('should log request successfully', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
            }));

            await logRateLimitedRequest(
                'fingerprint-123',
                'rl:api',
                '192.168.1.1',
                'test-agent',
                'restaurant-1',
                { action: 'test' }
            );

            expect(mockFrom).toHaveBeenCalledWith('rate_limit_logs');
            expect(mockInsert).toHaveBeenCalledWith({
                fingerprint: 'fingerprint-123',
                action: 'rl:api',
                ip_address: '192.168.1.1',
                user_agent: 'test-agent',
                restaurant_id: 'restaurant-1',
                metadata: { action: 'test' },
            });
        });

        it('should handle insert error gracefully', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: new Error('Insert failed') });
            const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
            }));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw
            await expect(
                logRateLimitedRequest('fingerprint', 'rl:api', '127.0.0.1', 'agent')
            ).resolves.not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('cleanupRateLimitLogs', () => {
        it('should cleanup old logs successfully', async () => {
            const mockDelete = vi.fn().mockResolvedValue({ count: 50, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                delete: mockDelete,
            });

            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
            }));

            const result = await cleanupRateLimitLogs(24);

            expect(result).toBe(50);
            expect(mockFrom).toHaveBeenCalledWith('rate_limit_logs');
        });

        it('should return 0 on error', async () => {
            const mockDelete = vi
                .fn()
                .mockResolvedValue({ count: null, error: new Error('DB error') });
            const mockFrom = vi.fn().mockReturnValue({
                delete: mockDelete,
            });

            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
            }));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await cleanupRateLimitLogs(24);

            expect(result).toBe(0);
            consoleSpy.mockRestore();
        });

        it('should use default 24 hours when not specified', async () => {
            const mockDelete = vi.fn().mockResolvedValue({ count: 10, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                delete: mockDelete,
            });

            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
            }));

            await cleanupRateLimitLogs();

            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe('withRateLimit', () => {
        it('should execute handler when not rate limited', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 5, error: null }),
                                }),
                            }),
                        }),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }));

            const handler = vi
                .fn()
                .mockResolvedValue(
                    new Response(JSON.stringify({ success: true }), { status: 200 })
                );

            const wrappedHandler = withRateLimit(handler, RATE_LIMIT_CONFIGS.api);
            const request = createMockRequest({ fingerprint: 'test-fp' });

            const response = await wrappedHandler(request);

            expect(handler).toHaveBeenCalled();
            expect(response.status).toBe(200);
        });

        it('should return 429 when rate limited', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 100, error: null }),
                                }),
                            }),
                        }),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }));

            const handler = vi.fn();

            const wrappedHandler = withRateLimit(handler, RATE_LIMIT_CONFIGS.api);
            const request = createMockRequest({ fingerprint: 'test-fp' });

            const response = await wrappedHandler(request);

            expect(handler).not.toHaveBeenCalled();
            expect(response.status).toBe(429);
        });
    });

    describe('createRateLimitMiddleware', () => {
        it('should return null when not rate limited', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 5, error: null }),
                                }),
                            }),
                        }),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }));

            const middleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.api);
            const request = createMockRequest({ fingerprint: 'test-fp' });

            const result = await middleware(request);

            expect(result).toBeNull();
        });

        it('should return 429 response when rate limited', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 100, error: null }),
                                }),
                            }),
                        }),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }));

            const middleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.api);
            const request = createMockRequest({ fingerprint: 'test-fp' });

            const result = await middleware(request);

            expect(result).not.toBeNull();
            expect(result?.status).toBe(429);

            const json = await result?.json();
            expect(json?.error).toBe('Too many requests');
            expect(json?.code).toBe('RATE_LIMITED');
        });

        it('should include rate limit headers in 429 response', async () => {
            vi.mock('@/lib/supabase/server', () => ({
                createClient: vi.fn().mockResolvedValue({
                    from: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gte: vi.fn().mockReturnValue({
                                    then: (cb: (val: { count: number; error: null }) => void) =>
                                        cb({ count: 100, error: null }),
                                }),
                            }),
                        }),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }));

            const middleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.api);
            const request = createMockRequest({ fingerprint: 'test-fp' });

            const result = await middleware(request);

            expect(result?.headers.get('X-RateLimit-Limit')).toBe('100');
            expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
            expect(result?.headers.get('Retry-After')).toBeDefined();
        });
    });
});
