import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManagedDeviceSession } from '@/hooks/useManagedDeviceSession';

vi.mock('@/hooks/useDeviceHeartbeat', () => ({
    useDeviceHeartbeat: vi.fn(),
}));

const getStoredDeviceSessionMock = vi.fn();

vi.mock('@/lib/mobile/device-storage', () => ({
    getStoredDeviceSession: () => getStoredDeviceSessionMock(),
}));

describe('useManagedDeviceSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks managed route when offline outage policy expired', async () => {
        getStoredDeviceSessionMock.mockResolvedValue({
            device_token: 'device-token',
            device_type: 'terminal',
            device_profile: 'cashier',
            metadata: {
                outage_policy: {
                    mode: 'supervised',
                    ttl_minutes: 60,
                    issued_at: '2020-04-22T09:00:00.000Z',
                    requires_recent_pin: true,
                    allowed_roles: ['cashier'],
                },
            },
        });

        const { result } = renderHook(() =>
            useManagedDeviceSession({
                route: '/terminal',
                expectedProfiles: ['cashier'],
                requirePaired: true,
            })
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.hasOutageAccess).toBe(false);
        expect(result.current.outageAccess.reason).toMatch(/expired/i);
    });
});
