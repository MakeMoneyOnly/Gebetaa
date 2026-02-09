/**
 * Order Service Layer
 * 
 * Addresses: No Service Layer - Business Logic Scattered (Strategic Audit Finding #10)
 * Provides centralized business logic for order operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
    getOrderByIdempotencyKey,
    insertOrder,
    fetchItemsForValidation
} from '@/lib/supabase/queries';

// Type aliases
type Tables = Database['public']['Tables'];
type Order = Tables['orders']['Row'];
type OrderInsert = Tables['orders']['Insert'];

export interface OrderValidationResult {
    isValid: boolean;
    error?: string;
    calculatedTotal?: number;
    enrichedItems?: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        station?: string;
        notes?: string;
    }>;
}

export interface RateLimitResult {
    allowed: boolean;
    remainingOrders?: number;
    resetTime?: Date;
}

/**
 * Validates order items against database
 * Checks: item existence, availability, price accuracy
 */
export async function validateOrderItems(
    supabase: SupabaseClient<Database>,
    items: Array<{ id: string; name: string; quantity: number; price: number; notes?: string }>,
    claimedTotal: number
): Promise<OrderValidationResult> {
    const itemIds = items.map(i => i.id);

    const { data: dbItems, error } = await fetchItemsForValidation(supabase, itemIds);

    if (error || !dbItems) {
        return { isValid: false, error: 'Failed to validate items' };
    }

    if (dbItems.length !== itemIds.length) {
        const foundIds = new Set(dbItems.map(i => i.id));
        const missingIds = itemIds.filter(id => !foundIds.has(id));
        return { isValid: false, error: `Items not found: ${missingIds.join(', ')}` };
    }

    let calculatedTotal = 0;
    const enrichedItems = [];

    for (const item of items) {
        const dbItem = dbItems.find(dbi => dbi.id === item.id);
        if (!dbItem) {
            return { isValid: false, error: `Item ${item.id} not found` };
        }

        if (!dbItem.available) {
            return { isValid: false, error: `Item "${item.name}" is sold out` };
        }

        calculatedTotal += Number(dbItem.price) * item.quantity;

        enrichedItems.push({
            ...item,
            station: dbItem.station || 'kitchen'
        });
    }

    // Allow for minor floating point differences
    if (Math.abs(calculatedTotal - claimedTotal) > 0.01) {
        return {
            isValid: false,
            error: 'Price mismatch. The menu might have been updated.',
            calculatedTotal
        };
    }

    return {
        isValid: true,
        calculatedTotal,
        enrichedItems
    };
}

/**
 * Checks rate limiting for guest fingerprint
 * Allows max 5 orders per 10 minutes per device
 */
export async function checkRateLimit(
    supabase: SupabaseClient<Database>,
    guestFingerprint: string,
    maxOrders: number = 5,
    windowMinutes: number = 10
): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('guest_fingerprint', guestFingerprint)
        .gt('created_at', windowStart);

    if (error) {
        // Fail open - allow order if we can't check rate limit
        console.error('[RateLimit] Failed to check:', error);
        return { allowed: true };
    }

    const orderCount = count || 0;
    const allowed = orderCount < maxOrders;

    return {
        allowed,
        remainingOrders: Math.max(0, maxOrders - orderCount),
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
    };
}

/**
 * Checks for duplicate order using idempotency key
 */
export async function checkDuplicateOrder(
    supabase: SupabaseClient<Database>,
    idempotencyKey: string
): Promise<Pick<Order, 'id' | 'status'> | null> {
    const { data, error } = await getOrderByIdempotencyKey(supabase, idempotencyKey);

    if (error) {
        console.error('[OrderService] Failed to check duplicate:', error);
        return null;
    }

    return data;
}

/**
 * Creates a new order with all validations
 */
export async function createOrder(
    supabase: SupabaseClient<Database>,
    orderData: {
        restaurant_id: string;
        table_number: string;
        items: Array<{ id: string; name: string; quantity: number; price: number; notes?: string }>;
        total_price: number;
        notes?: string;
        idempotency_key: string;
        guest_fingerprint: string;
    }
): Promise<{ success: true; order: Order } | { success: false; error: string }> {
    // 1. Check for duplicate
    const existingOrder = await checkDuplicateOrder(supabase, orderData.idempotency_key);
    if (existingOrder) {
        // Fetch full order data for the duplicate
        const { data: fullOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', existingOrder.id)
            .single();
        if (fullOrder) {
            return { success: true, order: fullOrder };
        }
    }

    // 2. Validate items
    const validation = await validateOrderItems(
        supabase,
        orderData.items,
        orderData.total_price
    );

    if (!validation.isValid) {
        return { success: false, error: validation.error || 'Validation failed' };
    }

    // 3. Generate order number


    // 4. Insert order - use type assertion to handle DB schema differences
    const orderInsert = {
        restaurant_id: orderData.restaurant_id,
        table_number: parseInt(orderData.table_number, 10) || 0,
        items: validation.enrichedItems as unknown as OrderInsert['items'],
        total: orderData.total_price,
        idempotency_key: orderData.idempotency_key,
        guest_fingerprint: orderData.guest_fingerprint,
        status: 'pending',
    } as OrderInsert;

    const { data: order, error } = await insertOrder(supabase, orderInsert);

    if (error || !order) {
        console.error('[OrderService] Failed to create order:', error);
        return { success: false, error: 'Failed to create order' };
    }

    return { success: true, order };
}

/**
 * Generates a guest fingerprint from IP and user agent
 */
export function generateGuestFingerprint(
    ip: string,
    userAgent: string | null
): string {
    return `${ip}-${userAgent || 'unknown'}`;
}

/**
 * Generates an idempotency key for order deduplication
 */
export function generateIdempotencyKey(): string {
    return crypto.randomUUID();
}
