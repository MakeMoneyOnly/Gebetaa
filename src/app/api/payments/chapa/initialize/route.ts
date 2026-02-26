/**
 * POST /api/payments/chapa/initialize
 *
 * Called when a guest completes their order details and clicks "Proceed to Pay".
 * Creates the order with status='payment_pending' and returns either:
 *   - A real Chapa checkout_url (when CHAPA_SECRET_KEY is configured)
 *   - A mock checkout URL (development/demo mode)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
    checkRateLimit,
    validateOrderItems,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from '@/lib/services/orderService';
import {
    initializeChapaTransaction,
    generateChapaTransactionRef,
    isChapaConfigured,
} from '@/lib/services/chapaService';
import { getAppUrl } from '@/lib/config/env';

const RequestSchema = z.object({
    guest_context: z.object({
        slug: z.string().min(1),
        is_online_order: z.literal(true).optional(),
        table: z.string().optional(),
        sig: z.string().optional(),
        exp: z.union([z.string(), z.number()]).optional(),
    }),
    items: z.array(z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        quantity: z.number().int().min(1),
        price: z.number().nonnegative(),
        notes: z.string().optional(),
    })).min(1),
    total_price: z.number().positive(),
    order_type: z.enum(['pickup', 'delivery', 'dine_in']),
    customer_name: z.string().min(1).max(100),
    customer_phone: z.string().min(10).max(15),
    customer_email: z.string().email().optional(),
    delivery_address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    idempotency_key: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = RequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Resolve restaurant by slug (online orders skip QR validation)
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name, slug, is_active')
            .eq('slug', parsed.data.guest_context.slug)
            .maybeSingle();

        if (restaurantError || !restaurant || restaurant.is_active === false) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        // Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const fingerprint = generateGuestFingerprint(ip, request.headers.get('user-agent'));
        const rateLimit = await checkRateLimit(supabase, fingerprint);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many orders. Please wait before trying again.' },
                { status: 429 }
            );
        }

        // Validate order items (price check)
        const validation = await validateOrderItems(
            supabase,
            parsed.data.items,
            parsed.data.total_price
        );
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Determine display table number based on order type
        const tableNumber =
            parsed.data.order_type === 'delivery' ? 'Delivery'
            : parsed.data.order_type === 'pickup' ? 'Pickup'
            : 'Online (Dine-In)';

        const idempotencyKey = parsed.data.idempotency_key ?? generateIdempotencyKey();
        const txRef = generateChapaTransactionRef(restaurant.slug);
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const orderId = crypto.randomUUID();

        // Insert order with status='payment_pending'
        // Kitchen does NOT see it yet — it only becomes visible when payment confirms
        // Use a plain Record to avoid TS errors on columns not in the generated types yet
        const insertPayload: Record<string, unknown> = {
            id: orderId,
            restaurant_id: restaurant.id,
            table_number: tableNumber,
            items: (validation.enrichedItems ?? []) as unknown,
            total_price: parsed.data.total_price,
            status: 'payment_pending',
            order_number: orderNumber,
            idempotency_key: idempotencyKey,
            guest_fingerprint: fingerprint,
            order_type: parsed.data.order_type,
            customer_name: parsed.data.customer_name,
            customer_phone: parsed.data.customer_phone,
            chapa_tx_ref: txRef,
            ...(parsed.data.delivery_address ? { delivery_address: parsed.data.delivery_address } : {}),
            ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(insertPayload as never)
            .select('id, order_number, status')
            .single();

        if (orderError || !order) {
            console.error('[Chapa Init] Order insert failed:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        const appUrl = getAppUrl();
        const returnUrl = `${appUrl}/${restaurant.slug}?payment=success&order_id=${order.id}&tx_ref=${txRef}`;
        const callbackUrl = `${appUrl}/api/payments/chapa/webhook`;

        // ── REAL Chapa mode ───────────────────────────────────────────────────
        if (isChapaConfigured()) {
            const nameParts = (parsed.data.customer_name ?? '').trim().split(' ');
            const firstName = nameParts[0] ?? 'Guest';
            const lastName = nameParts.slice(1).join(' ') || restaurant.name;

            const chapaResponse = await initializeChapaTransaction({
                amount: parsed.data.total_price,
                currency: 'ETB',
                first_name: firstName,
                last_name: lastName,
                phone_number: parsed.data.customer_phone,
                email: parsed.data.customer_email,
                tx_ref: txRef,
                callback_url: callbackUrl,
                return_url: returnUrl,
                customization: {
                    title: `Order at ${restaurant.name}`,
                    description: `${tableNumber} · ${orderNumber}`,
                },
                meta: {
                    order_id: order.id,
                    restaurant_id: restaurant.id,
                    order_type: parsed.data.order_type,
                },
            });

            if (chapaResponse.status !== 'success' || !chapaResponse.data?.checkout_url) {
                // Cleanup the pending order if Chapa init failed
                await supabase.from('orders').delete().eq('id', order.id);
                return NextResponse.json(
                    { error: chapaResponse.message || 'Payment gateway error' },
                    { status: 502 }
                );
            }

            return NextResponse.json({
                mode: 'chapa',
                checkout_url: chapaResponse.data.checkout_url,
                order_id: order.id,
                order_number: order.order_number,
                tx_ref: txRef,
            });
        }

        // ── MOCK mode (no CHAPA_SECRET_KEY) ──────────────────────────────────
        const mockCheckoutUrl = `${appUrl}/checkout/mock?tx_ref=${txRef}&order_id=${order.id}&return_url=${encodeURIComponent(returnUrl)}&amount=${parsed.data.total_price}`;

        return NextResponse.json({
            mode: 'mock',
            checkout_url: mockCheckoutUrl,
            order_id: order.id,
            order_number: order.order_number,
            tx_ref: txRef,
        });
    } catch (err) {
        console.error('[POST /api/payments/chapa/initialize]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
