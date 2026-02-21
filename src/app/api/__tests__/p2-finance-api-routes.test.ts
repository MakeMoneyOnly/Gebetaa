import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { GET as getPayments, POST as postPayments } from '@/app/api/finance/payments/route';
import { GET as getRefunds, POST as postRefunds } from '@/app/api/finance/refunds/route';
import { GET as getExceptions } from '@/app/api/finance/exceptions/route';
import { GET as getPayouts, POST as postPayouts } from '@/app/api/finance/payouts/route';
import { GET as getReconciliation } from '@/app/api/finance/reconciliation/route';
import { GET as getFinanceExport } from '@/app/api/finance/export/route';

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

describe('P2 finance API routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/finance/payments returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getPayments(new Request('http://localhost/api/finance/payments'));
        expect(response.status).toBe(401);
    });

    it('POST /api/finance/payments returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postPayments(
            new Request('http://localhost/api/finance/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -1 }),
            })
        );
        expect(response.status).toBe(400);
    });

    it('GET /api/finance/refunds returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getRefunds(new Request('http://localhost/api/finance/refunds'));
        expect(response.status).toBe(401);
    });

    it('POST /api/finance/refunds returns 400 for invalid idempotency key', async () => {
        setAuthAndContextOk();

        const response = await postRefunds(
            new Request('http://localhost/api/finance/refunds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': 'bad-key',
                },
                body: JSON.stringify({
                    payment_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    amount: 10,
                    reason: 'Customer cancellation',
                }),
            })
        );
        expect(response.status).toBe(400);
    });

    it('GET /api/finance/exceptions returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getExceptions(
            new Request('http://localhost/api/finance/exceptions')
        );
        expect(response.status).toBe(401);
    });

    it('GET /api/finance/payouts returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getPayouts(new Request('http://localhost/api/finance/payouts'));
        expect(response.status).toBe(401);
    });

    it('POST /api/finance/payouts returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postPayouts(
            new Request('http://localhost/api/finance/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'chapa' }),
            })
        );
        expect(response.status).toBe(400);
    });

    it('GET /api/finance/reconciliation returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getReconciliation(
            new Request('http://localhost/api/finance/reconciliation')
        );
        expect(response.status).toBe(401);
    });

    it('GET /api/finance/export returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await getFinanceExport(new Request('http://localhost/api/finance/export'));
        expect(response.status).toBe(401);
    });
});
