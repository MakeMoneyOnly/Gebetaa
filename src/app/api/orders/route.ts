/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: List orders
 *     description: Retrieve a paginated list of orders for the authenticated user's restaurant
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by table number, order number, or customer name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: Maximum number of orders to return
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No restaurant found for user
 *   post:
 *     summary: Create a new order
 *     description: Create a new order from guest context with HMAC-validated QR code
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guest_context
 *               - items
 *               - total_price
 *             properties:
 *               guest_context:
 *                 type: object
 *                 required:
 *                   - slug
 *                   - table
 *                   - sig
 *                   - exp
 *                 properties:
 *                   slug:
 *                     type: string
 *                   table:
 *                     type: string
 *                   sig:
 *                     type: string
 *                   exp:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               total_price:
 *                 type: number
 *               notes:
 *                 type: string
 *               idempotency_key:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request
 *       429:
 *         description: Rate limit exceeded
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { CreateOrderSchema } from '@/lib/validators/order';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
    checkRateLimit,
    createOrder,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from '@/lib/services/orderService';
import { resolveGuestContext } from '@/lib/security/guestContext';
import { trackApiMetric } from '@/lib/api/metrics';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

const OrdersQuerySchema = z.object({
    status: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().positive().max(200).optional().default(50),
});

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
    campaign_attribution: z
        .object({
            campaign_delivery_id: z.string().uuid(),
            campaign_id: z.string().uuid().optional(),
        })
        .optional(),
});

async function resolveRestaurantIdForUser(userId: string) {
    const supabase = await createClient();
    const { data: staffEntry, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    if (staffError) {
        return { error: staffError.message };
    }

    if (staffEntry?.restaurant_id) {
        return { restaurantId: staffEntry.restaurant_id };
    }

    const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('restaurant_ids')
        .eq('user_id', userId)
        .maybeSingle();

    if (agencyError) {
        return { error: agencyError.message };
    }

    return { restaurantId: agencyUser?.restaurant_ids?.[0] ?? null };
}

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    let responseStatus = 500;
    let restaurantIdForMetrics: string | null = null;
    let supabaseForMetrics: Awaited<ReturnType<typeof createClient>> | null = null;

    try {
        const supabase = await createClient();
        supabaseForMetrics = supabase;
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            responseStatus = 401;
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { restaurantId, error: restaurantError } = await resolveRestaurantIdForUser(user.id);
        if (restaurantError) {
            responseStatus = 500;
            return apiError('Failed to resolve restaurant context', 500, 'RESTAURANT_RESOLVE_FAILED', restaurantError);
        }
        if (!restaurantId) {
            responseStatus = 404;
            return apiError('No restaurant found for user', 404, 'RESTAURANT_NOT_FOUND');
        }
        restaurantIdForMetrics = restaurantId;

        const pilotGateResponse = enforcePilotAccess(restaurantId, request.method);
        if (pilotGateResponse) {
            responseStatus = pilotGateResponse.status;
            return pilotGateResponse;
        }

        const parsed = OrdersQuerySchema.safeParse({
            status: request.nextUrl.searchParams.get('status') ?? undefined,
            search: request.nextUrl.searchParams.get('search') ?? undefined,
            limit: request.nextUrl.searchParams.get('limit') ?? undefined,
        });
        if (!parsed.success) {
            responseStatus = 400;
            return apiError('Invalid query params', 400, 'INVALID_QUERY', parsed.error.flatten());
        }

        let query = supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(parsed.data.limit);

        if (parsed.data.status && parsed.data.status !== 'all') {
            query = query.eq('status', parsed.data.status);
        }

        if (parsed.data.search) {
            const search = parsed.data.search.trim();
            if (search.length > 0) {
                query = query.or(
                    `table_number.ilike.%${search}%,order_number.ilike.%${search}%,customer_name.ilike.%${search}%`
                );
            }
        }

        const { data, error } = await query;

        if (error) {
            responseStatus = 500;
            return apiError('Failed to load orders', 500, 'ORDERS_FETCH_FAILED', error.message);
        }

        responseStatus = 200;
        return apiSuccess({
            orders: data ?? [],
            total: data?.length ?? 0,
        });
    } catch (error) {
        responseStatus = 500;
        return apiError(
            'Internal server error',
            500,
            'INTERNAL_ERROR',
            error instanceof Error ? error.message : 'Unknown error'
        );
    } finally {
        if (supabaseForMetrics) {
            const durationMs = Date.now() - startedAt;
            await trackApiMetric(supabaseForMetrics, {
                restaurantId: restaurantIdForMetrics,
                endpoint: '/api/orders',
                method: 'GET',
                statusCode: responseStatus,
                durationMs,
            });
        }
    }
}

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

        let campaignAttributionApplied = false;
        if (parsed.data.campaign_attribution) {
            const attribution = parsed.data.campaign_attribution;
            const { data: delivery, error: deliveryError } = await (supabase as any)
                .from('campaign_deliveries' as any)
                .select('id, campaign_id, conversion_order_id')
                .eq('id', attribution.campaign_delivery_id)
                .maybeSingle();

            if (deliveryError) {
                console.warn('[POST /api/orders] campaign delivery lookup failed:', deliveryError.message);
            } else if (delivery) {
                const campaignMatches = !attribution.campaign_id || attribution.campaign_id === delivery.campaign_id;
                if (campaignMatches) {
                    const { data: campaign, error: campaignError } = await (supabase as any)
                        .from('campaigns' as any)
                        .select('id')
                        .eq('id', delivery.campaign_id)
                        .eq('restaurant_id', guestContext.data.restaurantId)
                        .maybeSingle();

                    if (campaignError) {
                        console.warn('[POST /api/orders] campaign validation failed:', campaignError.message);
                    } else if (campaign && !delivery.conversion_order_id) {
                        const { error: updateDeliveryError } = await (supabase as any)
                            .from('campaign_deliveries' as any)
                            .update({
                                status: 'converted',
                                conversion_order_id: result.order.id,
                                clicked_at: new Date().toISOString(),
                            })
                            .eq('id', delivery.id);

                        if (updateDeliveryError) {
                            console.warn('[POST /api/orders] campaign conversion update failed:', updateDeliveryError.message);
                        } else {
                            campaignAttributionApplied = true;
                        }
                    }
                }
            }
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
                campaign_attribution: parsed.data.campaign_attribution ?? null,
                campaign_attribution_applied: campaignAttributionApplied,
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
                    campaign_attribution_applied: campaignAttributionApplied,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[POST /api/orders] failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
