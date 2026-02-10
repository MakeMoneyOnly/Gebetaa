/**
 * Webhook utilities with retry logic and exponential backoff
 *
 * Addresses: Fire-and-forget webhook pattern - Data Loss Risk (Critical Audit Finding #1)
 * Location: src/app/api/order/route.ts:151-161
 */

import type { Database } from '@/types/database';

type Order = Database['public']['Tables']['orders']['Row'];

export interface WebhookPayload {
    order: Order;
    action: string;
    restaurant_id: string;
    ts: string;
}

export interface WebhookResult {
    success: boolean;
    attempts: number;
    error?: Error;
}

/**
 * Logs a failed webhook for manual processing (dead letter queue pattern)
 */
async function logFailedWebhook(orderData: Order, error: unknown): Promise<void> {
    // In production, this would write to a persistent dead letter queue
    // For now, we log with high visibility
    console.error('[Webhook] CRITICAL: Webhook failed after all retries', {
        orderId: orderData.id,
        restaurantId: orderData.restaurant_id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        // Include order data for manual recovery
        orderData: JSON.stringify(orderData),
    });
}

/**
 * Forwards order data to n8n webhook with retry logic and exponential backoff
 *
 * @param orderData - The order to forward
 * @param webhookUrl - The n8n webhook URL
 * @param retries - Number of retry attempts (default: 3)
 * @param timeoutMs - Request timeout in milliseconds (default: 5000)
 * @returns WebhookResult indicating success/failure
 */
export async function forwardToWebhook(
    orderData: Order,
    webhookUrl: string,
    retries = 3,
    timeoutMs = 5000
): Promise<WebhookResult> {
    const payload: WebhookPayload = {
        order: orderData,
        action: 'new_order',
        restaurant_id: orderData.restaurant_id,
        ts: new Date().toISOString(),
    };

    for (let attempt = 0; attempt < retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            console.log(`[Webhook] Attempt ${attempt + 1}/${retries} for order ${orderData.id}`);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                console.log(`[Webhook] Successfully forwarded order ${orderData.id}`);
                return { success: true, attempts: attempt + 1 };
            }

            // Non-OK response - throw to trigger retry
            throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        } catch (err) {
            clearTimeout(timeoutId);

            const isLastAttempt = attempt === retries - 1;
            const errorMessage = err instanceof Error ? err.message : String(err);

            console.error(`[Webhook] Attempt ${attempt + 1} failed:`, errorMessage);

            if (isLastAttempt) {
                // Log to dead letter queue for manual processing
                await logFailedWebhook(orderData, err);
                return {
                    success: false,
                    attempts: attempt + 1,
                    error: err instanceof Error ? err : new Error(errorMessage),
                };
            }

            // Exponential backoff: 1s, 2s, 4s, etc.
            const delayMs = 1000 * Math.pow(2, attempt);
            console.log(`[Webhook] Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    // Should never reach here, but TypeScript needs it
    return { success: false, attempts: retries };
}

/**
 * Fire-and-forget wrapper for webhook forwarding
 * Use this when you don't need to wait for the result (but still want retries)
 */
export function forwardToWebhookAsync(orderData: Order, webhookUrl: string, retries = 3): void {
    // Run asynchronously without awaiting
    forwardToWebhook(orderData, webhookUrl, retries)
        .then(result => {
            if (!result.success) {
                console.error('[Webhook] Async forward failed after retries:', result.error);
            }
        })
        .catch(err => {
            // This should not happen since forwardToWebhook catches all errors,
            // but we handle it just in case
            console.error('[Webhook] Unexpected error in async forward:', err);
        });
}
