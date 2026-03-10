import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import { isIdempotencyKeyValid } from '@/lib/api/idempotency';
import {
    checkDuplicateOrder,
    checkRateLimit,
    generateGuestFingerprint,
    generateIdempotencyKey,
    validateOrderItems,
} from '@/lib/services/orderService';
import { resolveGuestContext } from '@/lib/security/guestContext';
import { prepareOrderDiscount } from '@/lib/discounts/service';
import { createGebetaEvent } from '@/lib/events/contracts';
import { publishEvent } from '@/lib/events/runtime';
import { writeAuditLog } from '@/lib/api/audit';
import { getAppUrl } from '@/lib/config/env';
import {
    createPaymentSession,
    getSurfaceForOrderMode,
    initiateHostedPaymentSession,
} from '@/lib/payments/payment-sessions';

const OnlineOrderGuestContextSchema = z.object({
    slug: z.string().min(1),
    is_online_order: z.literal(true),
    table: z.string().optional(),
    sig: z.string().optional(),
    exp: z.union([z.string(), z.number()]).optional(),
});

const DineInGuestContextSchema = z.object({
    slug: z.string().min(1),
    table: z.string().min(1),
    sig: z.string().min(1),
    exp: z.union([z.string(), z.number()]),
    is_online_order: z.literal(false).optional(),
});

const GuestContextInputSchema = z.union([OnlineOrderGuestContextSchema, DineInGuestContextSchema]);

const RequestSchema = z.object({
    guest_context: GuestContextInputSchema,
    items: z
        .array(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(1),
                quantity: z.number().int().min(1),
                price: z.number().nonnegative(),
                notes: z.string().max(500).optional(),
            })
        )
        .min(1),
    total_price: z.number().positive(),
    order_type: z.enum(['dine_in', 'pickup', 'delivery', 'online']).optional().default('dine_in'),
    customer_name: z.string().max(100).optional(),
    customer_phone: z.string().max(30).optional(),
    customer_email: z.string().email().optional(),
    delivery_address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    discount_id: z.string().uuid().optional(),
    payment_choice: z.enum(['pay_now', 'pay_later', 'waiter_close_out']).optional(),
    preferred_method: z.enum(['chapa']).optional(),
    campaign_attribution: z
        .object({
            campaign_delivery_id: z.string().uuid(),
            campaign_id: z.string().uuid().optional(),
        })
        .optional(),
    guest_session_id: z.string().uuid().optional(),
    idempotency_key: z.string().uuid().optional(),
});

function toOrderChannel(orderType: z.infer<typeof RequestSchema>['order_type']) {
    if (orderType === 'delivery') return 'delivery' as const;
    if (orderType === 'pickup') return 'pickup' as const;
    if (orderType === 'online') return 'online' as const;
    return 'dine_in' as const;
}

function buildPaymentChoice(
    isOnlineOrder: boolean,
    rawChoice?: 'pay_now' | 'pay_later' | 'waiter_close_out'
) {
    if (isOnlineOrder) {
        return 'pay_now' as const;
    }

    return rawChoice ?? 'pay_later';
}

