import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';

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

function makeTipPoolSupabase() {
    const tipPoolChain: any = {
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: { id: 'tp-1' }, error: null })),
    };

    return {
        from: vi.fn((table: string) => {
            if (table === 'tip_pools') return tipPoolChain;
            return {};
        }),
    } as any;
}

describe('Tip Pools API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/tip-pools returns 401 when unauthorized', async () => {
        const { GET } = await import('@/app/api/tip-pools/route');
        setAuthUnauthorized();

        const response = await GET();

        expect(response.status).toBe(401);
    });

    it('POST /api/tip-pools returns 401 when unauthorized', async () => {
        const { POST } = await import('@/app/api/tip-pools/route');
        setAuthUnauthorized();

        const response = await POST(
            new Request('http://localhost/api/tip-pools', { method: 'POST' })
        );

        expect(response.status).toBe(401);
    });

    it('POST /api/tip-pools returns 400 for invalid shares total', async () => {
        const { POST } = await import('@/app/api/tip-pools/route');
        setAuthAndContextOk();

        const response = await POST(
            new Request('http://localhost/api/tip-pools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tip_pool: {
                        name: 'Test Tip Pool',
                        pool_type: 'percentage',
                        pool_value: 10,
                    },
                    shares: [
                        { role: 'server', percentage: 6000 }, // 60%
                        { role: 'kitchen', percentage: 6000 }, // 60%
                        // Total: 120% - exceeds 100%
                    ],
                }),
            })
        );

        expect(response.status).toBe(400);
    });

    it('POST /api/tip-pools creates tip pool with shares', async () => {
        const mockSupabase = makeTipPoolSupabase();
        const { POST } = await import('@/app/api/tip-pools/route');
        setAuthAndContextOk(mockSupabase);

        const response = await POST(
            new Request('http://localhost/api/tip-pools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tip_pool: {
                        name: 'Standard Tip Pool',
                        pool_type: 'percentage',
                        pool_value: 15,
                    },
                    shares: [
                        { role: 'server', percentage: 7000 }, // 70%
                        { role: 'kitchen', percentage: 3000 }, // 30%
                    ],
                }),
            })
        );

        expect(response.status).toBe(201);
    });
});

describe('Tip Pool Calculation', () => {
    it('calculates tip distribution correctly', async () => {
        const { calculateTipDistribution } = await import('@/lib/pricing/tip-pool');

        const result = calculateTipDistribution(10000, [
            { role: 'server', percentage: 7000 },
            { role: 'kitchen', percentage: 3000 },
        ]);

        expect(result).toHaveLength(2);

        const serverShare = result.find(r => r.role === 'server');
        const kitchenShare = result.find(r => r.role === 'kitchen');

        expect(serverShare?.amount).toBe(7000);
        expect(kitchenShare?.amount).toBe(3000);
    });

    it('handles empty shares', async () => {
        const { calculateTipDistribution } = await import('@/lib/pricing/tip-pool');

        const result = calculateTipDistribution(10000, []);

        expect(result).toHaveLength(0);
    });
});
