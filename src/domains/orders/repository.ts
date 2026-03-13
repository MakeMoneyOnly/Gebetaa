// Orders Domain - Repository Layer
// Database access layer - Supabase queries only, no business logic
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OrderRow {
    id: string;
    restaurant_id: string;
    table_id: string | null;
    order_number: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
    type: 'dine_in' | 'takeaway' | 'delivery';
    total_price: number; // in santim
    discount_amount: number; // in santim
    notes: string | null;
    guest_id: string | null;
    staff_id: string;
    idempotency_key: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItemRow {
    id: string;
    restaurant_id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number; // in santim
    item_total: number; // in santim
    modifiers: Record<string, unknown> | null;
    notes: string | null;
    status: string;
    kds_station: string | null;
}

export class OrdersRepository {
    async findById(id: string): Promise<OrderRow | null> {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
        return data;
    }

    async findByRestaurant(
        restaurantId: string,
        options: {
            status?: string;
            tableId?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<OrderRow[]> {
        let query = supabase.from('orders').select('*').eq('restaurant_id', restaurantId);

        if (options.status) {
            query = query.eq('status', options.status);
        }
        if (options.tableId) {
            query = query.eq('table_id', options.tableId);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(options.offset ?? 0, (options.limit ?? 20) - 1);

        const { data } = await query;
        return data ?? [];
    }

    async findActiveByRestaurant(restaurantId: string): Promise<OrderRow[]> {
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false });
        return data ?? [];
    }

    async findByKDSStation(restaurantId: string, station: string): Promise<OrderRow[]> {
        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false });
        return (data ?? []).filter(order =>
            order.order_items?.some((item: OrderItemRow) => item.kds_station === station)
        );
    }

    async create(data: {
        restaurant_id: string;
        table_id?: string;
        order_number: string;
        type: 'dine_in' | 'takeaway' | 'delivery';
        total_price: number;
        discount_amount?: number;
        notes?: string;
        guest_id?: string;
        staff_id: string;
        idempotency_key: string;
    }): Promise<OrderRow> {
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                restaurant_id: data.restaurant_id,
                table_id: data.table_id ?? null,
                order_number: data.order_number,
                status: 'pending',
                type: data.type,
                total_price: data.total_price,
                discount_amount: data.discount_amount ?? 0,
                notes: data.notes ?? null,
                guest_id: data.guest_id ?? null,
                staff_id: data.staff_id,
                idempotency_key: data.idempotency_key,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return order!;
    }

    async updateStatus(id: string, status: OrderRow['status']): Promise<OrderRow> {
        const { data: order, error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return order!;
    }

    async cancel(id: string, reason?: string): Promise<OrderRow> {
        const { data: order, error } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                notes: reason ? `Cancelled: ${reason}` : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return order!;
    }

    // Order Items
    async getItems(orderId: string): Promise<OrderItemRow[]> {
        const { data } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        return data ?? [];
    }

    async createItems(
        items: {
            restaurant_id: string;
            order_id: string;
            menu_item_id: string;
            quantity: number;
            unit_price: number;
            item_total: number;
            modifiers?: Record<string, unknown>;
            notes?: string;
            kds_station?: string;
        }[]
    ): Promise<OrderItemRow[]> {
        const { data, error } = await supabase
            .from('order_items')
            .insert(
                items.map(item => ({
                    restaurant_id: item.restaurant_id,
                    order_id: item.order_id,
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    item_total: item.item_total,
                    modifiers: item.modifiers ?? null,
                    notes: item.notes ?? null,
                    status: 'pending',
                    kds_station: item.kds_station ?? null,
                }))
            )
            .select();

        if (error) throw new Error(error.message);
        return data ?? [];
    }
}

export const ordersRepository = new OrdersRepository();
