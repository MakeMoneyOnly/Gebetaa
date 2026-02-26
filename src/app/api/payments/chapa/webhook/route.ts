/**
 * POST /api/payments/chapa/webhook
 *
 * Chapa calls this after a payment completes (success OR failure).
 * We verify the request is genuine using the CHAPA_WEBHOOK_SECRET
 * (sent as x-chapa-signature header), then promote or cancel the order.
 *
 * Order state machine:
 *   payment_pending + payment success → pending  (KDS sees it 🍳)
 *   payment_pending + payment failure → cancelled
 *
 * Chapa sends: GET to callback_url with ?trx_ref=...&status=...
 *              and also sends POST webhook with JSON body
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyChapaTransaction, isChapaConfigured } from '@/lib/services/chapaService';

/**
 * Verify the Chapa webhook signature.
 * Chapa sends the raw secret hash value in the x-chapa-signature header.
 * We do a constant-time comparison to prevent timing attacks.
 */
function verifyWebhookSignature(request: NextRequest): boolean {
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

    // If no secret configured, skip verification (dev/mock mode)
    if (!webhookSecret) {
        console.warn('[Chapa Webhook] CHAPA_WEBHOOK_SECRET not set — skipping signature verification');
        return true;
    }

    const signature = request.headers.get('x-chapa-signature');
    if (!signature) {
        console.error('[Chapa Webhook] Missing x-chapa-signature header');
        return false;
    }

    // Chapa sends the raw secret hash value directly (not HMAC)
    // Use constant-time comparison to prevent timing attacks
    const secretBuffer = Buffer.from(webhookSecret, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (secretBuffer.length !== signatureBuffer.length) return false;

    try {
        return require('crypto').timingSafeEqual(secretBuffer, signatureBuffer) as boolean;
    } catch {
        return webhookSecret === signature;
    }
}

async function handleChapaCallback(request: NextRequest) {
    try {
        // Verify signature before doing anything
        const signatureValid = verifyWebhookSignature(request);
        if (!signatureValid) {
            console.error('[Chapa Webhook] Invalid signature — request rejected');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Chapa sends GET to callback_url with query params
        // OR POST webhook with JSON body
        let txRef: string | null = null;
        let status: string | null = null;

        if (request.method === 'GET') {
            txRef = request.nextUrl.searchParams.get('trx_ref')
                ?? request.nextUrl.searchParams.get('tx_ref');
            status = request.nextUrl.searchParams.get('status');
        } else {
            try {
                const body = await request.json() as {
                    trx_ref?: string;
                    tx_ref?: string;
                    status?: string;
                    event?: string;
                };
                txRef = body.trx_ref ?? body.tx_ref ?? null;
                status = body.status ?? null;
            } catch {
                // Fallback to query params on body parse failure
                txRef = request.nextUrl.searchParams.get('trx_ref');
                status = request.nextUrl.searchParams.get('status');
            }
        }

        if (!txRef) {
            return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
        }

        const supabase = await createClient();

        // Find the order by chapa_tx_ref
        const { data: order, error: orderLookupError } = await supabase
            .from('orders')
            .select('id, status, restaurant_id, order_number')
            .eq('chapa_tx_ref' as never, txRef)
            .maybeSingle();

        if (orderLookupError || !order) {
            // Not finding the order is not necessarily a 404 — Chapa may retry.
            // Return 200 to prevent Chapa from spam-retrying.
            console.error('[Chapa Webhook] Order not found for tx_ref:', txRef);
            return NextResponse.json({ message: 'Order not found (ignored)' });
        }

        // Idempotency: already processed
        if (order.status !== 'payment_pending') {
            console.log(`[Chapa Webhook] Order ${order.order_number} already processed (${order.status})`);
            return NextResponse.json({ message: 'Already processed' });
        }

        // Verify with Chapa API (skip in mock mode)
        let paymentSuccess = false;

        if (isChapaConfigured()) {
            const verify = await verifyChapaTransaction(txRef);
            paymentSuccess = verify.data?.status === 'success';
            console.log(`[Chapa Webhook] Verification result for ${txRef}:`, verify.data?.status);
        } else {
            // Mock mode: trust query/body status
            paymentSuccess = status === 'success';
        }

        if (paymentSuccess) {
            // ✅ Payment confirmed — promote order so KDS sees it
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'pending',
                    paid_at: new Date().toISOString(),
                    chapa_verified: true,
                } as Record<string, unknown>)
                .eq('id', order.id);

            if (updateError) {
                console.error('[Chapa Webhook] Failed to update order to pending:', updateError);
                // Return 500 so Chapa retries
                return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
            }

            console.log(`[Chapa Webhook] ✅ Order ${order.order_number} confirmed — now visible to KDS`);

            // Audit log
            await supabase.from('audit_logs').insert({
                restaurant_id: order.restaurant_id,
                action: 'payment_confirmed',
                entity_type: 'order',
                entity_id: order.id,
                metadata: {
                    tx_ref: txRef,
                    payment_provider: 'chapa',
                    mode: isChapaConfigured() ? 'live' : 'mock',
                },
                new_value: { status: 'pending' },
            }).throwOnError();

            return NextResponse.json({ message: 'Order confirmed', order_id: order.id });

        } else {
            // ❌ Payment failed/cancelled — cancel the order
            const { error: cancelError } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

            if (cancelError) {
                console.error('[Chapa Webhook] Failed to cancel order:', cancelError);
                return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
            }

            console.log(`[Chapa Webhook] ❌ Order ${order.order_number} cancelled — payment ${status ?? 'failed'}`);

            await supabase.from('audit_logs').insert({
                restaurant_id: order.restaurant_id,
                action: 'payment_failed',
                entity_type: 'order',
                entity_id: order.id,
                metadata: { tx_ref: txRef, status, payment_provider: 'chapa' },
                new_value: { status: 'cancelled' },
            });

            return NextResponse.json({ message: 'Order cancelled due to payment failure' });
        }

    } catch (err) {
        console.error('[Chapa Webhook] Unhandled error:', err);
        // Return 500 so Chapa retries
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return handleChapaCallback(request);
}

export async function POST(request: NextRequest) {
    return handleChapaCallback(request);
}
