/**
 * Menu Domain - Repository Layer
 * CRIT-07: GraphQL Federation - Menu subgraph data access
 */

import { createClient } from '@/lib/supabase/client';

// Use 'any' for database row types to avoid schema sync issues
// In production, these would be generated from Supabase types

/**
 * Get all menu items for a restaurant
 */
export async function getMenuItems(
    restaurantId: string,
    options?: {
        categoryId?: string;
        availableOnly?: boolean;
        limit?: number;
    }
): Promise<Record<string, unknown>[]> {
    const supabase = createClient();

    let query = supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId);

    if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
    }

    if (options?.availableOnly) {
        query = query.eq('is_available', true);
    }

    // Apply limit to prevent unbounded result sets
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[menu/repository] Error fetching menu items:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get a single menu item by ID
 */
export async function getMenuItem(id: string): Promise<Record<string, unknown> | null> {
    const supabase = createClient();

    const { data, error } = await supabase.from('menu_items').select('*').eq('id', id).single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('[menu/repository] Error fetching menu item:', error);
        throw error;
    }

    return data;
}

/**
 * Get all categories for a restaurant
 */
export async function getMenuCategories(restaurantId: string): Promise<Record<string, unknown>[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) {
        console.error('[menu/repository] Error fetching categories:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get modifier groups for a menu item
 */
export async function getModifierGroups(menuItemId: string): Promise<Record<string, unknown>[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('modifier_groups')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .eq('is_active', true);

    if (error) {
        console.error('[menu/repository] Error fetching modifier groups:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get modifier options for a modifier group
 */
export async function getModifierOptions(
    modifierGroupId: string
): Promise<Record<string, unknown>[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('modifier_options')
        .select('*')
        .eq('modifier_group_id', modifierGroupId)
        .eq('is_available', true);

    if (error) {
        console.error('[menu/repository] Error fetching modifier options:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get multiple menu items by IDs
 * Used by DataLoader for N+1 query prevention
 */
export async function getMenuItemsByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase.from('menu_items').select('*').in('id', ids);

    if (error) {
        console.error('[menu/repository] Error fetching menu items by IDs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get modifier groups for multiple menu items
 * Used by DataLoader for N+1 query prevention
 */
export async function getModifierGroupsByMenuItemIds(
    menuItemIds: string[]
): Promise<Record<string, unknown>[]> {
    if (menuItemIds.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase
        .from('modifier_groups')
        .select('*')
        .in('menu_item_id', menuItemIds)
        .eq('is_active', true);

    if (error) {
        console.error('[menu/repository] Error fetching modifier groups by menu item IDs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get modifier options for multiple groups
 * Used by DataLoader for N+1 query prevention
 */
export async function getModifierOptionsByGroupIds(
    groupIds: string[]
): Promise<Record<string, unknown>[]> {
    if (groupIds.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase
        .from('modifier_options')
        .select('*')
        .in('modifier_group_id', groupIds)
        .eq('is_available', true);

    if (error) {
        console.error('[menu/repository] Error fetching modifier options by group IDs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get multiple categories by IDs
 * Used by DataLoader for N+1 query prevention
 */
export async function getCategoriesByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase.from('categories').select('*').in('id', ids);

    if (error) {
        console.error('[menu/repository] Error fetching categories by IDs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get multiple modifier groups by their IDs
 * Used by DataLoader for federation reference resolution
 */
export async function getModifierGroupsByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase.from('modifier_groups').select('*').in('id', ids);

    if (error) {
        console.error('[menu/repository] Error fetching modifier groups by IDs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Batch loader: Get multiple modifier options by their IDs
 * Used by DataLoader for federation reference resolution
 */
export async function getModifierOptionsByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) return [];
    const supabase = createClient();

    const { data, error } = await supabase.from('modifier_options').select('*').in('id', ids);

    if (error) {
        console.error('[menu/repository] Error fetching modifier options by IDs:', error);
        throw error;
    }

    return data || [];
}

export const menuRepository = {
    getMenuItems,
    getMenuItem,
    getMenuCategories,
    getModifierGroups,
    getModifierOptions,
    getMenuItemsByIds,
    getModifierGroupsByMenuItemIds,
    getModifierOptionsByGroupIds,
    getCategoriesByIds,
    getModifierGroupsByIds,
    getModifierOptionsByIds,
};

export default menuRepository;
