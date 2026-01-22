import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurant_id, table_number, items, total_price, notes } = body;

        if (!restaurant_id || !table_number || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Insert order into Supabase
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                restaurant_id,
                table_number,
                items,
                total_price,
                notes,
                status: 'pending',
            } as never) // Type assertion to bypass strict typing
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderData = order as any;

        // Forward to n8n webhook for Telegram notification
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl && orderData) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...body,
                        orderId: orderData.order_number,
                        timestamp: orderData.created_at,
                    }),
                });
            } catch (webhookError) {
                console.error('n8n webhook error:', webhookError);
                // Don't fail the order if webhook fails
            }
        }

        return NextResponse.json({
            success: true,
            order: orderData ? {
                id: orderData.id,
                order_number: orderData.order_number,
                status: orderData.status,
            } : null,
        });
    } catch (error) {
        console.error('Order API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
