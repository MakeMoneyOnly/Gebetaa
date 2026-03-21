/**
 * Delivery Aggregator Orders API Endpoint
 * TASK-DELIVERY-001: Third-Party Delivery Aggregator
 *
 * Handles incoming orders from delivery platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { receiveExternalOrder, getActivePartners } from '@/lib/delivery/aggregator';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        // Get platform from header
        const platform = request.headers.get('x-delivery-platform');
        const signature = request.headers.get('x-webhook-signature');
        const restaurantId = request.headers.get('x-restaurant-id');

        if (!platform || !restaurantId) {
            return NextResponse.json(
                {
                    error: {
                        code: 'MISSING_HEADERS',
                        message: 'Platform and restaurant ID required',
                    },
                },
                { status: 400 }
            );
        }

        // Get raw body for signature verification
        const rawBody = await request.text();
        const orderData = JSON.parse(rawBody);

        // Create service client for internal operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Get active partners for this restaurant
        const partners = await getActivePartners(supabase, restaurantId);
        const partner = partners.find(p => p.partner_name === platform);

        if (!partner) {
            return NextResponse.json(
                { error: { code: 'NOT_CONFIGURED', message: 'Delivery platform not configured' } },
                { status: 400 }
            );
        }

        // Validate webhook signature if secret is configured
        if (signature && process.env.DELIVERY_WEBHOOK_SECRET) {
            const expectedSignature = createHmac('sha256', process.env.DELIVERY_WEBHOOK_SECRET)
                .update(rawBody)
                .digest('hex');
            if (signature !== expectedSignature) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'INVALID_SIGNATURE',
                            message: 'Webhook signature verification failed',
                        },
                    },
                    { status: 401 }
                );
            }
        }

        // Parse order items from external format
        const items = (orderData.items || []).map((item: any) => ({
            name: item.name || item.item_name,
            quantity: item.quantity || 1,
            price: item.price || item.unit_price || 0,
            notes: item.notes || item.special_instructions,
        }));

        // Receive the external order
        const result = await receiveExternalOrder(supabase, restaurantId, partner.id, {
            external_order_id: orderData.id || orderData.order_id,
            external_order_number: orderData.order_number,
            raw_order_data: orderData,
            customer_name: orderData.customer?.name || orderData.customer_name,
            customer_phone: orderData.customer?.phone || orderData.customer_phone,
            delivery_address: orderData.delivery_address || orderData.address,
            delivery_latitude: orderData.location?.lat || orderData.delivery_latitude,
            delivery_longitude: orderData.location?.lng || orderData.delivery_longitude,
            delivery_notes: orderData.delivery_notes || orderData.notes,
            items,
            subtotal: orderData.subtotal || 0,
            delivery_fee: orderData.delivery_fee || 0,
            platform_fee: orderData.platform_fee || orderData.service_fee || 0,
            total: orderData.total || orderData.total_amount || 0,
            placed_at: orderData.placed_at || orderData.created_at,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: { code: 'ORDER_FAILED', message: result.error } },
                { status: 400 }
            );
        }

        // Log the injection
        await (supabase as any).from('audit_logs').insert({
            action: 'delivery_order_received',
            entity_type: 'aggregator_order',
            entity_id: result.order?.id,
            restaurant_id: restaurantId,
            metadata: {
                platform,
                external_order_id: orderData.id || orderData.order_id,
                partner_id: partner.id,
            },
        });

        return NextResponse.json({
            data: {
                success: true,
                aggregatorOrderId: result.order?.id,
                platform,
            },
        });
    } catch (error) {
        console.error('[Delivery Aggregator API] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const platform = searchParams.get('platform');

        if (!restaurantId) {
            return NextResponse.json(
                { error: { code: 'MISSING_RESTAURANT_ID', message: 'Restaurant ID required' } },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Get aggregator status
        const { data: configs, error } = await (supabase as any)
            .from('delivery_aggregator_configs')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (error) {
            return NextResponse.json(
                { error: { code: 'QUERY_FAILED', message: 'Failed to get aggregator configs' } },
                { status: 400 }
            );
        }

        return NextResponse.json({
            data: {
                configs: configs ?? [],
            },
        });
    } catch (error) {
        console.error('[Delivery Aggregator API] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
            { status: 500 }
        );
    }
}
