import { describe, expect, it } from 'vitest';
import { buildCreateKdsItemCommand, buildUpdateKdsActionCommand } from '@/lib/domain/kds/commands';

const context = {
    restaurantId: 'rest-1',
    locationId: 'loc-1',
    deviceId: 'dev-1',
    actor: {
        actorId: 'dev-1',
        actorType: 'device' as const,
    },
};

describe('kds domain commands', () => {
    it('builds create KDS command', () => {
        const command = buildCreateKdsItemCommand(
            context,
            {
                kds_id: 'kds-1',
                order_id: 'order-1',
                order_item_id: 'item-1',
                station: 'grill',
                priority: 2,
                status: 'queued',
            },
            'idem-1'
        );

        expect(command.aggregate).toBe('kds_ticket');
        expect(command.aggregateId).toBe('kds-1');
        expect(command.payload.station).toBe('grill');
    });

    it('builds ready KDS action command', () => {
        const command = buildUpdateKdsActionCommand(
            context,
            {
                kds_id: 'kds-2',
                action: 'ready',
                status: 'ready',
            },
            'idem-2'
        );

        expect(command.type).toBe('kds.ready');
        expect(command.payload.status).toBe('ready');
    });
});
