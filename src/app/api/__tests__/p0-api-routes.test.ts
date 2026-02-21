import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { generateSignedQRCode } from '@/lib/security/hmac';

import { GET as getCommandCenter } from '@/app/api/merchant/command-center/route';
import { GET as getOrders } from '@/app/api/orders/route';
import { PATCH as patchOrderStatus } from '@/app/api/orders/[orderId]/status/route';
import { POST as postOrderAssign } from '@/app/api/orders/[orderId]/assign/route';
import { POST as postBulkStatus } from '@/app/api/orders/bulk-status/route';
import { GET as getOrderDetail } from '@/app/api/orders/[orderId]/route';
import { GET as getTables, POST as postTables } from '@/app/api/tables/route';
import { PATCH as patchTable, DELETE as deleteTable } from '@/app/api/tables/[tableId]/route';
import { POST as postQrRegenerate } from '@/app/api/tables/[tableId]/qr/regenerate/route';
import { POST as postSessionOpen } from '@/app/api/table-sessions/open/route';
import { POST as postSessionTransfer } from '@/app/api/table-sessions/[sessionId]/transfer/route';
import { POST as postSessionClose } from '@/app/api/table-sessions/[sessionId]/close/route';
import { GET as getStaff } from '@/app/api/staff/route';
import { POST as postStaffInvite } from '@/app/api/staff/invite/route';
import { PATCH as patchStaffRole } from '@/app/api/staff/[staffId]/role/route';
import { PATCH as patchStaffActive } from '@/app/api/staff/[staffId]/active/route';
import { GET as getAnalyticsOverview } from '@/app/api/analytics/overview/route';
import { GET as getSupportArticles } from '@/app/api/support/articles/route';
import {
    GET as getSupportTickets,
    POST as postSupportTickets,
} from '@/app/api/support/tickets/route';
import {
    GET as getSettingsSecurity,
    PATCH as patchSettingsSecurity,
} from '@/app/api/settings/security/route';
import {
    GET as getSettingsNotifications,
    PATCH as patchSettingsNotifications,
} from '@/app/api/settings/notifications/route';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
}));

vi.mock('@/lib/security/hmac', () => ({
    generateSignedQRCode: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);
const generateSignedQRCodeMock = vi.mocked(generateSignedQRCode);

function unauthorizedResponse() {
    return apiError('Unauthorized', 401, 'UNAUTHORIZED');
}

function setAuthUnauthorized() {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: false,
        response: unauthorizedResponse(),
    } as any);
}

function setAuthAndContextOk() {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: true,
        user: { id: 'user-1' },
        supabase: {},
    } as any);
    getAuthorizedRestaurantContextMock.mockResolvedValue({
        ok: true,
        restaurantId: 'resto-1',
        supabase: {},
    } as any);
}

function makeAuthOnlySupabase(user: unknown) {
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
        },
        from: vi.fn(),
    } as any;
}

function makeQueryChain(options: {
    maybeSingle?: { data: unknown; error: unknown };
    single?: { data: unknown; error: unknown };
}) {
    const chain: any = {
        select: vi.fn(() => chain),
        update: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn().mockResolvedValue(options.maybeSingle ?? { data: null, error: null }),
        single: vi.fn().mockResolvedValue(options.single ?? { data: null, error: null }),
    };

    return chain;
}

