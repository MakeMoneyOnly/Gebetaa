// Event Bus Publisher
// Publishes events to Redis Streams for async processing
import { Redis } from '@upstash/redis';

// Use Upstash Redis environment variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Only create Redis client if credentials are available
const redis =
    redisUrl && redisToken
        ? new Redis({
              url: redisUrl,
              token: redisToken,
          })
        : null;

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
    // Skip publishing if Redis is not available (e.g., in test environment)
    if (!redis) {
        console.warn('[publisher] Redis not available, skipping event publish');
        return;
    }

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
    // Skip publishing if Redis is not available (e.g., in test environment)
    if (!redis) {
        console.warn('[publisher] Redis not available, skipping event publish');
        return;
    }

    const eventData = {
        type: event,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString(),
    };

    await redis.xadd('events', '*', eventData);
}
