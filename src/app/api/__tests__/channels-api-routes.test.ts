import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';

import { GET as getChannelsSummary } from '@/app/api/channels/summary/route';
import { GET as getOnlineOrderingSettings, PATCH as patchOnlineOrderingSettings } from '@/app/api/channels/online-ordering/settings/route';
import { POST as postDeliveryConnect } from '@/app/api/channels/delivery/connect/route';
import { GET as getDeliveryOrders } from '@/app/api/channels/delivery/orders/route';
import { POST as postDeliveryAck } from '@/app/api/channels/delivery/orders/[externalOrderId]/ack/route';

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);

function setAuthUnauthorized() {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: false,
        response: apiError('Unauthorized', 401, 'UNAUTHORIZED'),
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

describe('Channels API routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/channels/summary returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getChannelsSummary();

        expect(response.status).toBe(401);
    });

    it('PATCH /api/channels/online-ordering/settings returns 400 for empty payload', async () => {
        setAuthAndContextOk();

        const response = await patchOnlineOrderingSettings(
            new Request('http://localhost/api/channels/online-ordering/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
        );

        expect(response.status).toBe(400);
    });

    it('GET /api/channels/online-ordering/settings returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getOnlineOrderingSettings();

        expect(response.status).toBe(401);
    });

    it('POST /api/channels/delivery/connect returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postDeliveryConnect(
            new Request('http://localhost/api/channels/delivery/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'bad-provider' }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('GET /api/channels/delivery/orders returns 400 for invalid query', async () => {
        setAuthAndContextOk();

        const response = await getDeliveryOrders(
            new Request('http://localhost/api/channels/delivery/orders?limit=0', { method: 'GET' })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/channels/delivery/orders/:id/ack returns 400 for invalid id', async () => {
        setAuthAndContextOk();

        const response = await postDeliveryAck(
            new Request('http://localhost/api/channels/delivery/orders/not-a-uuid/ack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ externalOrderId: 'not-a-uuid' }) }
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/channels/delivery/orders/:id/ack returns 400 for invalid idempotency key', async () => {
        setAuthAndContextOk();

        const response = await postDeliveryAck(
            new Request('http://localhost/api/channels/delivery/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/ack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': 'invalid-key',
                },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ externalOrderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );

        expect(response.status).toBe(400);
    });
});
