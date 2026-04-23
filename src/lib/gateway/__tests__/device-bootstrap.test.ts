import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateLanMqttClient = vi.fn();
const mockCloseLanMqttClient = vi.fn().mockResolvedValue(undefined);
const mockObserveGatewayDiscoveryTopic = vi.fn();

vi.mock('@/lib/lan/mqtt-client', () => ({
    createLanMqttClient: mockCreateLanMqttClient,
    closeLanMqttClient: mockCloseLanMqttClient,
}));

vi.mock('@/lib/lan/discovery-client', () => ({
    observeGatewayDiscoveryTopic: mockObserveGatewayDiscoveryTopic,
}));

describe('device gateway bootstrap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
        mockCreateLanMqttClient.mockReturnValue({ on: vi.fn() });
    });

    it('discovers gateway over LAN and exchanges paired device token for gateway session', async () => {
        mockObserveGatewayDiscoveryTopic.mockImplementation(
            async (_client, _restaurantId, _locationId, onRecord) => {
                onRecord({
                    gatewayId: 'gw-1',
                    restaurantId: 'rest-1',
                    locationId: 'loc-1',
                    brokerUrl: 'ws://10.0.0.15:1884/mqtt',
                    healthPort: 8787,
                    transport: 'mqtt',
                    capabilities: ['orders', 'kds', 'tables', 'printers', 'fiscal'],
                    advertisedAt: '2026-04-22T10:00:00.000Z',
                });
            }
        );

        vi.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    discovery: {
                        gatewayId: 'gw-1',
                        brokerUrl: 'ws://10.0.0.15:1884/mqtt',
                    },
                    health: {
                        operatingMode: 'offline-local',
                    },
                    session: {
                        token: 'gateway-token',
                        claims: {
                            topicPrefix: 'lole/v1/restaurants/rest-1/locations/loc-1',
                            issuedAt: '2026-04-22T10:00:00.000Z',
                            expiresAt: '2026-04-22T11:00:00.000Z',
                        },
                    },
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
        );

        const { bootstrapGatewayForPairedDevice } = await import('../device-bootstrap');
        const result = await bootstrapGatewayForPairedDevice({
            deviceToken: 'device-token-1',
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            preferredBrokerUrl: 'ws://10.0.0.15:1884/mqtt',
        });

        expect(result).toMatchObject({
            gatewayId: 'gw-1',
            sessionToken: 'gateway-token',
            bootstrapUrl: 'http://10.0.0.15:8787/bootstrap',
            operatingMode: 'offline-local',
        });
        expect(fetch).toHaveBeenCalledWith(
            'http://10.0.0.15:8787/bootstrap',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'x-device-token': 'device-token-1',
                }),
            })
        );
    });

    it('returns null when no discovery hint or fallback bootstrap exists', async () => {
        const { bootstrapGatewayForPairedDevice } = await import('../device-bootstrap');
        const result = await bootstrapGatewayForPairedDevice({
            deviceToken: 'device-token-1',
            restaurantId: 'rest-1',
            locationId: 'loc-1',
        });

        expect(result).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });
});
