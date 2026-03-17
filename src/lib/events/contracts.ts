import { randomUUID } from 'crypto';

// =========================================================
// Notification Event Types
// =========================================================

export type NotificationEventName =
    | 'notification.queued'
    | 'notification.sent'
    | 'notification.failed'
    | 'notification.retry_scheduled';

export type NotificationEventStatus = 'queued' | 'sent' | 'failed' | 'retry_scheduled';

export interface NotificationQueuedPayload {
    notification_id: string;
    restaurant_id: string;
    guest_phone: string;
    notification_type: string;
    channel: 'sms' | 'push' | 'email';
    priority: number;
    message_en?: string;
    message_am?: string;
    idempotency_key: string;
}

export interface NotificationSentPayload {
    notification_id: string;
    restaurant_id: string;
    guest_phone: string;
    notification_type: string;
    channel: 'sms' | 'push' | 'email';
    sent_at: string;
    provider?: string;
    provider_message_id?: string;
}

export interface NotificationFailedPayload {
    notification_id: string;
    restaurant_id: string;
    guest_phone: string;
    notification_type: string;
    channel: 'sms' | 'push' | 'email';
    error_message: string;
    retry_count: number;
    max_retries: number;
}

export interface NotificationRetryScheduledPayload {
    notification_id: string;
    restaurant_id: string;
    guest_phone: string;
    notification_type: string;
    channel: 'sms' | 'push' | 'email';
    retry_count: number;
    next_retry_at: string;
}

export type NotificationLifecycleEvent = GebetaEvent<
    NotificationEventName,
    | NotificationQueuedPayload
    | NotificationSentPayload
    | NotificationFailedPayload
    | NotificationRetryScheduledPayload
>;

export type GebetaEventName =
    | 'order.created'
    | 'order.status_changed'
    | 'order.completed'
    | 'order.cancelled'
    | 'payment.completed'
    | 'payment.failed'
    | 'menu.updated'
    | 'table.waitlist.notify'
    | 'reservation.reminder'
    | 'notification.queued'
    | 'notification.sent'
    | 'notification.failed'
    | 'notification.retry_scheduled';

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

// =========================================================
// Notification Event Factory Functions
// =========================================================

export function createNotificationQueuedEvent(
    payload: NotificationQueuedPayload
): GebetaEvent<'notification.queued', NotificationQueuedPayload> {
    return createGebetaEvent('notification.queued', payload);
}

export function createNotificationSentEvent(
    payload: NotificationSentPayload
): GebetaEvent<'notification.sent', NotificationSentPayload> {
    return createGebetaEvent('notification.sent', payload);
}

export function createNotificationFailedEvent(
    payload: NotificationFailedPayload
): GebetaEvent<'notification.failed', NotificationFailedPayload> {
    return createGebetaEvent('notification.failed', payload);
}

export function createNotificationRetryScheduledEvent(
    payload: NotificationRetryScheduledPayload
): GebetaEvent<'notification.retry_scheduled', NotificationRetryScheduledPayload> {
    return createGebetaEvent('notification.retry_scheduled', payload);
}
