/**
 * Tests for Sync API Endpoint
 *
 * Tests the /api/sync endpoint for PowerSync offline-first functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

// Mock dependencies
vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getDeviceContext: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
    createServiceRoleClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn(),
                    gte: vi.fn(() => ({
                        order: vi.fn(() => ({
                            limit: vi.fn(() => ({
                                maybeSingle: vi.fn(),
                            })),
                        })),
                    })),
                })),
                limit: vi.fn(() => ({
                    maybeSingle: vi.fn(),
                })),
            })),
            insert: vi.fn(() => ({
                eq: vi.fn(),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(),
            })),
        })),
    })),
}));

vi.mock('@/lib/security/securityEvents', () => ({
    logSecurityEvent: vi.fn(),
}));

vi.mock('@/lib/sync/conflict-resolution', () => ({
    detectConflict: vi.fn(() => false),
    resolveConflict: vi.fn(() => ({
        resolvedData: { id: 'test', version: 2 },
        strategy: 'last_write_wins',
        auditDetails: {},
    })),
    logConflictResolution: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

const mockRestaurantId = '12345678-1234-1234-1234-123456789012';
const mockUserId = '87654321-4321-4321-4321-210987654321';
const mockDeviceId = 'device-123-456-789';

describe('Sync API Endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('POST /api/sync', () => {
        it('should reject unauthenticated requests', async () => {
            const { getAuthenticatedUser, getDeviceContext } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: false,
                response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            });

            vi.mocked(getDeviceContext).mockResolvedValue({
                ok: false,
                response: NextResponse.json({ error: 'Device unauthorized' }, { status: 401 }),
            });

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'POST',
                body: JSON.stringify({ operations: [], clientId: 'test' }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);
        });

        it('should validate request body schema', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            // Mock restaurant context
            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            order: vi.fn(() => ({
                                limit: vi.fn(() => ({
                                    maybeSingle: vi.fn().mockResolvedValue({
                                        data: { restaurant_id: mockRestaurantId },
                                        error: null,
                                    }),
                                })),
                            })),
                        })),
                    })),
                })),
            } as any);

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'POST',
                body: JSON.stringify({ invalid: 'body' }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it('should reject operations for different restaurant (tenant isolation)', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');
            const { logSecurityEvent } = await import('@/lib/security/securityEvents');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            const otherRestaurantId = '99999999-9999-9999-9999-999999999999';

            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: { restaurant_id: mockRestaurantId },
                                error: null,
                            }),
                        })),
                    })),
                    insert: vi.fn(),
                })),
            } as any);

            const requestBody = {
                operations: [
                    {
                        id: '11111111-1111-1111-1111-111111111111',
                        operation: 'create',
                        tableName: 'orders',
                        recordId: '22222222-2222-2222-2222-222222222222',
                        data: { total: 1000 },
                        version: 1,
                        lastModified: new Date().toISOString(),
                        idempotencyKey: 'test-key-1',
                        restaurantId: otherRestaurantId, // Different restaurant!
                    },
                ],
                clientId: 'test-client',
            };

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.data.results[0].success).toBe(false);
            expect(data.data.results[0].error).toContain('Tenant isolation');
            expect(logSecurityEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'tenant_isolation_violation',
                })
            );
        });

        it('should process valid sync operations', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            const mockSelect = vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: { restaurant_id: mockRestaurantId },
                        error: null,
                    }),
                })),
            }));

            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn((table: string) => {
                    if (table === 'restaurant_staff') {
                        return { select: mockSelect };
                    }
                    if (table === 'sync_idempotency_keys') {
                        return {
                            select: vi.fn(() => ({
                                eq: vi.fn(() => ({
                                    maybeSingle: vi
                                        .fn()
                                        .mockResolvedValue({ data: null, error: null }),
                                })),
                            })),
                            insert: mockInsert,
                        };
                    }
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                            })),
                        })),
                        insert: mockInsert,
                    };
                }),
            } as any);

            const requestBody = {
                operations: [
                    {
                        id: '11111111-1111-1111-1111-111111111111',
                        operation: 'create',
                        tableName: 'orders',
                        recordId: '22222222-2222-2222-2222-222222222222',
                        data: { total_santim: 1000, status: 'pending' },
                        version: 1,
                        lastModified: new Date().toISOString(),
                        idempotencyKey: 'test-key-1',
                        restaurantId: mockRestaurantId,
                    },
                ],
                clientId: 'test-client',
            };

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.summary.total).toBe(1);
            expect(data.data.summary.succeeded).toBe(1);
        });
    });

    describe('GET /api/sync', () => {
        it('should return sync status for authenticated user', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn((table: string) => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: { restaurant_id: mockRestaurantId },
                                error: null,
                            }),
                            gte: vi.fn(() => ({
                                order: vi.fn(() => ({
                                    limit: vi.fn().mockResolvedValue({
                                        data: [],
                                        error: null,
                                    }),
                                })),
                            })),
                        })),
                    })),
                })),
            } as any);

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'GET',
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.restaurantId).toBe(mockRestaurantId);
            expect(data.data.changes).toBeDefined();
            expect(data.data.serverTime).toBeDefined();
        });

        it('should validate query parameters', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: { restaurant_id: mockRestaurantId },
                                error: null,
                            }),
                        })),
                    })),
                })),
            } as any);

            const request = new NextRequest('http://localhost/api/sync?limit=invalid', {
                method: 'GET',
            });

            const response = await GET(request);
            expect(response.status).toBe(400);
        });
    });

    describe('Idempotency', () => {
        it('should return cached result for duplicate idempotency key', async () => {
            const { getAuthenticatedUser } = await import('@/lib/api/authz');

            vi.mocked(getAuthenticatedUser).mockResolvedValue({
                ok: true,
                user: {
                    id: mockUserId,
                    email: 'test@example.com',
                    aud: 'authenticated',
                    role: 'authenticated',
                },
                supabase: {} as any,
            });

            const cachedResult = {
                id: '11111111-1111-1111-1111-111111111111',
                success: true,
            };

            const { createServiceRoleClient } = await import('@/lib/supabase/service-role');

            vi.mocked(createServiceRoleClient).mockReturnValue({
                from: vi.fn((table: string) => {
                    if (table === 'restaurant_staff') {
                        return {
                            select: vi.fn(() => ({
                                eq: vi.fn(() => ({
                                    order: vi.fn(() => ({
                                        limit: vi.fn(() => ({
                                            maybeSingle: vi.fn().mockResolvedValue({
                                                data: { restaurant_id: mockRestaurantId },
                                                error: null,
                                            }),
                                        })),
                                    })),
                                })),
                            })),
                        };
                    }
                    if (table === 'sync_idempotency_keys') {
                        return {
                            select: vi.fn(() => ({
                                eq: vi.fn(() => ({
                                    maybeSingle: vi.fn().mockResolvedValue({
                                        data: { result_data: cachedResult },
                                        error: null,
                                    }),
                                })),
                            })),
                            insert: vi.fn(),
                        };
                    }
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                            })),
                        })),
                    };
                }),
            } as any);

            const requestBody = {
                operations: [
                    {
                        id: '11111111-1111-1111-1111-111111111111',
                        operation: 'create',
                        tableName: 'orders',
                        recordId: '22222222-2222-2222-2222-222222222222',
                        data: { total_santim: 1000 },
                        version: 1,
                        lastModified: new Date().toISOString(),
                        idempotencyKey: 'duplicate-key',
                        restaurantId: mockRestaurantId,
                    },
                ],
                clientId: 'test-client',
            };

            const request = new NextRequest('http://localhost/api/sync', {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.results[0].success).toBe(true);
        });
    });
});
