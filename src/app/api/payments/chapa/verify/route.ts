/**
 * GET /api/payments/chapa/verify?tx_ref=...&order_id=...
 *
 * Called by the guest frontend after Chapa redirects back.
 * Verifies payment status and returns the order state.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyChapaTransaction, isChapaConfigured } from '@/lib/services/chapaService';

export async function GET(request: NextRequest) {
    try {
        const txRef = request.nextUrl.searchParams.get('tx_ref');
        const orderId = request.nextUrl.searchParams.get('order_id');

        if (!txRef || !orderId) {
            return NextResponse.json({ error: 'Missing tx_ref or order_id' }, { status: 400 });
        }

        const supabase = await createClient();

        // Look up order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, status, order_number, total_price, table_number')
            .eq('id', orderId)
            .maybeSingle();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // If already confirmed by webhook, short-circuit
        if (order.status !== 'payment_pending') {
            return NextResponse.json({
                payment_status: order.status === 'cancelled' ? 'failed' : 'success',
                order_status: order.status,
                order_number: order.order_number,
            });
        }

        // Otherwise verify with Chapa (or mock)
        let paymentSuccess = false;

        if (isChapaConfigured()) {
            const verify = await verifyChapaTransaction(txRef);
            paymentSuccess = verify.data?.status === 'success';
        } else {
            // In mock mode the webhook should have already confirmed it
            // but if polled before webhook fires, check tx_ref format
            paymentSuccess = txRef.startsWith('gebeta-') && txRef.includes('mock');
        }

        if (paymentSuccess && order.status === 'payment_pending') {
            // Confirm the order (webhook may not have fired yet)
            await supabase
                .from('orders')
                .update({
                    status: 'pending',
                    ...({ paid_at: new Date().toISOString() } as never),
                    ...({ chapa_verified: true } as never),
                })
                .eq('id', orderId);

            return NextResponse.json({
                payment_status: 'success',
                order_status: 'pending',
                order_number: order.order_number,
            });
        }

        return NextResponse.json({
            payment_status: paymentSuccess ? 'success' : 'pending',
            order_status: order.status,
            order_number: order.order_number,
        });
    } catch (err) {
        console.error('[GET /api/payments/chapa/verify]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
