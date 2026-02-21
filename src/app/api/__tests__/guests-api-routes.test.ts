import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { GET as getGuests } from '@/app/api/guests/route';
import { GET as getGuestById, PATCH as patchGuestById } from '@/app/api/guests/[guestId]/route';
import { GET as getGuestVisits } from '@/app/api/guests/[guestId]/visits/route';

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

function makeSelectChain<T>(result: { data: T; error: unknown }) {
    const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn().mockResolvedValue(result),
    };

    return chain;
}

describe('Guests API routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/guests returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getGuests(new Request('http://localhost/api/guests'));

        expect(response.status).toBe(401);
    });

    it('GET /api/guests/:id returns 404 when guest does not exist', async () => {
        getAuthenticatedUserMock.mockResolvedValue({
            ok: true,
            user: { id: 'user-1' },
            supabase: {},
        } as any);

        const fromMock = vi.fn().mockReturnValue(makeSelectChain({ data: null, error: null }));
        getAuthorizedRestaurantContextMock.mockResolvedValue({
            ok: true,
            restaurantId: 'resto-1',
            supabase: { from: fromMock },
        } as any);

        const response = await getGuestById(
            new Request('http://localhost/api/guests/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
            {
                params: Promise.resolve({ guestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
            }
        );

        expect(response.status).toBe(404);
    });

    it('GET /api/guests/:id/visits returns 401 when not authenticated', async () => {
        setAuthUnauthorized();

        const response = await getGuestVisits(
            new Request('http://localhost/api/guests/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/visits'),
            { params: Promise.resolve({ guestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );

        expect(response.status).toBe(401);
    });

    it('PATCH /api/guests/:id returns 400 for invalid payload', async () => {
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

        const response = await patchGuestById(
            new Request('http://localhost/api/guests/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({}),
            }),
            { params: Promise.resolve({ guestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );

        expect(response.status).toBe(400);
    });
});
