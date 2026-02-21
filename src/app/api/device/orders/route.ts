/**
 * GET /api/device/orders  — active orders for the POS (kitchen/waiter view)
 * POST /api/device/orders — place a new order from the POS
 * Requires X-Device-Token header.
 */
import { apiError, apiSuccess } from '@/lib/api/response';
import { getDeviceContext } from '@/lib/api/authz';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/api/validation';

const ACTIVE_STATUSES = ['pending', 'acknowledged', 'preparing', 'ready', 'served'];

export async function GET(request: Request) {
    const ctx = await getDeviceContext(request);
    if (!ctx.ok) return ctx.response;

    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('table_number');

    const admin = createServiceRoleClient();
    let query = admin
        .from('orders')
        .select('*')
        .eq('restaurant_id', ctx.restaurantId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });

    if (tableNumber) {
        query = query.eq('table_number', tableNumber);
    }

    const { data, error } = await query;
    if (error) {
        return apiError('Failed to fetch orders', 500, 'ORDERS_FETCH_FAILED', error.message);
    }

    return apiSuccess({ orders: data ?? [] });
}

const PlaceOrderSchema = z.object({
    table_number: z.string().min(1),
    items: z
        .array(
            z.object({
                menu_item_id: z.string().uuid(),
                name: z.string(),
                quantity: z.number().int().positive(),
                unit_price: z.number().nonnegative(),
                notes: z.string().optional().nullable(),
            })
        )
        .min(1),
    notes: z.string().optional().nullable(),
    staff_name: z.string().optional().nullable(),
});

export async function POST(request: Request) {
    const ctx = await getDeviceContext(request);
    if (!ctx.ok) return ctx.response;

    const parsed = await parseJsonBody(request, PlaceOrderSchema);
    if (!parsed.success) return parsed.response;

    const { table_number, items, notes, staff_name } = parsed.data;
    const admin = createServiceRoleClient();

    const totalAmount = items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
    );

    const ticketNumber = `#-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;

    const { data: order, error: orderError } = await admin
        .from('orders')
        .insert({
            restaurant_id: ctx.restaurantId,
            table_number,
            status: 'pending',
            total_amount: totalAmount,
            ticket_number: ticketNumber,
            notes: notes ?? null,
            staff_name: staff_name ?? null,
            source: 'pos',
        })
        .select()
        .single();

    if (orderError || !order) {
        return apiError('Failed to create order', 500, 'ORDER_CREATE_FAILED', orderError?.message);
    }

    const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes ?? null,
        status: 'pending',
    }));

    const { error: itemsError } = await admin.from('order_items').insert(orderItems);
    if (itemsError) {
        return apiError('Failed to save order items', 500, 'ORDER_ITEMS_FAILED', itemsError.message);
    }

    // Mark the table as occupied
    await admin
        .from('tables')
        .update({ status: 'occupied', active_order_id: order.id })
        .eq('restaurant_id', ctx.restaurantId)
        .eq('table_number', table_number);

    return apiSuccess({ order }, 201);
}
