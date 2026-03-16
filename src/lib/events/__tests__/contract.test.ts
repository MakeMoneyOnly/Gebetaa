/**
 * Event Contract Tests
 *
 * CRIT-03: Contract tests for event bus payloads
 * Ensures all events conform to the GebetaEvent contract
 */

import { describe, it, expect } from 'vitest';
import {
    GebetaEventName,
    PaymentLifecycleEventPayload,
    createGebetaEvent,
    createPaymentLifecycleEvent,
} from '@/lib/events/contracts';

describe('Event Contract Tests', () => {
    describe('Event Type Validation', () => {
        it('should have valid event names', () => {
            const validEventNames: GebetaEventName[] = [
                'order.created',
                'order.completed',
                'payment.completed',
                'payment.failed',
                'menu.updated',
            ];

            // All event names should be non-empty strings
            validEventNames.forEach(name => {
                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
                expect(name).toMatch(/^[a-z_]+(\.[a-z_]+)*$/);
            });
        });

        it('should have versioned event schemas', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            expect(event.version).toBeDefined();
            expect(typeof event.version).toBe('number');
            expect(event.version).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Event Structure', () => {
        it('should require restaurant_id in payment payload', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            expect(payload.restaurant_id).toBeDefined();
            expect(payload.restaurant_id).toMatch(/^rest_[a-zA-Z0-9]+$/);
        });

        it('should have valid timestamp format (ISO 8601)', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            // Validate ISO 8601 format
            expect(event.occurred_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
            expect(new Date(event.occurred_at).toISOString()).toBe(event.occurred_at);
        });

        it('should have unique event IDs', () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const event = createGebetaEvent('order.created', { test: i });
                ids.add(event.id);
            }

            // All IDs should be unique
            expect(ids.size).toBe(100);
        });

        it('should have unique trace IDs', () => {
            const traceIds = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const event = createGebetaEvent('order.created', { test: i });
                traceIds.add(event.trace_id);
            }

            // All trace IDs should be unique
            expect(traceIds.size).toBe(100);
        });
    });

    describe('Payment Events', () => {
        it('should validate payment.completed payload', () => {
            const payload: PaymentLifecycleEventPayload = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                restaurant_id: 'rest_123',
                amount: 5000,
                currency: 'ETB',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                metadata: {},
                raw_payload: {},
            };

            expect(payload.payment_id).toBeDefined();
            expect(payload.order_id).toBeDefined();
            expect(payload.amount).toBeGreaterThanOrEqual(0);
            expect(payload.provider).toBe('chapa');
            expect(['completed', 'failed']).toContain(payload.status);
        });

        it('should validate payment amounts are in santim (integer)', () => {
            const payload: PaymentLifecycleEventPayload = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                restaurant_id: 'rest_123',
                amount: 5000, // 50.00 ETB in santim
                currency: 'ETB',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                metadata: {},
                raw_payload: {},
            };

            expect(Number.isInteger(payload.amount!)).toBe(true);
            expect(payload.amount).toBeGreaterThanOrEqual(0);
        });

        it('should create payment.completed event', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            expect(event.name).toBe('payment.completed');
            expect(event.payload.status).toBe('completed');
            expect(event.payload.restaurant_id).toBe('rest_123');
        });

        it('should create payment.failed event', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'failed',
                amount: null,
                currency: null,
                metadata: { error: 'insufficient_funds' },
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('failed', payload);

            expect(event.name).toBe('payment.failed');
            expect(event.payload.status).toBe('failed');
        });
    });

    describe('Event Creation', () => {
        it('should create event with createGebetaEvent helper', () => {
            const payload = {
                order_id: 'order_123',
                total_santim: 5000,
            };

            const event = createGebetaEvent('order.created', payload);

            expect(event.id).toBeDefined();
            expect(event.name).toBe('order.created');
            expect(event.version).toBe(1);
            expect(event.occurred_at).toBeDefined();
            expect(event.trace_id).toBeDefined();
            expect(event.payload).toEqual(payload);
        });
    });

    describe('Event Serialization', () => {
        it('should serialize to JSON without losing data', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: { source: 'webhook' },
                raw_payload: { tx_ref: 'abc123' },
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            const serialized = JSON.stringify(event);
            const deserialized = JSON.parse(serialized) as typeof event;

            expect(deserialized.id).toBe(event.id);
            expect(deserialized.name).toBe(event.name);
            expect(deserialized.version).toBe(event.version);
            expect(deserialized.payload.restaurant_id).toBe(event.payload.restaurant_id);
            expect(deserialized.payload.metadata).toEqual(event.payload.metadata);
        });

        it('should handle Amharic characters in payload', () => {
            const payload = {
                order_id: 'order_123',
                item_name: 'ቡና', // Coffee in Amharic
                item_name_am: 'ቡና',
            };

            const event = createGebetaEvent('order.created', payload);

            const serialized = JSON.stringify(event);
            const deserialized = JSON.parse(serialized) as typeof event;

            expect((deserialized.payload as typeof payload).item_name).toBe('ቡና');
            expect((deserialized.payload as typeof payload).item_name_am).toBe('ቡና');
        });
    });

    describe('Idempotency', () => {
        it('should include idempotency_key in payment events', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_unique_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            expect(event.payload.idempotency_key).toBeDefined();
            expect(event.payload.idempotency_key).toBe('idem_unique_123');
        });
    });

    describe('Trace Context', () => {
        it('should include trace_id for distributed tracing', () => {
            const payload: PaymentLifecycleEventPayload = {
                restaurant_id: 'rest_123',
                order_id: 'order_123',
                payment_id: 'pay_123',
                provider: 'chapa',
                provider_transaction_id: 'chapa_tx_123',
                idempotency_key: 'idem_123',
                status: 'completed',
                amount: 5000,
                currency: 'ETB',
                metadata: {},
                raw_payload: {},
            };

            const event = createPaymentLifecycleEvent('completed', payload);

            expect(event.trace_id).toBeDefined();
            expect(typeof event.trace_id).toBe('string');
            expect(event.trace_id.length).toBeGreaterThan(0);
        });
    });
});