export async function POST(request: NextRequest) {
    const parsed = await parseJsonBody(request, RequestSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const body = parsed.data;
    const supabase = await createClient();
    const admin = createServiceRoleClient();
    const adminAny = admin as any;

    const isOnlineOrder =
        body.order_type === 'online' ||
        body.order_type === 'delivery' ||
        body.order_type === 'pickup' ||
        body.guest_context.is_online_order === true;
    const paymentChoice = buildPaymentChoice(isOnlineOrder, body.payment_choice);

    if (isOnlineOrder) {
        if (!body.customer_name?.trim()) {
            return apiError('customer_name is required for online ordering', 400, 'CUSTOMER_NAME_REQUIRED');
        }
        if (!body.customer_phone?.trim()) {
            return apiError('customer_phone is required for online ordering', 400, 'CUSTOMER_PHONE_REQUIRED');
        }
        if (body.order_type === 'delivery' && !body.delivery_address?.trim()) {
            return apiError(
                'delivery_address is required for delivery orders',
                400,
                'DELIVERY_ADDRESS_REQUIRED'
            );
        }
    }

    if (paymentChoice !== 'pay_now' && body.preferred_method) {
        return apiError(
            'preferred_method can only be used with pay_now',
            400,
            'PAYMENT_METHOD_NOT_ALLOWED'
        );
    }

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey =
        explicitIdempotencyKey?.trim() || body.idempotency_key || generateIdempotencyKey();

    const duplicateOrder = await checkDuplicateOrder(supabase, idempotencyKey);
    if (duplicateOrder?.id) {
        const { data: existingSession } = await adminAny
            .from('payment_sessions')
            .select('*')
            .eq('order_id', duplicateOrder.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return apiSuccess({
            order_id: duplicateOrder.id,
            payment_session_id: existingSession?.id ?? null,
            payment_session_status: existingSession?.status ?? null,
            checkout_url: existingSession?.checkout_url ?? null,
            provider: existingSession?.selected_provider ?? null,
            status: duplicateOrder.status,
            duplicate: true,
        });
    }

    let restaurantId: string;
    let restaurantSlug: string;
    let restaurantName: string;
    let tableNumber: string;
    let tableId: string | null = null;

    if (isOnlineOrder) {
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, slug, name, is_active')
            .eq('slug', body.guest_context.slug)
            .maybeSingle();

        if (restaurantError) {
            return apiError(
                'Failed to resolve restaurant',
                500,
                'RESTAURANT_RESOLVE_FAILED',
                restaurantError.message
            );
        }
        if (!restaurant || restaurant.is_active === false) {
            return apiError('Restaurant not found or inactive', 404, 'RESTAURANT_NOT_FOUND');
        }

        restaurantId = restaurant.id;
        restaurantSlug = restaurant.slug;
        restaurantName = restaurant.name;
        tableNumber =
            body.order_type === 'delivery'
                ? 'Delivery'
                : body.order_type === 'pickup'
                  ? 'Pickup'
                  : 'Online Order';
    } else {
        const guestContext = await resolveGuestContext(supabase, body.guest_context);
        if (!guestContext.valid) {
            return apiError(guestContext.reason, guestContext.status, 'INVALID_GUEST_CONTEXT');
        }

        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, slug, name')
            .eq('id', guestContext.data.restaurantId)
            .maybeSingle();

        if (restaurantError || !restaurant) {
            return apiError('Restaurant not found', 404, 'RESTAURANT_NOT_FOUND');
        }

        restaurantId = guestContext.data.restaurantId;
        restaurantSlug = restaurant.slug;
        restaurantName = restaurant.name;
        tableNumber = guestContext.data.tableNumber;
        tableId = guestContext.data.tableId;
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const fingerprint = generateGuestFingerprint(ip, request.headers.get('user-agent'));
    const rateLimit = await checkRateLimit(supabase, fingerprint);
    if (!rateLimit.allowed) {
        return apiError(
            'Rate limit exceeded. Please wait before placing another order.',
            429,
            'RATE_LIMIT_EXCEEDED',
            { remainingOrders: rateLimit.remainingOrders ?? 0 }
        );
    }

    let discountRuntime;
    try {
        discountRuntime = body.discount_id
            ? await prepareOrderDiscount({
                  supabase: admin as any,
                  restaurantId,
                  discountId: body.discount_id,
                  items: body.items.map(item => ({
                      id: item.id,
                      price: item.price,
                      quantity: item.quantity,
                  })),
                  excludeManagerApproval: true,
              })
            : {
                  discount: null,
                  calculation: {
                      subtotal: body.total_price,
                      discountAmount: 0,
                      total: body.total_price,
                      applied: false,
                  },
              };
    } catch (error) {
        return apiError(
            error instanceof Error ? error.message : 'Failed to validate discount',
            400,
            'DISCOUNT_INVALID'
        );
    }

    const validation = await validateOrderItems(
        supabase,
        body.items,
        discountRuntime.calculation.total,
        discountRuntime.calculation.discountAmount
    );
    if (!validation.isValid) {
        return apiError(validation.error ?? 'Failed to validate items', 400, 'ORDER_ITEMS_INVALID');
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderStatus = paymentChoice === 'pay_now' ? 'payment_pending' : 'pending';
    const surface = getSurfaceForOrderMode(isOnlineOrder);
    const orderChannel = toOrderChannel(body.order_type);

    const baseMetadata = {
        source: isOnlineOrder ? 'online_ordering' : 'guest_web',
        payment_choice: paymentChoice,
        table_id: tableId,
        guest_session_id: body.guest_session_id ?? null,
        campaign_attribution: body.campaign_attribution ?? null,
    };

    const { data: order, error: orderError } = await adminAny
        .from('orders')
        .insert({
            id: orderId,
            restaurant_id: restaurantId,
            table_number: tableNumber,
            items: validation.enrichedItems ?? [],
            total_price: discountRuntime.calculation.total,
            notes: body.notes ?? null,
            idempotency_key: idempotencyKey,
            guest_fingerprint: fingerprint,
            status: orderStatus,
            order_number: orderNumber,
            order_type: body.order_type,
            customer_name: body.customer_name?.trim() || null,
            customer_phone: body.customer_phone?.trim() || null,
            delivery_address: body.delivery_address?.trim() || null,
            metadata: {
                ...baseMetadata,
                payment_session_status: paymentChoice === 'pay_now' ? 'pending_provider' : 'created',
            },
            ...(discountRuntime.discount ? { discount_id: discountRuntime.discount.id } : {}),
            ...(discountRuntime.calculation.discountAmount > 0
                ? { discount_amount: discountRuntime.calculation.discountAmount }
                : {}),
        })
        .select('id, order_number, status')
        .single();

    if (orderError || !order) {
        return apiError('Failed to create order', 500, 'ORDER_CREATE_FAILED', orderError?.message);
    }

    const orderItemsPayload = (validation.enrichedItems ?? []).map(item => ({
        order_id: order.id,
        item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes ?? null,
        status: 'pending',
        course: item.course ?? 'main',
    }));

    if (orderItemsPayload.length > 0) {
        const { error: orderItemsError } = await adminAny.from('order_items').insert(orderItemsPayload);
        if (orderItemsError) {
            await adminAny.from('orders').delete().eq('id', order.id);
            return apiError(
                'Failed to save order items',
                500,
                'ORDER_ITEMS_CREATE_FAILED',
                orderItemsError.message
            );
        }
    }

    if (!isOnlineOrder && tableId) {
        const { data: existingSession } = await adminAny
            .from('table_sessions')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('table_id', tableId)
            .eq('status', 'open')
            .maybeSingle();

        if (!existingSession) {
            await adminAny.from('table_sessions').insert({
                restaurant_id: restaurantId,
                table_id: tableId,
                guest_count: 1,
                status: 'open',
                notes:
                    paymentChoice === 'waiter_close_out'
                        ? 'Opened from guest QR (waiter close out)'
                        : 'Opened from guest QR ordering',
            });
        }
    }

    const paymentSession = await createPaymentSession(adminAny, {
        restaurant_id: restaurantId,
        order_id: order.id,
        surface,
        channel: orderChannel,
        intent_type: paymentChoice,
        status: paymentChoice === 'pay_now' ? 'awaiting_method' : 'created',
        selected_method: paymentChoice === 'pay_now' ? 'chapa' : 'cash',
        amount: discountRuntime.calculation.total,
        metadata: {
            ...baseMetadata,
            order_number: order.order_number,
            idempotency_key: idempotencyKey,
        },
    });

    await adminAny
        .from('orders')
        .update({
            metadata: {
                ...baseMetadata,
                payment_session_id: paymentSession.id,
                payment_session_status: paymentSession.status,
            },
        })
        .eq('id', order.id);

    let campaignAttributionApplied = false;
    if (body.campaign_attribution) {
        const attribution = body.campaign_attribution;
        const { data: delivery, error: deliveryError } = await adminAny
            .from('campaign_deliveries')
            .select('id, campaign_id, conversion_order_id')
            .eq('id', attribution.campaign_delivery_id)
            .maybeSingle();

        if (!deliveryError && delivery) {
            const campaignMatches =
                !attribution.campaign_id || attribution.campaign_id === delivery.campaign_id;
            if (campaignMatches && !delivery.conversion_order_id) {
                const { data: campaign } = await adminAny
                    .from('campaigns')
                    .select('id')
                    .eq('id', delivery.campaign_id)
                    .eq('restaurant_id', restaurantId)
                    .maybeSingle();

                if (campaign) {
                    const { error: updateDeliveryError } = await adminAny
                        .from('campaign_deliveries')
                        .update({
                            status: 'converted',
                            conversion_order_id: order.id,
                            clicked_at: new Date().toISOString(),
                        })
                        .eq('id', delivery.id);
                    campaignAttributionApplied = !updateDeliveryError;
                }
            }
        }
    }

    await publishEvent(
        createGebetaEvent('order.created', {
            restaurant_id: restaurantId,
            order_id: order.id,
            idempotency_key: idempotencyKey,
            source: isOnlineOrder ? 'online_ordering' : 'guest_web',
            order_type: body.order_type,
        })
    );

    await writeAuditLog(admin as any, {
        restaurant_id: restaurantId,
        action: paymentChoice === 'pay_now' ? 'order_created_payment_pending' : 'order_created_guest',
        entity_type: 'order',
        entity_id: order.id,
        metadata: {
            table_number: tableNumber,
            item_count: body.items.length,
            source: isOnlineOrder ? 'online_ordering' : 'guest_web',
            order_type: body.order_type,
            slug: restaurantSlug,
            payment_choice: paymentChoice,
            payment_session_id: paymentSession.id,
            campaign_attribution: body.campaign_attribution ?? null,
            campaign_attribution_applied: campaignAttributionApplied,
        },
        new_value: {
            status: order.status,
            total_price: discountRuntime.calculation.total,
            discount_amount: discountRuntime.calculation.discountAmount,
        },
    });

    if (paymentChoice !== 'pay_now') {
        return apiSuccess(
            {
                mode: 'deferred',
                payment_choice: paymentChoice,
                payment_session_id: paymentSession.id,
                payment_session_status: paymentSession.status,
                order_id: order.id,
                order_number: order.order_number,
                status: order.status,
                campaign_attribution_applied: campaignAttributionApplied,
            },
            201
        );
    }

    const appUrl = getAppUrl();
    const requestOrigin = request.nextUrl.origin;
    const returnUrlParams = new URLSearchParams({
        payment: 'success',
        order_id: order.id,
        session_id: paymentSession.id,
    });
    if (!isOnlineOrder) {
        returnUrlParams.set('table', String(body.guest_context.table ?? ''));
        returnUrlParams.set('sig', String(body.guest_context.sig ?? ''));
        returnUrlParams.set('exp', String(body.guest_context.exp));
    }
    const returnUrl = `${requestOrigin}/${restaurantSlug}?${returnUrlParams.toString()}`;
    try {
        const initiated = await initiateHostedPaymentSession({
            db: adminAny,
            paymentSessionId: paymentSession.id,
            restaurantId,
            orderId: order.id,
            amount: discountRuntime.calculation.total,
            currency: 'ETB',
            email: body.customer_email?.trim() || undefined,
            returnUrl,
            callbackUrl: `${appUrl}/api/webhooks/chapa`,
            metadata: {
                restaurant_id: restaurantId,
                order_id: order.id,
                payment_session_id: paymentSession.id,
                order_number: order.order_number,
                idempotency_key: idempotencyKey,
                source: surface,
                customer_name: body.customer_name?.trim() || null,
                customer_phone: body.customer_phone?.trim() || null,
                restaurant_name: restaurantName,
            },
        });

        await adminAny
            .from('orders')
            .update({
                metadata: {
                    ...baseMetadata,
                    payment_session_id: initiated.paymentSession.id,
                    payment_session_status: initiated.paymentSession.status,
                    selected_provider: initiated.provider,
                },
            })
            .eq('id', order.id);

        return apiSuccess(
            {
                mode: 'hosted_checkout',
                payment_choice: paymentChoice,
                payment_session_id: initiated.paymentSession.id,
                payment_session_status: initiated.paymentSession.status,
                order_id: order.id,
                order_number: order.order_number,
                status: order.status,
                checkout_url: initiated.checkoutUrl,
                provider: initiated.provider,
                transaction_reference: initiated.transactionReference,
                attempts: initiated.attempts,
                fallback_applied: initiated.fallbackApplied,
                campaign_attribution_applied: campaignAttributionApplied,
            },
            201
        );
    } catch (error) {
        console.error('[payments/sessions] Failed to initialize hosted checkout', {
            order_id: order.id,
            payment_session_id: paymentSession.id,
            preferred_method: body.preferred_method ?? 'chapa',
            error: error instanceof Error ? error.message : 'Unknown payment initiation error',
        });
        await adminAny.from('payment_sessions').delete().eq('id', paymentSession.id);
        await adminAny.from('order_items').delete().eq('order_id', order.id);
        await adminAny.from('orders').delete().eq('id', order.id);
        return apiError(
            'Failed to initialize digital checkout',
            502,
            'PAYMENT_SESSION_INITIATE_FAILED',
            error instanceof Error ? error.message : 'Unknown payment initiation error'
        );
    }
}
