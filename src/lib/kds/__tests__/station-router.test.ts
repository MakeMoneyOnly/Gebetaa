import { describe, expect, it } from 'vitest';
import { routeOrderItemToPrimaryStation, routeOrderItemToStations } from '../station-router';

describe('station-router', () => {
    it('uses explicit connected stations when present', () => {
        expect(
            routeOrderItemToStations({
                connectedStations: ['bar', 'expeditor', 'bar'],
            })
        ).toEqual(['bar', 'expeditor']);
    });

    it('maps grill and cold prep keywords into station routes', () => {
        expect(
            routeOrderItemToStations({
                itemName: 'Mixed Grill Platter',
            })
        ).toEqual(['grill']);

        expect(
            routeOrderItemToStations({
                itemName: 'Cold Mezze Sampler',
            })
        ).toEqual(['cold']);
    });

    it('prefers prep station over expeditor for primary routing', () => {
        expect(
            routeOrderItemToPrimaryStation({
                connectedStations: ['expeditor', 'grill'],
            })
        ).toBe('grill');
    });
});