describe('P0 API routes unit coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/merchant/command-center returns 401 when user is missing', async () => {
        createClientMock.mockResolvedValue(makeAuthOnlySupabase(null));
        const request = new NextRequest('http://localhost/api/merchant/command-center?range=today');

        const response = await getCommandCenter(request);

        expect(response.status).toBe(401);
    });

    it('GET /api/orders returns 401 when user is missing', async () => {
        createClientMock.mockResolvedValue(makeAuthOnlySupabase(null));
        const request = new NextRequest('http://localhost/api/orders?limit=10');

        const response = await getOrders(request);

        expect(response.status).toBe(401);
    });

    it('GET /api/orders/:id returns 401 when user is missing', async () => {
        createClientMock.mockResolvedValue(makeAuthOnlySupabase(null));
        const request = new Request('http://localhost/api/orders/order-1');

        const response = await getOrderDetail(request, {
            params: Promise.resolve({ orderId: 'order-1' }),
        });

        expect(response.status).toBe(401);
    });

    it('PATCH /api/orders/:id/status returns 400 for invalid payload', async () => {
        const request = new NextRequest('http://localhost/api/orders/order-1/status', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'bad-status' }),
        });

        const response = await patchOrderStatus(request, {
            params: Promise.resolve({ orderId: 'order-1' }),
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.code).toBe('INVALID_PAYLOAD');
    });

    it('POST /api/orders/:id/assign returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/orders/order-1/assign', {
            method: 'POST',
            body: JSON.stringify({ staff_id: 'not-a-uuid' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postOrderAssign(request, {
            params: Promise.resolve({ orderId: 'order-1' }),
        });

        expect(response.status).toBe(400);
    });

    it('POST /api/orders/bulk-status returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/orders/bulk-status', {
            method: 'POST',
            body: JSON.stringify({ order_ids: [], status: 'pending' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postBulkStatus(request);

        expect(response.status).toBe(400);
    });

    it('GET /api/tables returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getTables();

        expect(response.status).toBe(401);
    });

    it('POST /api/tables returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/tables', {
            method: 'POST',
            body: JSON.stringify({ table_number: '' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postTables(request);

        expect(response.status).toBe(400);
    });

    it('PATCH /api/tables/:id returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/tables/table-1', {
            method: 'PATCH',
            body: JSON.stringify({ capacity: 0 }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await patchTable(request, {
            params: Promise.resolve({ tableId: 'table-1' }),
        });

        expect(response.status).toBe(400);
    });

    it('DELETE /api/tables/:id returns 401 when not authenticated', async () => {
        setAuthUnauthorized();
        const request = new Request('http://localhost/api/tables/table-1', { method: 'DELETE' });

        const response = await deleteTable(request, {
            params: Promise.resolve({ tableId: 'table-1' }),
        });

        expect(response.status).toBe(401);
    });

    it('POST /api/tables/:id/qr/regenerate returns signed URL payload', async () => {
        generateSignedQRCodeMock.mockReturnValue({
            url: 'https://example.com/guest?slug=demo&table=T1&sig=abc123&exp=9999999999',
            signature: 'abc123',
            expiresAt: '2099-01-01T00:00:00.000Z',
        } as any);

        const fromMock = vi
            .fn()
            .mockReturnValueOnce(
                makeQueryChain({
                    maybeSingle: {
                        data: {
                            id: 'table-1',
                            table_number: 'T1',
                            qr_version: 1,
                            restaurant_id: 'resto-1',
                        },
                        error: null,
                    },
                })
            )
            .mockReturnValueOnce(
                makeQueryChain({
                    maybeSingle: {
                        data: { slug: 'demo' },
                        error: null,
                    },
                })
            )
            .mockReturnValueOnce(
                makeQueryChain({
                    single: {
                        data: {
                            id: 'table-1',
                            table_number: 'T1',
                            qr_code_url: 'https://example.com/guest',
                            qr_version: 2,
                        },
                        error: null,
                    },
                })
            );

        getAuthenticatedUserMock.mockResolvedValue({
            ok: true,
            user: { id: 'user-1' },
            supabase: {},
        } as any);
        getAuthorizedRestaurantContextMock.mockResolvedValue({
            ok: true,
            restaurantId: 'resto-1',
            supabase: { from: fromMock },
        } as any);

        const response = await postQrRegenerate(
            new Request('http://localhost/api/tables/table-1/qr/regenerate', { method: 'POST' }),
            { params: Promise.resolve({ tableId: 'table-1' }) }
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.qr.url).toContain('sig=');
        expect(body.data.qr.url).toContain('exp=');
        expect(body.data.qr.signature).toBe('abc123');
    });

    it('POST /api/table-sessions/open returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/table-sessions/open', {
            method: 'POST',
            body: JSON.stringify({ table_id: 'bad-id' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postSessionOpen(request);

        expect(response.status).toBe(400);
    });

    it('POST /api/table-sessions/:id/transfer returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/table-sessions/s1/transfer', {
            method: 'POST',
            body: JSON.stringify({ to_table_id: 'bad-id' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postSessionTransfer(request, {
            params: Promise.resolve({ sessionId: 's1' }),
        });

        expect(response.status).toBe(400);
    });

    it('POST /api/table-sessions/:id/close returns 400 for invalid json body', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/table-sessions/s1/close', {
            method: 'POST',
            body: '{',
            headers: { 'content-type': 'application/json' },
        });

        const response = await postSessionClose(request, {
            params: Promise.resolve({ sessionId: 's1' }),
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.code).toBe('INVALID_JSON');
    });

    it('GET /api/staff returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getStaff();

        expect(response.status).toBe(401);
    });

    it('POST /api/staff/invite returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/staff/invite', {
            method: 'POST',
            body: JSON.stringify({ email: 'not-an-email', role: 'admin' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postStaffInvite(request);

        expect(response.status).toBe(400);
    });

    it('PATCH /api/staff/:id/role returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/staff/staff-1/role', {
            method: 'PATCH',
            body: JSON.stringify({ role: 'wrong' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await patchStaffRole(request, {
            params: Promise.resolve({ staffId: 'staff-1' }),
        });

        expect(response.status).toBe(400);
    });

    it('PATCH /api/staff/:id/active returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/staff/staff-1/active', {
            method: 'PATCH',
            body: JSON.stringify({ is_active: 'true' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await patchStaffActive(request, {
            params: Promise.resolve({ staffId: 'staff-1' }),
        });

        expect(response.status).toBe(400);
    });

    it('GET /api/analytics/overview returns 401 when not authenticated', async () => {
        setAuthUnauthorized();
        const request = new Request('http://localhost/api/analytics/overview?range=week');

        const response = await getAnalyticsOverview(request);

        expect(response.status).toBe(401);
    });

    it('GET /api/support/articles returns 401 when not authenticated', async () => {
        setAuthUnauthorized();
        const request = new Request('http://localhost/api/support/articles?query=orders');

        const response = await getSupportArticles(request);

        expect(response.status).toBe(401);
    });

    it('GET /api/support/tickets returns 401 when not authenticated', async () => {
        setAuthUnauthorized();
        const request = new Request('http://localhost/api/support/tickets?limit=10');

        const response = await getSupportTickets(request);

        expect(response.status).toBe(401);
    });

    it('POST /api/support/tickets returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/support/tickets', {
            method: 'POST',
            body: JSON.stringify({ subject: 'hi', description: 'no' }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await postSupportTickets(request);

        expect(response.status).toBe(400);
    });

    it('GET /api/settings/security returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getSettingsSecurity();

        expect(response.status).toBe(401);
    });

    it('PATCH /api/settings/security returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/settings/security', {
            method: 'PATCH',
            body: JSON.stringify({ session_timeout_minutes: 3 }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await patchSettingsSecurity(request);

        expect(response.status).toBe(400);
    });

    it('GET /api/settings/notifications returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getSettingsNotifications();

        expect(response.status).toBe(401);
    });

    it('PATCH /api/settings/notifications returns 400 for invalid payload', async () => {
        setAuthAndContextOk();
        const request = new Request('http://localhost/api/settings/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ escalation_minutes: 0 }),
            headers: { 'content-type': 'application/json' },
        });

        const response = await patchSettingsNotifications(request);

        expect(response.status).toBe(400);
    });
});
