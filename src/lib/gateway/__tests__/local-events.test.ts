import { describe, expect, it } from 'vitest';

describe('gateway local events', () => {
    it('wraps commands with LAN envelope metadata', async () => {
        const { toGatewayLanEvent } = await import('../local-events');

        const event = toGatewayLanEvent(
            {
                id: 'msg-1',
                restaurantId: 'rest-1',
                locationId: 'loc-1',
                aggregate: 'order',
                aggregateId: 'order-1',
                type: 'order.create',
                payload: { order_id: 'order-1' },
            },
            3
        );

        expect(event).toMatchObject({
            schema: 'lole.gateway.lan-event',
            schemaVersion: 1,
            messageId: 'msg-1',
            sequence: 3,
            aggregate: 'order',
            aggregateId: 'order-1',
            type: 'order.create',
        });
    });

    it('deduplicates duplicate and out-of-order LAN messages per aggregate', async () => {
        const { LocalGatewaySequenceTracker } = await import('../local-events');
        const tracker = new LocalGatewaySequenceTracker();

        expect(
            tracker.shouldProcess({
                messageId: 'msg-1',
                aggregate: 'order',
                aggregateId: 'order-1',
                sequence: 2,
            })
        ).toBe(true);
        expect(
            tracker.shouldProcess({
                messageId: 'msg-1',
                aggregate: 'order',
                aggregateId: 'order-1',
                sequence: 2,
            })
        ).toBe(false);
        expect(
            tracker.shouldProcess({
                messageId: 'msg-2',
                aggregate: 'order',
                aggregateId: 'order-1',
                sequence: 1,
            })
        ).toBe(false);
        expect(
            tracker.shouldProcess({
                messageId: 'msg-3',
                aggregate: 'order',
                aggregateId: 'order-1',
                sequence: 3,
            })
        ).toBe(true);
    });
});
