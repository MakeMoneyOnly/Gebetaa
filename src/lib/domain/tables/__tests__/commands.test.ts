import { describe, expect, it } from 'vitest';
import {
    buildCloseTableSessionCommand,
    buildOpenTableSessionCommand,
    buildTransferTableSessionCommand,
} from '@/lib/domain/tables/commands';

const context = {
    restaurantId: 'rest-1',
    locationId: 'loc-1',
    deviceId: 'dev-1',
    actor: {
        actorId: 'staff-1',
        actorType: 'staff' as const,
    },
};

describe('table command builders', () => {
    it('builds open command', () => {
        const command = buildOpenTableSessionCommand(
            context,
            {
                session_id: 'session-1',
                table_id: 'table-1',
                guest_count: 3,
            },
            'idem-1'
        );

        expect(command.type).toBe('table.open');
        expect(command.aggregateId).toBe('session-1');
    });

    it('builds transfer command', () => {
        const command = buildTransferTableSessionCommand(
            context,
            {
                session_id: 'session-1',
                table_id: 'table-2',
            },
            'idem-2'
        );

        expect(command.type).toBe('table.transfer');
        expect(command.payload.table_id).toBe('table-2');
    });

    it('builds close command', () => {
        const command = buildCloseTableSessionCommand(
            context,
            {
                session_id: 'session-1',
                table_id: 'table-2',
                status: 'closed',
            },
            'idem-3'
        );

        expect(command.type).toBe('table.close');
        expect(command.payload.status).toBe('closed');
    });
});
