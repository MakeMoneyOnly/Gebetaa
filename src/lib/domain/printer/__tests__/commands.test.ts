import { describe, expect, it } from 'vitest';
import { buildEnqueuePrinterJobCommand } from '@/lib/domain/printer/commands';

describe('printer command builders', () => {
    it('builds enqueue command', () => {
        const command = buildEnqueuePrinterJobCommand(
            {
                restaurantId: 'rest-1',
                locationId: 'loc-1',
                deviceId: 'dev-1',
                actor: {
                    actorId: 'dev-1',
                    actorType: 'device',
                },
            },
            {
                job_id: 'job-1',
                order_id: 'order-1',
                station: 'grill',
                payload: {
                    restaurantId: 'rest-1',
                    orderId: 'order-1',
                    orderNumber: '1001',
                    items: [],
                    station: 'grill',
                    firedAt: '2026-04-21T00:00:00.000Z',
                    reason: 'test',
                },
            },
            'idem-1'
        );

        expect(command.type).toBe('printer.enqueue');
        expect(command.aggregateId).toBe('job-1');
    });
});
