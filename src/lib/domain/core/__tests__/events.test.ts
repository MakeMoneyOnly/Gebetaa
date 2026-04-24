import { describe, expect, it } from 'vitest';
import {
    DOMAIN_EVENT_SCHEMA,
    DOMAIN_EVENT_SCHEMA_VERSION,
    buildAuditLoggedEvent,
    buildFiscalQueuedEvent,
    buildKdsStateChangedEvent,
    buildOrderCourseFiredEvent,
    buildOrderCreatedEvent,
    buildPrinterQueuedEvent,
    toDomainEventJournalInput,
    type DomainEventContext,
    type EnterpriseDomainEventType,
} from '@/lib/domain/core/events';

const context: DomainEventContext = {
    restaurantId: 'rest_123',
    locationId: 'loc_1',
    deviceId: 'device_9',
    actor: {
        actorId: 'staff_42',
        actorType: 'staff',
    },
};

describe('enterprise domain events', () => {
    it('defines versioned event contracts for enterprise local-first flows', () => {
        const eventTypes: EnterpriseDomainEventType[] = [
            'order.created',
            'order.course_fired',
            'kds.state_changed',
            'printer.queued',
            'fiscal.queued',
            'audit.logged',
        ];

        eventTypes.forEach(type => {
            expect(type).toMatch(/^[a-z_]+(\.[a-z_]+)*$/);
        });
    });

    it('creates order event with shared schema metadata', () => {
        const event = buildOrderCreatedEvent(
            context,
            {
                order_id: 'ord_1',
                order_number: 42,
                status: 'pending',
                order_type: 'dine_in',
                total_santim: 5600,
                item_count: 3,
                table_number: 7,
            },
            'idem-order-1'
        );

        expect(event.schema).toBe(DOMAIN_EVENT_SCHEMA);
        expect(event.schemaVersion).toBe(DOMAIN_EVENT_SCHEMA_VERSION);
        expect(event.aggregate).toBe('order');
        expect(event.type).toBe('order.created');
        expect(event.payload.item_count).toBe(3);
    });

    it('converts fiscal and audit events to right journal kinds', () => {
        const fiscalEvent = buildFiscalQueuedEvent(
            context,
            {
                job_id: 'fiscal_1',
                order_id: 'ord_1',
                queue_mode: 'pending_upstream_submission',
                status: 'queued',
                signature_algorithm: null,
                warning_text: null,
            },
            'idem-fiscal-1'
        );
        const auditEvent = buildAuditLoggedEvent(
            context,
            {
                audit_id: 'audit_1',
                action: 'order.override',
                entity_type: 'order',
                entity_id: 'ord_1',
                severity: 'critical',
                metadata: { reason: 'manager_override' },
            },
            'idem-audit-1'
        );

        expect(toDomainEventJournalInput(fiscalEvent).entryKind).toBe('fiscal');
        expect(toDomainEventJournalInput(auditEvent).entryKind).toBe('audit');
    });

    it('creates KDS, print, and course-fire payloads with deterministic aggregate routing', () => {
        const kdsEvent = buildKdsStateChangedEvent(
            context,
            {
                kds_id: 'kds_1',
                order_id: 'ord_1',
                order_item_id: 'item_1',
                station: 'grill',
                action: 'ready',
                status: 'ready',
                previous_status: 'started',
            },
            'idem-kds-1'
        );
        const printEvent = buildPrinterQueuedEvent(
            context,
            {
                job_id: 'print_1',
                order_id: 'ord_1',
                station: 'grill',
                route: 'kitchen',
                status: 'queued',
                failure_reason: null,
            },
            'idem-print-1'
        );
        const courseEvent = buildOrderCourseFiredEvent(
            context,
            {
                order_id: 'ord_1',
                course: 'mains',
                fired_item_ids: ['item_1', 'item_2'],
                fired_by_station: 'expo',
            },
            'idem-course-1'
        );

        expect(kdsEvent.aggregate).toBe('kds_ticket');
        expect(printEvent.aggregate).toBe('printer_job');
        expect(courseEvent.type).toBe('order.course_fired');
        expect(toDomainEventJournalInput(courseEvent).entryKind).toBe('event');
    });
});
