/**
 * Typed Supabase query helpers
 *
 * Addresses: Type Safety Gaps with Supabase Queries (Medium Priority Audit Finding #7)
 * Provides centralized, type-safe query functions for common database operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Type aliases for cleaner code
type Tables = Database['public']['Tables'];

/**
 * Fetch reviews for a specific menu item
 *
 * @param supabase - Supabase client instance
 * @param itemId - The item ID to fetch reviews for
 * @returns Array of reviews ordered by created_at desc
 */
export async function fetchReviews(supabase: SupabaseClient<Database>, itemId: string) {
    return supabase
        .from('reviews')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .returns<Tables['reviews']['Row'][]>();
}

/**
 * Fetch orders for a restaurant within a time range
 *
 * @param supabase - Supabase client instance
 * @param restaurantId - The restaurant ID
 * @param since - ISO timestamp to fetch orders from
 * @returns Array of orders ordered by created_at desc
 */
export async function fetchOrdersSince(
    supabase: SupabaseClient<Database>,
    restaurantId: string,
    since: string
) {
    return supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .returns<Tables['orders']['Row'][]>();
}

/**
 * Fetch pending service requests for a restaurant
 *
 * @param supabase - Supabase client instance
 * @param restaurantId - The restaurant ID
 * @returns Array of non-completed service requests
 */
export async function fetchPendingServiceRequests(
    supabase: SupabaseClient<Database>,
    restaurantId: string
) {
    return supabase
        .from('service_requests')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .returns<Tables['service_requests']['Row'][]>();
}

/**
 * Fetch menu items by category
 *
 * @param supabase - Supabase client instance
 * @param categoryId - The category ID
 * @returns Array of menu items in the category
 */
export async function fetchItemsByCategory(supabase: SupabaseClient<Database>, categoryId: string) {
    return supabase
        .from('items')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .order('name', { ascending: true })
        .returns<Tables['items']['Row'][]>();
}

/**
 * Fetch restaurant with full menu (categories + items)
 *
 * @param supabase - Supabase client instance
 * @param slug - The restaurant slug
 * @returns Restaurant data with nested categories and items
 */
export async function fetchRestaurantWithMenu(supabase: SupabaseClient<Database>, slug: string) {
    return supabase
        .from('restaurants')
        .select(
            `
            *,
            categories:categories(
                *,
                items:items(*)
            )
        `
        )
        .eq('slug', slug)
        .single();
}

/**
 * Insert a new order with type safety
 *
 * @param supabase - Supabase client instance
 * @param order - Order data to insert
 * @returns Inserted order data
 */
export async function insertOrder(
    supabase: SupabaseClient<Database>,
    order: Tables['orders']['Insert']
) {
    return supabase
        .from('orders')
        .insert(order)
        .select()
        .single()
        .returns<Tables['orders']['Row']>();
}

/**
 * Insert a service request with type safety
 *
 * @param supabase - Supabase client instance
 * @param request - Service request data to insert
 * @returns Inserted service request data
 */
export async function insertServiceRequest(
    supabase: SupabaseClient<Database>,
    request: Tables['service_requests']['Insert']
) {
    return supabase
        .from('service_requests')
        .insert(request)
        .select()
        .single()
        .returns<Tables['service_requests']['Row']>();
}

/**
 * Update order status with type safety
 *
 * @param supabase - Supabase client instance
 * @param orderId - The order ID to update
 * @param status - New status value
 * @returns Updated order data
 */
export async function updateOrderStatus(
    supabase: SupabaseClient<Database>,
    orderId: string,
    status: Tables['orders']['Row']['status']
) {
    return supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single()
        .returns<Tables['orders']['Row']>();
}

/**
 * Check for existing order by idempotency key
 *
 * @param supabase - Supabase client instance
 * @param idempotencyKey - The idempotency key to check
 * @returns Existing order if found, null otherwise
 */
export async function getOrderByIdempotencyKey(
    supabase: SupabaseClient<Database>,
    idempotencyKey: string
) {
    return supabase
        .from('orders')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
        .returns<Pick<Tables['orders']['Row'], 'id' | 'status'> | null>();
}

/**
 * Fetch items by IDs for validation
 *
 * @param supabase - Supabase client instance
 * @param itemIds - Array of item IDs to fetch
 * @returns Array of items with validation fields
 */
export async function fetchItemsForValidation(
    supabase: SupabaseClient<Database>,
    itemIds: string[]
) {
    return supabase
        .from('items')
        .select('id, name, price, available, station')
        .in('id', itemIds)
        .returns<
            Pick<Tables['items']['Row'], 'id' | 'name' | 'price' | 'available' | 'station'>[]
        >();
}
