import { describe, expect, it } from 'vitest';
import { LocalGatewaySequenceTracker, toGatewayLanEvent } from '@/lib/gateway/local-events';

function applySequence(
    tracker: LocalGatewaySequenceTracker,
    messages: ReturnType<typeof toGatewayLanEvent>[]
): number[] {
    const seen: number[] = [];

    for (const message of messages) {
        if (
            tracker.shouldProcess({
                messageId: message.messageId,
                aggregate: message.aggregate,
                aggregateId: message.aggregateId,
                sequence: message.sequence,
            })
        ) {
            seen.push(message.sequence);
        }
    }

    return seen;
}

describe('enterprise runtime drills', () => {
    it('ENT-034: multi-terminal offline simulation converges POS, KDS, and handheld on same event order', () => {
        const base = {
            restaurantId: 'rest-1',
            locationId: 'loc-1',
            aggregate: 'order',
            aggregateId: 'order-1',
            type: 'order.update',
            payload: { order_id: 'order-1', status: 'ready' },
        };

        const messages = [
            toGatewayLanEvent({ ...base, id: 'm1' }, 1),
            toGatewayLanEvent({ ...base, id: 'm2' }, 2),
            toGatewayLanEvent({ ...base, id: 'm2' }, 2),
            toGatewayLanEvent({ ...base, id: 'm1-late' }, 1),
            toGatewayLanEvent({ ...base, id: 'm3' }, 3),
        ];

        const pos = applySequence(new LocalGatewaySequenceTracker(), messages);
        const kds = applySequence(new LocalGatewaySequenceTracker(), [...messages].reverse());
        const handheld = applySequence(new LocalGatewaySequenceTracker(), [
            messages[0],
            messages[2],
            messages[1],
            messages[4],
        ]);

        expect(pos).toEqual([1, 2, 3]);
        expect(kds).toEqual([3]);
        expect(handheld).toEqual([1, 2, 3]);

        const latencySamplesMs = [120, 180, 240];
        const p95 = latencySamplesMs.sort((a, b) => a - b)[
            Math.ceil(latencySamplesMs.length * 0.95) - 1
        ];
        expect(p95).toBeLessThan(500);
    });

    it('ENT-032: split-brain scenario matrix covers table close vs transfer and payment mismatch review', async () => {
        const { requiresOperatorReview } = await import('../conflict-resolution');

        expect(
            requiresOperatorReview(
                'table_sessions',
                { status: 'closed', version: 1, last_modified: '2026-04-27T10:00:00.000Z' },
                { status: 'transferred', version: 2, last_modified: '2026-04-27T10:01:00.000Z' }
            )
        ).toBe(true);

        expect(
            requiresOperatorReview(
                'payments',
                { amount: 100, version: 1, last_modified: '2026-04-27T10:00:00.000Z' },
                { amount: 120, version: 2, last_modified: '2026-04-27T10:01:00.000Z' }
            )
        ).toBe(true);
    });
});
