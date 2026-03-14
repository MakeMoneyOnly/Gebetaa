import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getStaff } from '@/app/api/staff/route';
import { POST as postDeviceProvision } from '@/app/api/devices/provision/route';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
    createServiceRoleClient: vi.fn(),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);
const createServiceRoleClientMock = vi.mocked(createServiceRoleClient);

function setAuthContextOk() {
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

describe('staff and device provisioning routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/staff merges base staff rows with enriched user fields', async () => {
        setAuthContextOk();

        const fromMock = vi.fn((table: string) => {
            if (table === 'restaurant_staff') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            order: vi.fn().mockResolvedValue({
                                data: [
                                    {
                                        id: 'staff-1',
                                        user_id: 'user-a',
                                        role: 'waiter',
                                        is_active: true,
                                        created_at: '2026-03-07T00:00:00.000Z',
                                        name: 'PIN Staff',
                                        pin_code: '1234',
                                        assigned_zones: ['rooftop'],
                                    },
                                ],
                                error: null,
                            }),
                        })),
                    })),
                };
            }

            if (table === 'restaurant_staff_with_users') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            in: vi.fn().mockResolvedValue({
                                data: [
                                    {
                                        id: 'staff-1',
                                        user_id: 'user-a',
                                        email: 'waiter@example.com',
                                        name: 'Kaleab',
                                        full_name: 'Kaleab T',
                                        first_name: 'Kaleab',
                                        last_name: 'T',
                                    },
                                ],
                                error: null,
                            }),
                        })),
                    })),
                };
            }

            throw new Error(`Unexpected table ${table}`);
        });

        createServiceRoleClientMock.mockReturnValue({
            from: fromMock,
        } as any);

        const response = await getStaff();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.staff[0]).toMatchObject({
            id: 'staff-1',
            email: 'waiter@example.com',
            name: 'Kaleab',
            pin_code: '1234',
            assigned_zones: ['rooftop'],
        });
    });

    it('POST /api/devices/provision returns a migration-specific error for terminal constraint mismatch', async () => {
        setAuthContextOk();

        createServiceRoleClientMock.mockReturnValue({
            from: vi.fn(() => ({
                insert: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: {
                                message:
                                    'new row for relation "hardware_devices" violates check constraint "hardware_devices_device_type_check"',
                            },
                        }),
                    })),
                })),
            })),
        } as any);

        const response = await postDeviceProvision(
            new Request('http://localhost/api/devices/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Terminal 1',
                    device_type: 'terminal',
                }),
            })
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.code).toBe('TERMINAL_DEVICE_MIGRATION_REQUIRED');
    });
});
