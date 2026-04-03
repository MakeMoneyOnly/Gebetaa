import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
    createPaymentSession,
    initiateHostedPaymentSession,
} from '@/lib/payments/payment-sessions';
import { resolveGuestContext } from '@/lib/security/guestContext';
import {
    validateOrderItems,
    checkDuplicateOrder,
    checkRateLimit,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from '@/lib/services/orderService';
import { prepareOrderDiscount } from '@/lib/discounts/service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const POST_CHOICES = ['pay_now', 'pay_later'] as const;

interface PaymentSessionRequestBody {
    guest_context?: { slug?: string; table?: string; sig?: string; exp?: string };
    items?: unknown[];
    total_price?: number;
    order_type?: string;
    payment_choice?: string;
}

async function parseJsonBody(request: NextRequest) {
    try {
        const body = (await request.json()) as PaymentSessionRequestBody;
        return { success: true as const, data: body };
    } catch {
        return { success: false as const, error: 'Invalid JSON' };
    }
}

export async function POST(request: NextRequest) {
    const parsed = await parseJsonBody(request);
    if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;
    const guestContext = data.guest_context;
    const items = data.items;
    const totalPrice = data.total_price;
    const orderType = data.order_type;
    const paymentChoice = data.payment_choice;

    if (!guestContext?.slug || !guestContext?.table || !guestContext?.sig || !guestContext?.exp) {
        return NextResponse.json(
            { success: false, error: 'Invalid guest context' },
            { status: 400 }
        );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    if (!POST_CHOICES.includes(paymentChoice as 'pay_now' | 'pay_later')) {
        return NextResponse.json(
            { success: false, error: 'Invalid payment choice' },
            { status: 400 }
        );
    }

    const db = createServiceRoleClient() as SupabaseClient<Database>;
    const guestCtxResult = await resolveGuestContext(db, guestContext);

    if (!guestCtxResult.valid) {
        const reason = guestCtxResult.reason ?? 'Invalid guest context signature';
        const status = guestCtxResult.status ?? 401;
        return NextResponse.json({ success: false, error: reason }, { status });
    }

    const { restaurantId, tableId, tableNumber } = guestCtxResult.data;

    const orderValidation = await validateOrderItems(
        db,
        items as Array<{ id: string; name: string; quantity: number; price: number }>,
        totalPrice ?? 0,
        0
    );
    if (!orderValidation.isValid) {
        return NextResponse.json(
            { success: false, error: orderValidation.error ?? 'Invalid order items' },
            { status: 400 }
        );
    }

    const enrichedItems = orderValidation.enrichedItems ?? [];
    const idempotencyKey = generateIdempotencyKey();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const fingerprint = generateGuestFingerprint(ip, request.headers.get('user-agent'));

    const duplicateCheck = await checkDuplicateOrder(db, idempotencyKey);
    if (duplicateCheck) {
        return NextResponse.json({ success: false, error: 'Duplicate order' }, { status: 409 });
    }

    const rateLimit = await checkRateLimit(db, fingerprint);
    if (!rateLimit.allowed) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const discountResult = await prepareOrderDiscount({
        supabase: db,
        restaurantId,
        items: enrichedItems.map((item: { id: string; price: number; quantity: number }) => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
        })),
    });
    const finalTotal =
        (totalPrice ?? 0) - ((discountResult.discount as { amount?: number })?.amount ?? 0);

    const surface = 'guest_qr';
    const channel =
        orderType === 'dine_in' ? 'dine_in' : orderType === 'pickup' ? 'pickup' : 'online';
    const intentType = paymentChoice === 'pay_now' ? 'pay_now' : 'pay_later';

    const session = await createPaymentSession(
        db as unknown as Parameters<typeof createPaymentSession>[0],
        {
            restaurant_id: restaurantId,
            surface,
            channel,
            intent_type: intentType,
            amount: finalTotal,
            currency: 'ETB',
            metadata: {
                order_type: orderType,
                table_id: tableId,
                table_number: tableNumber,
                guest_fingerprint: fingerprint,
                discount_applied: (discountResult.discount as { id?: string })?.id ?? null,
            },
        }
    );

    const baseUrl = request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/webhooks/chapa`;
    const returnUrl = `${baseUrl}/${guestContext.slug}?table=${tableNumber}&payment=complete`;

    let mode: 'deferred' | 'hosted_checkout' = 'deferred';
    let provider: string | undefined;
    let checkoutUrl: string | undefined;
    let paymentId: string | undefined;
    let transactionReference: string | undefined;
    let attempts: Array<{ provider: string; ok: boolean }> = [];
    let fallbackApplied = false;

    if (paymentChoice === 'pay_now') {
        mode = 'hosted_checkout';
        try {
            const checkout = await initiateHostedPaymentSession({
                db: db as unknown as Parameters<typeof initiateHostedPaymentSession>[0]['db'],
                paymentSessionId: session.id,
                restaurantId,
                orderId: session.order_id ?? session.id,
                amount: finalTotal,
                currency: 'ETB',
                callbackUrl,
                returnUrl,
            });
            provider = checkout.provider;
            checkoutUrl = checkout.checkoutUrl;
            paymentId = checkout.paymentId;
            transactionReference = checkout.transactionReference;
            attempts = checkout.attempts;
            fallbackApplied = checkout.fallbackApplied;
        } catch {
            provider = 'chapa';
            attempts = [{ provider: 'chapa', ok: false }];
        }
    }

    return NextResponse.json(
        {
            success: true,
            data: {
                session_id: session.id,
                mode,
                payment_choice: paymentChoice,
                provider,
                checkout_url: checkoutUrl,
                payment_id: paymentId,
                transaction_reference: transactionReference,
                attempts,
                fallback_applied: fallbackApplied,
            },
        },
        { status: 201 }
    );
}
