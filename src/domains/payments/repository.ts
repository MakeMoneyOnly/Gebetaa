// Payments Domain - Repository Layer
// Database access layer - Supabase queries only, no business logic
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/database';
import {
    PAYMENT_LIST_COLUMNS,
    PAYMENT_DETAIL_COLUMNS,
    columnsToString,
} from '@/lib/constants/query-columns';

// Lazy initialization of Supabase client
let supabase: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
    if (!supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                `Supabase configuration missing. NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SECRET_KEY: ${!!supabaseKey}`
            );
        }

        supabase = createClient<Database>(supabaseUrl, supabaseKey);
    }
    return supabase;
}

export type PaymentRow = Database['public']['Tables']['payments']['Row'];

export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'captured'
    | 'failed'
    | 'refunded'
    | 'cancelled';

export type PaymentProvider = 'telebirr' | 'chapa' | 'cbebirr' | 'cash' | 'card';

export interface PaymentListOptions {
    status?: PaymentStatus;
    provider?: PaymentProvider;
    limit?: number;
    offset?: number;
}

export class PaymentsRepository {
    /**
     * Get a single payment by ID
     */
    async getPayment(id: string): Promise<PaymentRow | null> {
        const { data, error } = await getSupabaseClient()
            .from('payments')
            .select(columnsToString(PAYMENT_DETAIL_COLUMNS))
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('[payments/repository] Error fetching payment:', error);
            throw new Error(error.message);
        }

        return data as PaymentRow | null;
    }

    /**
     * Get payments for an order
     */
    async getPaymentsByOrder(
        orderId: string,
        options: PaymentListOptions = {}
    ): Promise<PaymentRow[]> {
        const limit = Math.min(options.limit ?? 50, 200);
        const offset = options.offset ?? 0;

        let query = getSupabaseClient()
            .from('payments')
            .select(columnsToString(PAYMENT_LIST_COLUMNS))
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (options.status) {
            query = query.eq('status', options.status);
        }

        if (options.provider) {
            query = query.eq('provider', options.provider);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[payments/repository] Error fetching payments by order:', error);
            throw new Error(error.message);
        }

        return (data as unknown as PaymentRow[]) ?? [];
    }

    /**
     * Get payments for a restaurant
     */
    async getPaymentsByRestaurant(
        restaurantId: string,
        options: PaymentListOptions = {}
    ): Promise<PaymentRow[]> {
        const limit = Math.min(options.limit ?? 50, 200);
        const offset = options.offset ?? 0;

        let query = getSupabaseClient()
            .from('payments')
            .select(columnsToString(PAYMENT_LIST_COLUMNS))
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (options.status) {
            query = query.eq('status', options.status);
        }

        if (options.provider) {
            query = query.eq('provider', options.provider);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[payments/repository] Error fetching payments by restaurant:', error);
            throw new Error(error.message);
        }

        return (data as unknown as PaymentRow[]) ?? [];
    }

    /**
     * Create a new payment
     */
    async createPayment(data: {
        restaurant_id: string;
        order_id: string;
        amount: number;
        currency: string;
        provider: string;
        payment_method: string;
        idempotency_key: string;
        metadata?: Record<string, unknown>;
    }): Promise<PaymentRow> {
        const { data: payment, error } = await getSupabaseClient()
            .from('payments')
            .insert({
                restaurant_id: data.restaurant_id,
                order_id: data.order_id,
                amount: data.amount,
                currency: data.currency,
                provider: data.provider,
                method: data.payment_method,
                status: 'pending',
                idempotency_key: data.idempotency_key,
                tip_amount: 0,
                metadata: (data.metadata ?? undefined) as Json | undefined,
            })
            .select()
            .single();

        if (error) {
            console.error('[payments/repository] Error creating payment:', error);
            throw new Error(error.message);
        }

        return payment!;
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        id: string,
        status: PaymentStatus,
        transactionId?: string,
        metadata?: Record<string, unknown>
    ): Promise<PaymentRow> {
        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (transactionId) {
            updateData.provider_reference = transactionId;
        }

        if (metadata) {
            updateData.metadata = metadata;
        }

        const { data: payment, error } = await getSupabaseClient()
            .from('payments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[payments/repository] Error updating payment status:', error);
            throw new Error(error.message);
        }

        return payment!;
    }

    /**
     * Get payment by idempotency key (for deduplication)
     */
    async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentRow | null> {
        const { data, error } = await getSupabaseClient()
            .from('payments')
            .select(columnsToString(PAYMENT_DETAIL_COLUMNS))
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();

        if (error) {
            console.error(
                '[payments/repository] Error fetching payment by idempotency key:',
                error
            );
            throw new Error(error.message);
        }

        return data as PaymentRow | null;
    }

    /**
     * Batch loader: Get payments for multiple IDs
     * Used by DataLoader for N+1 query prevention
     */
    async getPaymentsByIds(ids: string[]): Promise<PaymentRow[]> {
        if (ids.length === 0) return [];

        const { data, error } = await getSupabaseClient()
            .from('payments')
            .select(columnsToString(PAYMENT_LIST_COLUMNS))
            .in('id', ids);

        if (error) {
            console.error('[payments/repository] Error fetching payments by IDs:', error);
            throw new Error(error.message);
        }

        return (data as unknown as PaymentRow[]) ?? [];
    }
}

export const paymentsRepository = new PaymentsRepository();
