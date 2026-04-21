import { describe, expect, it } from 'vitest';
import {
    buildCreateOfflineOrderCommand,
    buildDeleteOfflineOrderCommand,
    buildUpdateOfflineOrderStatusCommand,
} from '@/lib/domain/orders/commands';

const context = {
    restaurantId: 'rest-1',
    locationId: 'loc-1',
    deviceId: 'dev-1',
    actor: {
        actorId: 'staff-1',
        actorType: 'staff' as const,
    },
};

describe('order domain commands', () => {
    it('builds order.create envelope', () => {
        const command = buildCreateOfflineOrderCommand(
            context,
            {
                order_id: 'order-1',
                order_number: 1001,
                restaurant_id: 'rest-1',
                subtotal_santim: 1000,
                vat_santim: 150,
                total_santim: 1150,
                items: [],
            },
            'idem-1'
        );

        expect(command.type).toBe('order.create');
        expect(command.aggregate).toBe('order');
        expect(command.aggregateId).toBe('order-1');
        expect(command.idempotencyKey).toBe('idem-1');
    });

    it('builds order.update envelope', () => {
        const command = buildUpdateOfflineOrderStatusCommand(
            context,
            {
                order_id: 'order-2',
                status: 'syncing',
            },
            'idem-2'
        );

        expect(command.type).toBe('order.update');
        expect(command.payload.status).toBe('syncing');
    });

    it('builds order.delete envelope', () => {
        const command = buildDeleteOfflineOrderCommand(
            context,
            {
                order_id: 'order-3',
                status: 'cancelled',
            },
            'idem-3'
        );

        expect(command.type).toBe('order.delete');
        expect(command.payload.status).toBe('cancelled');
    });
});
