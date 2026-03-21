/**
 * Price Override Service
 * TASK-POS-001: Price Overrides with Audit Trail
 *
 * Allows staff to manually adjust item prices with mandatory reason codes
 * and full audit trail.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =========================================================
// Type Definitions
// =========================================================

export type ReasonCode =
    | 'manager_discount'
    | 'complimentary'
    | 'price_error'
    | 'customer_complaint'
    | 'promotion'
    | 'other';

export interface PriceOverride {
    id: string;
    order_item_id: string;
    original_price: number;
    new_price: number;
    reason_code: ReasonCode;
    reason_notes: string | null;
    staff_id: string;
    approved_by: string | null;
    created_at: string;
}

export interface CreatePriceOverrideInput {
    orderId: string;
    orderItemId: string;
    originalPrice: number;
    newPrice: number;
    reasonCode: ReasonCode;
    reasonNotes?: string;
    staffId: string;
    approvedBy?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// =========================================================
// Permission Check
// =========================================================

/**
 * Check if a user can override prices
 */
export async function canOverridePrices(
    supabase: SupabaseClient<Database>,
    userId: string,
    restaurantId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const db = supabase as any;

    try {
        const { data: staff, error } = await db
            .from('restaurant_staff')
            .select('role, permissions')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !staff) {
            return { allowed: false, reason: 'Not an active staff member' };
        }

        const allowedRoles = ['owner', 'admin', 'manager'];
        if (!allowedRoles.includes(staff.role)) {
            return { allowed: false, reason: 'Insufficient permissions - manager role required' };
        }

        if (staff.permissions && !staff.permissions.can_override_prices) {
            return { allowed: false, reason: 'Price override permission not granted' };
        }

        return { allowed: true };
    } catch (error) {
        console.error('[PriceOverride] Permission check error:', error);
        return { allowed: false, reason: 'Error checking permissions' };
    }
}

// =========================================================
// Input Validation
// =========================================================

/**
 * Validate price override input
 */
export function validatePriceOverrideInput(input: {
    orderId: string;
    orderItemId: string;
    originalPrice: number;
    newPrice: number;
    reasonCode: string;
    reasonNotes?: string;
}): ValidationResult {
    const errors: string[] = [];

    if (!input.orderId) {
        errors.push('Order ID is required');
    }

    if (!input.orderItemId) {
        errors.push('Order item ID is required');
    }

    if (typeof input.originalPrice !== 'number' || input.originalPrice < 0) {
        errors.push('Original price must be a non-negative number');
    }

    if (typeof input.newPrice !== 'number' || input.newPrice < 0) {
        errors.push('New price must be a non-negative number');
    }

    const validReasonCodes: ReasonCode[] = [
        'manager_discount',
        'complimentary',
        'price_error',
        'customer_complaint',
        'promotion',
        'other',
    ];

    if (!input.reasonCode || !validReasonCodes.includes(input.reasonCode as ReasonCode)) {
        errors.push('Valid reason code is required');
    }

    if (input.originalPrice > 0) {
        const changePercent = Math.abs(input.newPrice - input.originalPrice) / input.originalPrice;
        if (changePercent > 2) {
            errors.push('Price change exceeds maximum allowed (200%)');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// =========================================================
// Price Override Operations
// =========================================================

/**
 * Create a price override
 */
export async function createPriceOverride(
    supabase: SupabaseClient<Database>,
    restaurantId: string,
    input: CreatePriceOverrideInput
): Promise<{ success: boolean; override?: PriceOverride; error?: string }> {
    const db = supabase as any;

    try {
        const { data: orderItem, error: itemError } = await db
            .from('order_items')
            .select('id, price, orders!inner(restaurant_id)')
            .eq('id', input.orderItemId)
            .eq('orders.id', input.orderId)
            .maybeSingle();

        if (itemError || !orderItem) {
            return { success: false, error: 'Order item not found' };
        }

        if (orderItem.orders.restaurant_id !== restaurantId) {
            return { success: false, error: 'Order does not belong to this restaurant' };
        }

        const { data: override, error: overrideError } = await db
            .from('price_overrides')
            .insert({
                order_item_id: input.orderItemId,
                original_price: input.originalPrice,
                new_price: input.newPrice,
                reason_code: input.reasonCode,
                reason_notes: input.reasonNotes ?? null,
                staff_id: input.staffId,
                approved_by: input.approvedBy ?? null,
            })
            .select('*')
            .single();

        if (overrideError) {
            console.error('[PriceOverride] Failed to create:', overrideError);
            return { success: false, error: 'Failed to create price override' };
        }

        const { error: updateError } = await db
            .from('order_items')
            .update({ price: input.newPrice })
            .eq('id', input.orderItemId);

        if (updateError) {
            console.error('[PriceOverride] Failed to update item price:', updateError);
            await db.from('price_overrides').delete().eq('id', override.id);
            return { success: false, error: 'Failed to update item price' };
        }

        await recalculateOrderTotal(db, input.orderId);

        return { success: true, override };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Get price overrides for an order
 */
export async function getPriceOverridesForOrder(
    supabase: SupabaseClient<Database>,
    orderId: string
): Promise<PriceOverride[]> {
    const db = supabase as any;

    try {
        const { data, error } = await db
            .from('price_overrides')
            .select(`*, order_items!inner(order_id)`)
            .eq('order_items.order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PriceOverride] Failed to fetch:', error);
            return [];
        }

        return data ?? [];
    } catch (error) {
        console.error('[PriceOverride] Error:', error);
        return [];
    }
}

/**
 * Recalculate order total after price change
 */
async function recalculateOrderTotal(db: any, orderId: string): Promise<void> {
    const { data: items } = await db
        .from('order_items')
        .select('price, quantity')
        .eq('order_id', orderId);

    const totalPrice = (items ?? []).reduce(
        (sum: number, item: any) => sum + (item.price ?? 0) * (item.quantity ?? 1),
        0
    );

    await db.from('orders').update({ total_price: totalPrice }).eq('id', orderId);
}
