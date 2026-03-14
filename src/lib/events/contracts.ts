import { randomUUID } from 'crypto';

export type GebetaEventName =
    | 'order.created'
    | 'order.completed'
    | 'payment.completed'
    | 'payment.failed'
    | 'menu.updated';

export type PaymentEventStatus = 'completed' | 'failed';

export interface PaymentLifecycleEventPayload {
    restaurant_id: string;
    order_id: string | null;
    payment_id: string | null;
    payment_session_id?: string | null;
    provider: 'chapa';
    provider_transaction_id: string;
    idempotency_key: string;
    status: PaymentEventStatus;
    amount: number | null;
    currency: string | null;
    metadata: Record<string, unknown>;
    raw_payload: Record<string, unknown>;
}

export interface GebetaEvent<TName extends GebetaEventName = GebetaEventName, TPayload = unknown> {
    id: string;
    version: 1;
    name: TName;
    occurred_at: string;
    trace_id: string;
    payload: TPayload;
}

export type PaymentLifecycleEvent = GebetaEvent<
    'payment.completed' | 'payment.failed',
    PaymentLifecycleEventPayload
>;

export function createGebetaEvent<TName extends GebetaEventName, TPayload>(
    name: TName,
    payload: TPayload
): GebetaEvent<TName, TPayload> {
    return {
        id: randomUUID(),
        version: 1,
        name,
        occurred_at: new Date().toISOString(),
        trace_id: randomUUID(),
        payload,
    };
}

export function createPaymentLifecycleEvent(
    status: PaymentEventStatus,
    payload: PaymentLifecycleEventPayload
): PaymentLifecycleEvent {
    return createGebetaEvent(
        status === 'completed' ? 'payment.completed' : 'payment.failed',
        payload
    );
}
