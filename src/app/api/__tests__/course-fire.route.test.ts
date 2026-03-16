import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import {
    getAuthenticatedUser,
    getAuthorizedRestaurantContext,
    getDeviceContext,
} from '@/lib/api/authz';

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
    getDeviceContext: vi.fn(),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);
const getDeviceContextMock = vi.mocked(getDeviceContext);

function setAuthUnauthorized() {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: false,
        response: apiError('Unauthorized', 401, 'UNAUTHORIZED'),
    } as any);
    getDeviceContextMock.mockResolvedValue({
        ok: false,
        response: apiError('Device unauthorized', 401, 'DEVICE_UNAUTHORIZED'),
    } as any);
}

function setAuthAndContextOk(supabase: any = {}) {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: true,
        user: { id: 'user-1' },
        supabase: {},
    } as any);
    getAuthorizedRestaurantContextMock.mockResolvedValue({
        ok: true,
        restaurantId: 'resto-1',
        supabase,
    } as any);
}

function makeOrderCourseFireSupabase() {
    const orderChain: any = {
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                        id: 'order-1',
                        status: 'pending',
                        fire_mode: 'auto',
                        current_course: null,
                    },
                    error: null,
                }),
            })),
        })),
        update: vi.fn(() => ({
            eq: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'order-1',
                            fire_mode: 'manual',
                            current_course: 'appetizer',
                        },
                        error: null,
                    }),
                })),
            })),
        })),
    };

    return {
        from: vi.fn((table: string) => {
            if (table === 'orders') return orderChain;
            return {};
        }),
    } as any;
}

describe('Course Fire API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('PATCH /api/orders/:id/course-fire returns 401 when unauthorized', async () => {
        const { PATCH } = await import('@/app/api/orders/[orderId]/course-fire/route');
        setAuthUnauthorized();

        const response = await PATCH(
            new Request('http://localhost/api/orders/order-1/course-fire', { method: 'PATCH' }),
            { params: Promise.resolve({ orderId: 'order-1' }) }
        );

        expect(response.status).toBe(401);
    });

    it('PATCH /api/orders/:id/course-fire returns 404 for non-existent order', async () => {
        const mockSupabase = {
            from: vi.fn((table: string) => {
                if (table === 'orders') {
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                            })),
                        })),
                    };
                }
                return {};
            }),
        } as any;

        const { PATCH } = await import('@/app/api/orders/[orderId]/course-fire/route');
        setAuthAndContextOk(mockSupabase);

        const response = await PATCH(
            new Request('http://localhost/api/orders/non-existent/course-fire', {
                method: 'PATCH',
            }),
            { params: Promise.resolve({ orderId: 'non-existent' }) }
        );

        expect(response.status).toBe(404);
    });

    it('PATCH /api/orders/:id/course-fire updates fire mode', async () => {
        const mockSupabase = makeOrderCourseFireSupabase();
        const { PATCH } = await import('@/app/api/orders/[orderId]/course-fire/route');
        setAuthAndContextOk(mockSupabase);

        const response = await PATCH(
            new Request('http://localhost/api/orders/order-1/course-fire', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fire_mode: 'manual',
                    current_course: 'appetizer',
                }),
            }),
            { params: Promise.resolve({ orderId: 'order-1' }) }
        );

        expect(response.status).toBe(200);
    });

    it('PATCH /api/orders/:id/course-fire returns 400 for no fields', async () => {
        const mockSupabase = makeOrderCourseFireSupabase();
        const { PATCH } = await import('@/app/api/orders/[orderId]/course-fire/route');
        setAuthAndContextOk(mockSupabase);

        const response = await PATCH(
            new Request('http://localhost/api/orders/order-1/course-fire', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ orderId: 'order-1' }) }
        );

        expect(response.status).toBe(400);
    });
});
