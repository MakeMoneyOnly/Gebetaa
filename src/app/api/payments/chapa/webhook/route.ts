/**
 * POST /api/payments/chapa/webhook
 *
 * Chapa calls this after a successful payment.
 * We verify the transaction, then promote the order from
 * 'payment_pending' → 'pending' so the KDS can see it.
 *
 * Chapa sends a GET request to callback_url with:
 *   { trx_ref, ref_id, status }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyChapaTransaction, isChapaConfigured } from '@/lib/services/chapaService';

export async function GET(request: NextRequest) {
    return handleChapaCallback(request);
}

export async function POST(request: NextRequest) {
    return handleChapaCallback(request);
}

async function handleChapaCallback(request: NextRequest) {
    try {
        // Chapa sends GET with query params OR POST with JSON body
        let txRef: string | null = null;
        let status: string | null = null;

        if (request.method === 'GET') {
            txRef = request.nextUrl.searchParams.get('trx_ref')
                ?? request.nextUrl.searchParams.get('tx_ref');
            status = request.nextUrl.searchParams.get('status');
        } else {
            try {
                const body = await request.json() as { trx_ref?: string; tx_ref?: string; status?: string };
                txRef = body.trx_ref ?? body.tx_ref ?? null;
                status = body.status ?? null;
            } catch {
                txRef = request.nextUrl.searchParams.get('trx_ref');
                status = request.nextUrl.searchParams.get('status');
            }
        }

        if (!txRef) {
            return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
        }

        const supabase = await createClient();

        // Find the order by tx_ref
        const { data: order, error: orderLookupError } = await supabase
            .from('orders')
            .select('id, status, restaurant_id, order_number')
            .eq('chapa_tx_ref' as never, txRef)
            .maybeSingle();

        if (orderLookupError || !order) {
            console.error('[Chapa Webhook] Order not found for tx_ref:', txRef);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Skip if already confirmed
        if (order.status !== 'payment_pending') {
            return NextResponse.json({ message: 'Already processed' });
        }

        // Verify with Chapa (skip in mock mode)
        let paymentVerified = false;

        if (isChapaConfigured()) {
            const verify = await verifyChapaTransaction(txRef);
            paymentVerified = verify.data?.status === 'success';
        } else {
            // Mock mode: trust the status from query params
            paymentVerified = status === 'success';
        }

        if (!paymentVerified) {
            // Mark as cancelled if payment explicitly failed
            if (status === 'failed' || status === 'cancelled') {
                await supabase
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', order.id);
            }
            return NextResponse.json({ message: 'Payment not successful' }, { status: 200 });
        }

        // ✅ Payment confirmed — promote order to 'pending' so KDS picks it up
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'pending',
                ...({ paid_at: new Date().toISOString() } as never),
                ...({ chapa_verified: true } as never),
            })
            .eq('id', order.id);

        if (updateError) {
            console.error('[Chapa Webhook] Failed to update order status:', updateError);
            return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
        }

        console.log(`[Chapa Webhook] Order ${order.order_number} confirmed via payment`);

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
        });

        return NextResponse.json({ message: 'Order confirmed', order_id: order.id });
    } catch (err) {
        console.error('[Chapa Webhook] Error:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
