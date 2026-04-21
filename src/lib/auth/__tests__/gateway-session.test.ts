import { describe, expect, it } from 'vitest';
import { issueGatewaySessionToken, verifyGatewaySessionToken } from '@/lib/auth/gateway-session';

describe('gateway session token', () => {
    it('issues and verifies token', () => {
        const session = issueGatewaySessionToken({
            deviceId: 'dev-1',
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            gatewayId: 'gw-1',
        });

        expect(verifyGatewaySessionToken(session.token)?.deviceId).toBe('dev-1');
        expect(session.username).toBe('dev-1');
    });

    it('rejects tampered token', () => {
        const session = issueGatewaySessionToken({
            deviceId: 'dev-1',
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            gatewayId: 'gw-1',
        });

        expect(verifyGatewaySessionToken(`${session.token}broken`)).toBeNull();
    });
});
