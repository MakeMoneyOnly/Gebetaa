import { describe, expect, it } from 'vitest';
import {
    buildDevicePresenceTopic,
    buildGatewayModeTopic,
    buildRestaurantTopic,
} from '@/lib/lan/mqtt-topics';

describe('mqtt-topics', () => {
    it('builds restaurant scoped topic', () => {
        expect(
            buildRestaurantTopic({
                restaurantId: 'rest-1',
                locationId: 'loc-1',
                scope: 'orders',
                channel: 'commands',
            })
        ).toBe('lole/v1/restaurants/rest-1/locations/loc-1/orders/commands');
    });

    it('builds device presence topic', () => {
        expect(
            buildDevicePresenceTopic({
                restaurantId: 'rest-1',
                locationId: 'loc-1',
                deviceId: 'dev-9',
            })
        ).toBe('lole/v1/restaurants/rest-1/locations/loc-1/devices/dev-9/presence');
    });

    it('builds gateway mode topic', () => {
        expect(buildGatewayModeTopic('rest-1', 'loc-1')).toBe(
            'lole/v1/restaurants/rest-1/locations/loc-1/system/mode'
        );
    });
});
