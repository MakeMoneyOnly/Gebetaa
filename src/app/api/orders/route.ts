import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { CreateOrderSchema } from '@/lib/validators/order';
import {
    checkRateLimit,
    createOrder,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from '@/lib/services/orderService';
import { resolveGuestContext } from '@/lib/security/guestContext';

const CreateOrderRequestSchema = CreateOrderSchema.omit({
    idempotency_key: true,
    restaurant_id: true,
    table_number: true,
}).extend({
    guest_context: z.object({
        slug: z.string().min(1),
        table: z.string().min(1),
        sig: z.string().min(1),
        exp: z.union([z.string(), z.number()]),
    }),
    idempotency_key: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = CreateOrderRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const guestContext = await resolveGuestContext(supabase, parsed.data.guest_context);
        if (!guestContext.valid) {
            return NextResponse.json({ error: guestContext.reason }, { status: guestContext.status });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const fingerprint = generateGuestFingerprint(ip, request.headers.get('user-agent'));

        const rateLimit = await checkRateLimit(supabase, fingerprint);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please wait before placing another order.',
                    remainingOrders: rateLimit.remainingOrders ?? 0,
                },
                { status: 429 }
            );
        }

        const idempotencyKey = parsed.data.idempotency_key ?? generateIdempotencyKey();
        const result = await createOrder(supabase, {
            restaurant_id: guestContext.data.restaurantId,
            table_number: guestContext.data.tableNumber,
            items: parsed.data.items,
            total_price: parsed.data.total_price,
            notes: parsed.data.notes,
            idempotency_key: idempotencyKey,
            guest_fingerprint: fingerprint,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        const { error: auditError } = await supabase.from('audit_logs').insert({
            restaurant_id: guestContext.data.restaurantId,
            action: 'order_created_guest',
            entity_type: 'order',
            entity_id: result.order.id,
            metadata: {
                table_number: guestContext.data.tableNumber,
                item_count: parsed.data.items.length,
                source: 'guest_web',
                slug: guestContext.data.slug,
            },
            new_value: {
                status: result.order.status,
                total_price: parsed.data.total_price,
            },
        });
        if (auditError) {
            console.warn('[POST /api/orders] audit insert failed:', auditError.message);
        }

        return NextResponse.json(
            {
                data: {
                    id: result.order.id,
                    order_number: result.order.order_number,
                    status: result.order.status,
                    idempotency_key: idempotencyKey,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[POST /api/orders] failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
