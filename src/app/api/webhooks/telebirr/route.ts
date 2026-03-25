/**
 * Telebirr Webhook Handler
 *
 * Handles payment callbacks from Telebirr mobile money service.
 * Verifies signature and updates payment status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTelebirrWebhookSignature } from '@/lib/payments/telebirr';
import { createAuditedServiceRoleClient } from '@/lib/supabase/service-role';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-telebirr-sign') ?? '';

        // Verify webhook signature
        const appKey = process.env.TELEBIRR_APP_KEY;
        if (!appKey) {
            logger.error('[TelebirrWebhook] TELEBIRR_APP_KEY not configured');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }

        const isValid = verifyTelebirrWebhookSignature(rawBody, signature, appKey);
        if (!isValid) {
            logger.warn('[TelebirrWebhook] Invalid signature', {
                signature: signature.substring(0, 10) + '...',
            });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse the payload
        const payload = JSON.parse(rawBody) as {
            outTradeNo: string;
            tradeNo: string;
            tradeStatus: string;
            totalAmount: string;
            currency: string;
            buyerId?: string;
            timestamp?: string;
        };

        logger.info('[TelebirrWebhook] Received payment callback', {
            outTradeNo: payload.outTradeNo,
            tradeStatus: payload.tradeStatus,
        });

        // Map Telebirr status to our status
        let paymentStatus: 'pending' | 'success' | 'failed' | 'cancelled';
        switch (payload.tradeStatus) {
            case 'TRADE_SUCCESS':
            case 'TRADE_FINISHED':
                paymentStatus = 'success';
                break;
            case 'TRADE_CLOSED':
                paymentStatus = 'cancelled';
                break;
            case 'WAIT_BUYER_PAY':
            default:
                paymentStatus = 'pending';
        }

        // Update payment record using audited service role client
        const supabase = createAuditedServiceRoleClient('telebirr_webhook', {
            metadata: {
                tradeNo: payload.tradeNo,
                outTradeNo: payload.outTradeNo,
            },
        });

        // Find payment by transaction reference
        const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('id, order_id, restaurant_id')
            .eq('provider_reference', payload.outTradeNo)
            .maybeSingle();

        if (findError) {
            logger.error('[TelebirrWebhook] Error finding payment', findError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!payment) {
            logger.warn('[TelebirrWebhook] Payment not found', {
                outTradeNo: payload.outTradeNo,
            });
            // Return success to prevent retries for unknown payments
            return NextResponse.json({ received: true });
        }

        // Update payment status
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: paymentStatus,
                provider_transaction_id: payload.tradeNo,
                metadata: {
                    buyerId: payload.buyerId,
                    telebirrTimestamp: payload.timestamp,
                    rawCallback: payload,
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

        if (updateError) {
            logger.error('[TelebirrWebhook] Error updating payment', updateError);
            return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
        }

        // If payment successful, update order status
        if (paymentStatus === 'success' && payment.order_id) {
            const { error: orderUpdateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payment.order_id);

            if (orderUpdateError) {
                logger.error('[TelebirrWebhook] Error updating order', orderUpdateError);
                // Don't fail the webhook - payment was updated successfully
            }
        }

        const duration = Date.now() - startTime;
        logger.info('[TelebirrWebhook] Payment processed', {
            outTradeNo: payload.outTradeNo,
            status: paymentStatus,
            durationMs: duration,
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('[TelebirrWebhook] Error processing webhook', {
            error: error instanceof Error ? error.message : 'Unknown error',
            durationMs: duration,
        });

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Only allow POST requests
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
