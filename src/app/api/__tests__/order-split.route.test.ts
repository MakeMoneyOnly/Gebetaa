import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import {
    getAuthenticatedUser,
    getAuthorizedRestaurantContext,
    getDeviceContext,
} from '@/lib/api/authz';
import { POST as postOrderSplit } from '@/app/api/orders/[orderId]/split/route';

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
        response: apiError('Missing device token', 401, 'DEVICE_UNAUTHORIZED'),
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

function makeOrderLookupSupabase(totalPrice: number = 100) {
    const ordersChain: any = {
        select: vi.fn(() => ordersChain),
        eq: vi.fn(() => ordersChain),
        maybeSingle: vi.fn().mockResolvedValue({
            data: {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                total_price: totalPrice,
                status: 'pending',
            },
            error: null,
        }),
    };

    return {
        from: vi.fn((table: string) => {
            if (table === 'orders') return ordersChain;
            return {};
        }),
    } as any;
}

describe('Order split route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST /api/orders/:id/split returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await postOrderSplit(
            new Request('http://localhost/api/orders/order-1/split', { method: 'POST' }),
            { params: Promise.resolve({ orderId: 'order-1' }) }
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/orders/:id/split returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postOrderSplit(
            new Request('http://localhost/api/orders/order-1/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: 'invalid',
                    splits: [],
                }),
            }),
            { params: Promise.resolve({ orderId: 'order-1' }) }
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/orders/:id/split returns 400 when custom amount total mismatches order total', async () => {
        setAuthAndContextOk(makeOrderLookupSupabase(120));

        const response = await postOrderSplit(
            new Request('http://localhost/api/orders/order-1/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: 'custom',
                    splits: [
                        { guest_name: 'A', amount: 40 },
                        { guest_name: 'B', amount: 40 },
                    ],
                }),
            }),
            {
                params: Promise.resolve({
                    orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                }),
            }
        );

        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.code).toBe('ORDER_SPLIT_TOTAL_MISMATCH');
    });
});
