import { Client as QStashClient } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import type { GebetaEvent } from '@/lib/events/contracts';
import { getAppUrl } from '@/lib/config/env';

export interface PublishEventResult {
    eventId: string;
    streamName: string;
    streamEntryId?: string;
    jobMessageId?: string;
}

function getRedisClient(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return null;
    }

    return new Redis({ url, token });
}

function getQStashClient(): QStashClient | null {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
        return null;
    }

    return new QStashClient({ token });
}

function toStreamName(eventName: string): string {
    return `gebeta:events:${eventName.replaceAll('.', ':')}`;
}

export async function publishEvent(event: GebetaEvent): Promise<PublishEventResult> {
    const streamName = toStreamName(event.name);
    const redis = getRedisClient();
    let streamEntryId: string | undefined;

    if (redis) {
        streamEntryId = await redis.xadd(streamName, '*', {
            eventId: event.id,
            eventName: event.name,
            occurredAt: event.occurred_at,
            version: event.version,
            traceId: event.trace_id,
            payload: JSON.stringify(event.payload),
        });
    } else if (process.env.NODE_ENV !== 'test') {
        console.warn(`[events] Upstash Redis not configured, skipping stream publish for ${event.name}`);
    }

    return {
        eventId: event.id,
        streamName,
        streamEntryId,
    };
}

export async function enqueueInternalJob<TBody extends Record<string, unknown>>(params: {
    path: string;
    body: TBody;
    deduplicationKey: string;
}): Promise<string | undefined> {
    const client = getQStashClient();
    const appUrl = getAppUrl();
    const destinationUrl = new URL(params.path, appUrl).toString();

    if (!client) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[jobs] QStash not configured, skipping enqueue for ${params.path}`);
        }
        return undefined;
    }

    const result = await client.publishJSON({
        url: destinationUrl,
        body: params.body,
        retries: 5,
        headers: {
            'x-gebeta-job-key': process.env.QSTASH_TOKEN ?? '',
        },
        contentBasedDeduplication: false,
        deduplicationId: params.deduplicationKey,
    });

    return result.messageId;
}
