// Event Bus Publisher
// Publishes events to Redis Streams for async processing
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
});

export type EventType =
    | 'order.created'
    | 'order.status_changed'
    | 'order.completed'
    | 'order.cancelled'
    | 'payment.completed'
    | 'payment.failed'
    | 'menu.updated'
    | 'loyalty.points_earned'
    | 'table.opened'
    | 'table.closed';

export interface EventPayload {
    [key: string]: unknown;
}

export async function publishEvent(type: EventType, payload: EventPayload): Promise<void> {
    const streamKey = `events:${type.split('.')[0]}`;
    const event = {
        type,
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString(),
    };

    await redis.xadd(streamKey, '*', event);
}

// For backward compatibility - single stream
export async function publish(event: EventType, data: EventPayload): Promise<void> {
    const eventData = {
        type: event,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString(),
    };

    await redis.xadd('events', '*', eventData);
}
