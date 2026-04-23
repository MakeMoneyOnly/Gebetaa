import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';
import {
    observeGatewayDiscoveryTopic,
    selectPreferredGatewayDiscoveryRecord,
} from '@/lib/lan/discovery-client';
import type { GatewayDiscoveryRecord } from '@/lib/lan/discovery';

class MockMqttClient extends EventEmitter {
    subscribe = vi.fn(
        (
            _topic: string,
            _options: { qos: number },
            callback: (error: Error | null, granted: Array<{ qos: number }>) => void
        ) => {
            callback(null, [{ qos: 0 }]);
        }
    );
}

function buildRecord(overrides: Partial<GatewayDiscoveryRecord> = {}): GatewayDiscoveryRecord {
    return {
        gatewayId: 'gw-1',
        restaurantId: 'rest-1',
        locationId: 'loc-1',
        brokerUrl: 'ws://127.0.0.1:1884/mqtt',
        healthPort: 8787,
        transport: 'mqtt',
        capabilities: ['orders', 'kds', 'tables', 'printers', 'fiscal'],
        advertisedAt: '2026-04-22T10:00:00.000Z',
        ...overrides,
    };
}

describe('gateway discovery client', () => {
    it('selects newest matching discovery record', () => {
        const result = selectPreferredGatewayDiscoveryRecord([
            buildRecord({ gatewayId: 'gw-old', advertisedAt: '2026-04-22T09:00:00.000Z' }),
            buildRecord({ gatewayId: 'gw-new', advertisedAt: '2026-04-22T11:00:00.000Z' }),
            buildRecord({ gatewayId: 'gw-other', locationId: 'loc-2' }),
        ]);

        expect(result?.gatewayId).toBe('gw-new');
    });

    it('subscribes to discovery topic and emits parsed records only', async () => {
        const client = new MockMqttClient();
        const onRecord = vi.fn();

        await observeGatewayDiscoveryTopic(client as never, 'rest-1', 'loc-1', onRecord);

        client.emit('message', 'ignored/topic', Buffer.from('not-json'));
        client.emit(
            'message',
            'lole/v1/restaurants/rest-1/locations/loc-1/system/status',
            Buffer.from(JSON.stringify(buildRecord({ gatewayId: 'gw-live' })))
        );

        expect(client.subscribe).toHaveBeenCalledOnce();
        expect(onRecord).toHaveBeenCalledOnce();
        expect(onRecord).toHaveBeenCalledWith(
            expect.objectContaining({
                gatewayId: 'gw-live',
            })
        );
    });
});
