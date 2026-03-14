/**
 * POST /api/jobs/orders/completed
 *
 * Job handler for order.completed events.
 * Processes loyalty points accrual, ERCA invoice submission,
 * and other post-order background tasks.
 *
 * This is triggered asynchronously via QStash when an order
 * status changes to 'completed'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGebetaEvent } from '@/lib/events/contracts';
import { enqueueInternalJob, publishEvent } from '@/lib/events/runtime';
import { accrueLoyaltyPointsForCompletedOrder } from '@/lib/services/guestLoyaltyService';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const OrderCompletedEventSchema = z.object({
    order_id: z.string().uuid(),
    restaurant_id: z.string().uuid(),
    completed_at: z.string().datetime().optional(),
    trigger: z
        .enum(['table_close', 'payment_complete', 'kitchen_complete', 'manual'])
        .default('table_close'),
});

const JobPayloadSchema = z.object({
    id: z.string().uuid(),
    version: z.literal(1),
    name: z.literal('order.completed'),
    occurred_at: z.string().datetime(),
    trace_id: z.string().uuid(),
    payload: OrderCompletedEventSchema,
});

function isAuthorizedJobRequest(request: NextRequest): boolean {
    const configuredKey = process.env.QSTASH_TOKEN;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }
    return request.headers.get('x-gebeta-job-key') === configuredKey;
}

/**
 * Process loyalty points for completed order
 */
async function handleLoyaltyAccrual(orderId: string): Promise<{
    success: boolean;
    pointsAwarded?: number;
    error?: string;
}> {
    try {
        const result = await accrueLoyaltyPointsForCompletedOrder(orderId);
        if (result.applied) {
            return { success: true, pointsAwarded: result.points };
        }
        return { success: true, error: result.reason };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown loyalty error';
        return { success: false, error: message };
    }
}

/**
 * Queue ERCA invoice submission for the completed order
 */
async function queueERCAInvoice(orderId: string, restaurantId: string): Promise<void> {
    try {
        await enqueueInternalJob({
            path: '/api/jobs/erca/submit',
            body: {
                order_id: orderId,
                restaurant_id: restaurantId,
                trigger: 'order_completed',
            },
            deduplicationKey: `erca-${orderId}`,
        });
    } catch (error) {
        console.error(`[jobs] Failed to queue ERCA invoice for order ${orderId}:`, error);
    }
}

/**
 * Check if ERCA is enabled for restaurant and queue if needed
 */
async function checkAndQueueERCA(orderId: string, restaurantId: string): Promise<void> {
    const admin = createServiceRoleClient();

    const { data: restaurant } = await admin
        .from('restaurants')
        .select('erca_enabled, vat_number')
        .eq('id', restaurantId)
        .maybeSingle();

    if (restaurant?.erca_enabled && restaurant?.vat_number) {
        await queueERCAInvoice(orderId, restaurantId);
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorizedJobRequest(request)) {
        return NextResponse.json(
            {
                error: {
                    code: 'UNAUTHORIZED_JOB',
                    message: 'Job request is not authorized',
                },
            },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = JobPayloadSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: {
                    code: 'INVALID_JOB_PAYLOAD',
                    message: 'Invalid order.completed event payload',
                    details: parsed.error.flatten(),
                },
            },
            { status: 400 }
        );
    }

    const { payload } = parsed.data;
    const { order_id, restaurant_id, trigger } = payload;

    const results: {
        loyalty: { success: boolean; pointsAwarded?: number; error?: string };
        erca: { queued: boolean; error?: string };
    } = {
        loyalty: { success: false },
        erca: { queued: false },
    };

    // Process loyalty points (only for authenticated guest orders)
    results.loyalty = await handleLoyaltyAccrual(order_id);

    // Queue ERCA invoice submission (async, don't wait)
    await checkAndQueueERCA(order_id, restaurant_id).catch(err => {
        results.erca = {
            queued: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    });
    results.erca = { queued: true };

    // Publish completion event to stream for other consumers
    const completionEvent = createGebetaEvent('order.completed', {
        order_id,
        restaurant_id,
        completed_at: payload.completed_at ?? new Date().toISOString(),
        trigger,
        processed: {
            loyalty: results.loyalty.success,
            erca: results.erca.queued,
        },
    });

    await publishEvent(completionEvent).catch(err => {
        console.error(`[jobs] Failed to publish order.completed event for ${order_id}:`, err);
    });

    return NextResponse.json({
        data: {
            order_id,
            restaurant_id,
            processed: {
                loyalty: {
                    success: results.loyalty.success,
                    points_awarded: results.loyalty.pointsAwarded,
                    error: results.loyalty.error,
                },
                erca: {
                    queued: results.erca.queued,
                    error: results.erca.error,
                },
            },
        },
    });
}
