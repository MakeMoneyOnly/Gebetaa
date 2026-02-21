import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { GET as getProviderHealth } from '@/app/api/payments/providers/health/route';
import { POST as postInitiatePayment } from '@/app/api/payments/initiate/route';
import { POST as postVerifyPayment } from '@/app/api/payments/verify/route';

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
}));

const mockInitiateWithFallback = vi.fn();
const mockVerify = vi.fn();
const mockHealthChecks = vi.fn();
const mockGetFallbackPolicy = vi.fn();

vi.mock('@/lib/payments/adapters', () => ({
    createPaymentAdapterRegistry: vi.fn(() => ({
        initiateWithFallback: mockInitiateWithFallback,
        verify: mockVerify,
        healthChecks: mockHealthChecks,
        getFallbackPolicy: mockGetFallbackPolicy,
    })),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);

function setAuthUnauthorized() {
    getAuthenticatedUserMock.mockResolvedValue({
        ok: false,
        response: apiError('Unauthorized', 401, 'UNAUTHORIZED'),
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

describe('P2 payment adapter API routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST /api/payments/initiate returns 401 when unauthorized', async () => {
        setAuthUnauthorized();

        const response = await postInitiatePayment(
            new Request('http://localhost/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'chapa',
                    amount: 10,
                    currency: 'ETB',
                    email: 'ops@gebeta.app',
                }),
            })
        );
        expect(response.status).toBe(401);
    });

    it('POST /api/payments/initiate returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postInitiatePayment(
            new Request('http://localhost/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -10 }),
            })
        );
        expect(response.status).toBe(400);
    });

    it('POST /api/payments/verify returns 400 for invalid payload', async () => {
        setAuthAndContextOk();

        const response = await postVerifyPayment(
            new Request('http://localhost/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'telebirr' }),
            })
        );
        expect(response.status).toBe(400);
    });

    it('GET /api/payments/providers/health returns provider health and fallback policy', async () => {
        setAuthAndContextOk();
        mockHealthChecks.mockResolvedValue([
            { provider: 'telebirr', status: 'healthy', checkedAt: '2026-02-20T00:00:00.000Z' },
        ]);
        mockGetFallbackPolicy.mockReturnValue({
            enabled: true,
            fallbackOrder: ['telebirr', 'chapa'],
        });

        const response = await getProviderHealth(
            new Request('http://localhost/api/payments/providers/health')
        );
        expect(response.status).toBe(200);

        const payload = await response.json();
        expect(payload?.data?.provider_health).toHaveLength(1);
        expect(payload?.data?.fallback_policy?.enabled).toBe(true);
    });
});
