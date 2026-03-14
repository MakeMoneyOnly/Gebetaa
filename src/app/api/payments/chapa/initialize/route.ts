/**
 * POST /api/payments/chapa/initialize
 *
 * Called when a guest completes their order details and clicks "Proceed to Pay".
 * Creates the order with status='payment_pending' and returns the real
 * hosted Chapa checkout URL from the official transaction initialize flow.
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
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { prepareOrderDiscount } from '@/lib/discounts/service';
import { isIdempotencyKeyValid } from '@/lib/api/idempotency';

const RequestSchema = z.object({
    guest_context: z.object({
        slug: z.string().min(1),
        is_online_order: z.literal(true).optional(),
        table: z.string().optional(),
        sig: z.string().optional(),
        exp: z.union([z.string(), z.number()]).optional(),
    }),
    items: z
        .array(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1),
                quantity: z.number().int().min(1),
                price: z.number().nonnegative(),
                notes: z.string().optional(),
            })
        )
        .min(1),
    total_price: z.number().positive(),
    order_type: z.enum(['pickup', 'delivery', 'dine_in']),
    customer_name: z.string().min(1).max(100),
    customer_phone: z.string().min(10).max(15),
    customer_email: z.string().email().optional(),
    delivery_address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    discount_id: z.string().uuid().optional(),
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
        const admin = createServiceRoleClient();

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

        let discountRuntime;
        try {
            discountRuntime = parsed.data.discount_id
                ? await prepareOrderDiscount({
                      supabase: createServiceRoleClient() as any,
                      restaurantId: restaurant.id,
                      discountId: parsed.data.discount_id,
                      items: parsed.data.items.map(item => ({
                          id: item.id,
                          price: item.price,
                          quantity: item.quantity,
                      })),
                      excludeManagerApproval: true,
                  })
                : {
                      discount: null,
                      calculation: {
                          subtotal: parsed.data.total_price,
                          discountAmount: 0,
                          total: parsed.data.total_price,
                          applied: false,
                      },
                  };
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Failed to validate discount' },
                { status: 400 }
            );
        }

        // Validate order items (price check)
        const validation = await validateOrderItems(
            supabase,
            parsed.data.items,
            discountRuntime.calculation.total,
            discountRuntime.calculation.discountAmount
        );
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Determine display table number based on order type
        const tableNumber =
            parsed.data.order_type === 'delivery'
                ? 'Delivery'
                : parsed.data.order_type === 'pickup'
                  ? 'Pickup'
                  : 'Online (Dine-In)';

        const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
        if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
            return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 });
        }

        const idempotencyKey =
            explicitIdempotencyKey?.trim() ||
            parsed.data.idempotency_key ||
            generateIdempotencyKey();
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
            total_price: discountRuntime.calculation.total,
            status: 'payment_pending',
            order_number: orderNumber,
            idempotency_key: idempotencyKey,
            guest_fingerprint: fingerprint,
            order_type: parsed.data.order_type,
            customer_name: parsed.data.customer_name,
            customer_phone: parsed.data.customer_phone,
            chapa_tx_ref: txRef,
            ...(parsed.data.delivery_address
                ? { delivery_address: parsed.data.delivery_address }
                : {}),
            ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
            ...(discountRuntime.discount ? { discount_id: discountRuntime.discount.id } : {}),
            ...(discountRuntime.calculation.discountAmount > 0
                ? { discount_amount: discountRuntime.calculation.discountAmount }
                : {}),
        };

        // Use the admin client here because guest-facing RLS only allows
        // direct inserts in a limited set of statuses. The payment flow needs
        // to create a server-controlled pre-payment order in `payment_pending`
        // before the guest is redirected to Chapa.
        const { data: order, error: orderError } = await admin
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
        const callbackUrl = `${appUrl}/api/webhooks/chapa`;

        if (isChapaConfigured()) {
            const nameParts = (parsed.data.customer_name ?? '').trim().split(' ');
            const firstName = nameParts[0] ?? 'Guest';
            const lastName = nameParts.slice(1).join(' ') || restaurant.name;

            const chapaResponse = await initializeChapaTransaction({
                amount: discountRuntime.calculation.total,
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
                    ...(discountRuntime.discount
                        ? { discount_id: discountRuntime.discount.id }
                        : {}),
                    ...(discountRuntime.calculation.discountAmount > 0
                        ? {
                              discount_amount:
                                  discountRuntime.calculation.discountAmount.toString(),
                          }
                        : {}),
                },
            });

            if (chapaResponse.status !== 'success' || !chapaResponse.data?.checkout_url) {
                // Cleanup the pending order if Chapa init failed
                await admin.from('orders').delete().eq('id', order.id);
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

        await admin.from('orders').delete().eq('id', order.id);
        return NextResponse.json(
            {
                error: 'Chapa checkout is not configured. Set CHAPA_SECRET_KEY to enable live payments.',
                code: 'CHAPA_NOT_CONFIGURED',
            },
            { status: 503 }
        );
    } catch (err) {
        console.error('[POST /api/payments/chapa/initialize]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
