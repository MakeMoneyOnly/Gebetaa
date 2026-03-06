import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import {
    GET as getInventoryItems,
    POST as postInventoryItems,
} from '@/app/api/inventory/items/route';
import { POST as postInventoryMovement } from '@/app/api/inventory/movements/route';
import { GET as getInventoryVariance } from '@/app/api/inventory/variance/route';
import {
    GET as getPurchaseOrders,
    POST as postPurchaseOrders,
} from '@/app/api/inventory/purchase-orders/route';
import {
    GET as getSupplierInvoices,
    POST as postSupplierInvoices,
} from '@/app/api/inventory/invoices/route';
import { POST as postParseInvoice } from '@/app/api/inventory/invoices/parse/route';
import { POST as postIngestInvoice } from '@/app/api/inventory/invoices/ingest/route';
import { POST as postReceiveInvoice } from '@/app/api/inventory/invoices/[invoiceId]/receive/route';
import { GET as getRecipes, POST as postRecipes } from '@/app/api/inventory/recipes/route';

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

describe('P2 inventory API routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/inventory/items returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getInventoryItems(
            new Request('http://localhost/api/inventory/items')
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/items returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postInventoryItems(
            new Request('http://localhost/api/inventory/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '' }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/inventory/movements returns 400 for invalid idempotency key', async () => {
        setAuthAndContextOk();

        const response = await postInventoryMovement(
            new Request('http://localhost/api/inventory/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': 'bad-key',
                },
                body: JSON.stringify({
                    inventory_item_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    movement_type: 'in',
                    qty: 1,
                    reason: 'test',
                }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('GET /api/inventory/variance returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getInventoryVariance(
            new Request('http://localhost/api/inventory/variance')
        );

        expect(response.status).toBe(401);
    });

    it('GET /api/inventory/purchase-orders returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getPurchaseOrders(
            new Request('http://localhost/api/inventory/purchase-orders')
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/purchase-orders returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postPurchaseOrders(
            new Request('http://localhost/api/inventory/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplier_name: '' }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('GET /api/inventory/invoices returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getSupplierInvoices(
            new Request('http://localhost/api/inventory/invoices')
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/invoices returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postSupplierInvoices(
            new Request('http://localhost/api/inventory/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplier_name: '' }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/inventory/invoices/parse returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await postParseInvoice(
            new Request('http://localhost/api/inventory/invoices/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: 'Invoice' }),
            })
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/invoices/parse returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postParseInvoice(
            new Request('http://localhost/api/inventory/invoices/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: 'too short' }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/inventory/invoices/ingest returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await postIngestInvoice(
            new Request('http://localhost/api/inventory/invoices/ingest', {
                method: 'POST',
            })
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/invoices/ingest returns 400 when file is missing', async () => {
        setAuthAndContextOk();
        const formData = new FormData();
        formData.append('provider', 'auto');

        const response = await postIngestInvoice(
            new Request('http://localhost/api/inventory/invoices/ingest', {
                method: 'POST',
                body: formData,
            })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/inventory/invoices/:id/receive returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await postReceiveInvoice(
            new Request(
                'http://localhost/api/inventory/invoices/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/receive',
                {
                    method: 'POST',
                }
            ),
            { params: Promise.resolve({ invoiceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/invoices/:id/receive returns 400 for invalid idempotency key', async () => {
        setAuthAndContextOk();

        const response = await postReceiveInvoice(
            new Request(
                'http://localhost/api/inventory/invoices/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/receive',
                {
                    method: 'POST',
                    headers: {
                        'x-idempotency-key': 'bad-key',
                    },
                }
            ),
            { params: Promise.resolve({ invoiceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );

        expect(response.status).toBe(400);
    });

    it('GET /api/inventory/recipes returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getRecipes();

        expect(response.status).toBe(401);
    });

    it('POST /api/inventory/recipes returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postRecipes(
            new Request('http://localhost/api/inventory/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'x', ingredients: [] }),
            })
        );

        expect(response.status).toBe(400);
    });
});
