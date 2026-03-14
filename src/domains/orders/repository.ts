// Orders Domain - Repository Layer
// Database access layer - Supabase queries only, no business logic
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Lazy initialization of Supabase client - only creates when actually needed
// This allows the module to be imported during build without requiring env vars
let supabase: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
    if (!supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;

        if (!supabaseUrl || !supabaseKey) {
            // During build, return a mock client that won't be used
            // In production, these env vars must be set
            throw new Error(
                `Supabase configuration missing. NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SECRET_KEY: ${!!supabaseKey}`
            );
        }

        supabase = createClient<Database>(supabaseUrl, supabaseKey);
    }
    return supabase;
}

export type OrderRow = Database['public']['Tables']['orders']['Row'];

export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

export class OrdersRepository {
    async findById(id: string): Promise<OrderRow | null> {
        const { data } = await getSupabaseClient().from('orders').select('*').eq('id', id).single();
        return data;
    }

    async findByRestaurant(
        restaurantId: string,
        options: {
            status?: string;
            tableNumber?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<OrderRow[]> {
        let query = getSupabaseClient()
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (options.status) {
            query = query.eq('status', options.status);
        }
        if (options.tableNumber) {
            query = query.eq('table_number', options.tableNumber);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(options.offset ?? 0, (options.limit ?? 20) - 1);

        const { data } = await query;
        return data ?? [];
    }

    async findActiveByRestaurant(restaurantId: string): Promise<OrderRow[]> {
        const { data } = await getSupabaseClient()
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false });
        return data ?? [];
    }

    async findByKDSStation(restaurantId: string, station: string): Promise<OrderRow[]> {
        const { data } = await getSupabaseClient()
            .from('orders')
            .select('*, order_items(*)')
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false });
        return (data ?? []).filter(order =>
            order.order_items?.some(item => item.station === station)
        );
    }

    async create(data: {
        restaurant_id: string;
        table_number?: string;
        order_number: string;
        order_type?: string;
        total_price: number;
        discount_amount?: number;
        notes?: string;
        guest_fingerprint?: string;
        staff_id?: string;
        idempotency_key: string;
    }): Promise<OrderRow> {
        const { data: order, error } = await getSupabaseClient()
            .from('orders')
            .insert({
                restaurant_id: data.restaurant_id,
                table_number: data.table_number ?? '',
                order_number: data.order_number,
                status: 'pending',
                order_type: data.order_type ?? 'dine_in',
                total_price: data.total_price,
                discount_amount: data.discount_amount ?? 0,
                notes: data.notes ?? null,
                guest_fingerprint: data.guest_fingerprint ?? null,
                items: [],
                fire_mode: 'full',
                idempotency_key: data.idempotency_key,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return order!;
    }

    async updateStatus(id: string, status: string): Promise<OrderRow> {
        const { data: order, error } = await getSupabaseClient()
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return order!;
    }

    async cancel(id: string, reason?: string): Promise<OrderRow> {
        const { data: order, error } = await getSupabaseClient()
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
        const { data } = await getSupabaseClient()
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
        return data ?? [];
    }

    async createItems(
        items: {
            order_id: string;
            item_id: string;
            quantity: number;
            price: number;
            modifiers?: Record<string, unknown> | null;
            notes?: string | null;
            station?: string;
        }[]
    ): Promise<OrderItemRow[]> {
        const { data, error } = await getSupabaseClient()
            .from('order_items')
            .insert(
                items.map(item => ({
                    order_id: item.order_id,
                    item_id: item.item_id,
                    quantity: item.quantity,
                    price: item.price,
                    modifiers: item.modifiers ? JSON.parse(JSON.stringify(item.modifiers)) : null,
                    notes: item.notes ?? null,
                    status: 'pending',
                    station: item.station ?? null,
                    course: 'main',
                    name: '',
                }))
            )
            .select();

        if (error) throw new Error(error.message);
        return data ?? [];
    }
}

export const ordersRepository = new OrdersRepository();
