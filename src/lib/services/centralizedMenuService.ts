/**
 * Centralized Menu Management Service
 * TASK-MULTI-001: Push menu changes to all locations from one place
 *
 * Enables multi-location restaurants to manage menus centrally.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =========================================================
// Type Definitions
// =========================================================

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'partial';

export interface MenuLocation {
    id: string;
    restaurant_id: string;
    restaurant_name: string;
    is_primary: boolean;
    sync_enabled: boolean;
    last_sync_at: string | null;
    sync_status: SyncStatus;
    pending_changes: number;
}

export interface MenuChange {
    id: string;
    change_type: 'create' | 'update' | 'delete' | 'price_change' | 'availability_change';
    entity_type: 'category' | 'menu_item' | 'modifier_group' | 'modifier_option';
    entity_id: string;
    location_ids: string[];
    change_data: Record<string, unknown>;
    status: 'pending' | 'applied' | 'failed';
    applied_at: string | null;
    applied_to: string[];
    failed_at: string | null;
    error_message: string | null;
    created_at: string;
    created_by: string;
}

export interface CentralizedMenuConfig {
    id: string;
    primary_restaurant_id: string;
    name: string;
    description: string | null;
    sync_categories: boolean;
    sync_items: boolean;
    sync_modifiers: boolean;
    sync_pricing: boolean;
    sync_availability: boolean;
    auto_sync_enabled: boolean;
    sync_schedule: string | null;
    created_at: string;
    updated_at: string;
}

export interface SyncResult {
    location_id: string;
    location_name: string;
    success: boolean;
    changes_applied: number;
    changes_failed: number;
    errors: string[];
}

// =========================================================
// Location Management
// =========================================================

/**
 * Get all locations in a menu group
 */
export async function getMenuLocations(
    supabase: SupabaseClient<Database>,
    primaryRestaurantId: string
): Promise<MenuLocation[]> {
    const db = supabase as any;

    try {
        // Get the menu group configuration
        const { data: config } = await db
            .from('centralized_menu_configs')
            .select('id')
            .eq('primary_restaurant_id', primaryRestaurantId)
            .maybeSingle();

        if (!config) {
            return [];
        }

        // Get all linked restaurants
        const { data: links, error } = await db
            .from('menu_location_links')
            .select(
                `
                restaurant_id,
                is_primary,
                sync_enabled,
                last_sync_at,
                sync_status,
                pending_changes,
                restaurants(id, name)
            `
            )
            .eq('menu_config_id', config.id);

        if (error) {
            console.error('[CentralizedMenu] Failed to fetch locations:', error);
            return [];
        }

        return (links ?? []).map((link: any) => ({
            id: link.restaurant_id,
            restaurant_id: link.restaurant_id,
            restaurant_name: link.restaurants?.name ?? 'Unknown',
            is_primary: link.is_primary,
            sync_enabled: link.sync_enabled,
            last_sync_at: link.last_sync_at,
            sync_status: link.sync_status,
            pending_changes: link.pending_changes,
        }));
    } catch (error) {
        console.error('[CentralizedMenu] Error:', error);
        return [];
    }
}

/**
 * Add a location to the menu group
 */
export async function addMenuLocation(
    supabase: SupabaseClient<Database>,
    primaryRestaurantId: string,
    targetRestaurantId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const db = supabase as any;

    try {
        // Get or create menu config
        let { data: config } = await db
            .from('centralized_menu_configs')
            .select('id')
            .eq('primary_restaurant_id', primaryRestaurantId)
            .maybeSingle();

        if (!config) {
            const { data: newConfig, error: configError } = await db
                .from('centralized_menu_configs')
                .insert({
                    primary_restaurant_id: primaryRestaurantId,
                    name: 'Main Menu',
                    sync_categories: true,
                    sync_items: true,
                    sync_modifiers: true,
                    sync_pricing: false, // Pricing often varies by location
                    sync_availability: true,
                    auto_sync_enabled: false,
                })
                .select('id')
                .single();

            if (configError) {
                return { success: false, error: 'Failed to create menu config' };
            }
            config = newConfig;
        }

        // Add the link
        const { error: linkError } = await db.from('menu_location_links').insert({
            menu_config_id: config.id,
            restaurant_id: targetRestaurantId,
            is_primary: targetRestaurantId === primaryRestaurantId,
            sync_enabled: true,
            sync_status: 'pending',
            pending_changes: 0,
        });

        if (linkError) {
            return { success: false, error: 'Failed to add location' };
        }

        // Log the change
        await db.from('audit_logs').insert({
            action: 'add_menu_location',
            entity_type: 'centralized_menu',
            entity_id: config.id,
            restaurant_id: primaryRestaurantId,
            user_id: userId,
            metadata: { target_restaurant_id: targetRestaurantId },
        });

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

// =========================================================
// Menu Sync Operations
// =========================================================

/**
 * Push menu changes to all locations
 */
export async function pushMenuToLocations(
    supabase: SupabaseClient<Database>,
    primaryRestaurantId: string,
    options?: {
        locationIds?: string[];
        syncCategories?: boolean;
        syncItems?: boolean;
        syncModifiers?: boolean;
        syncPricing?: boolean;
        syncAvailability?: boolean;
    }
): Promise<{ success: boolean; results: SyncResult[] }> {
    const db = supabase as any;

    try {
        // Get config
        const { data: config } = await db
            .from('centralized_menu_configs')
            .select('*')
            .eq('primary_restaurant_id', primaryRestaurantId)
            .maybeSingle();

        if (!config) {
            return { success: false, results: [] };
        }

        // Get target locations
        let locationsQuery = db
            .from('menu_location_links')
            .select(
                `
                restaurant_id,
                sync_enabled,
                restaurants(id, name)
            `
            )
            .eq('menu_config_id', config.id)
            .eq('sync_enabled', true);

        if (options?.locationIds && options.locationIds.length > 0) {
            locationsQuery = locationsQuery.in('restaurant_id', options.locationIds);
        }

        const { data: locations } = await locationsQuery;

        if (!locations || locations.length === 0) {
            return { success: true, results: [] };
        }

        // Get primary menu data
        const menuData = await getFullMenuData(db, primaryRestaurantId);

        const results: SyncResult[] = [];

        // Sync to each location
        for (const location of locations) {
            if (location.restaurant_id === primaryRestaurantId) {
                continue; // Skip primary location
            }

            const result = await syncMenuToLocation(db, location.restaurant_id, menuData, {
                syncCategories: options?.syncCategories ?? config.sync_categories,
                syncItems: options?.syncItems ?? config.sync_items,
                syncModifiers: options?.syncModifiers ?? config.sync_modifiers,
                syncPricing: options?.syncPricing ?? config.sync_pricing,
                syncAvailability: options?.syncAvailability ?? config.sync_availability,
            });

            results.push({
                location_id: location.restaurant_id,
                location_name: location.restaurants?.name ?? 'Unknown',
                success: result.success,
                changes_applied: result.changesApplied,
                changes_failed: result.changesFailed,
                errors: result.errors,
            });

            // Update sync status
            await db
                .from('menu_location_links')
                .update({
                    last_sync_at: new Date().toISOString(),
                    sync_status: result.success ? 'synced' : 'partial',
                    pending_changes: result.changesFailed,
                })
                .eq('menu_config_id', config.id)
                .eq('restaurant_id', location.restaurant_id);
        }

        return {
            success: results.every(r => r.success),
            results,
        };
    } catch (error) {
        console.error('[CentralizedMenu] Push failed:', error);
        return { success: false, results: [] };
    }
}

/**
 * Get full menu data from a restaurant
 */
async function getFullMenuData(
    db: any,
    restaurantId: string
): Promise<{
    categories: any[];
    menuItems: any[];
    modifierGroups: any[];
    modifierOptions: any[];
}> {
    // Get categories
    const { data: categories } = await db
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order_index');

    // Get menu items
    const { data: menuItems } = await db
        .from('menu_items')
        .select(
            `
            *,
            categories!inner(restaurant_id)
        `
        )
        .eq('categories.restaurant_id', restaurantId);

    // Get modifier groups
    const { data: modifierGroups } = await db
        .from('modifier_groups')
        .select('*')
        .eq('restaurant_id', restaurantId);

    // Get modifier options
    const { data: modifierOptions } = await db
        .from('modifier_options')
        .select('*')
        .eq('restaurant_id', restaurantId);

    return {
        categories: categories ?? [],
        menuItems: menuItems ?? [],
        modifierGroups: modifierGroups ?? [],
        modifierOptions: modifierOptions ?? [],
    };
}

/**
 * Sync menu data to a single location
 */
async function syncMenuToLocation(
    db: any,
    targetRestaurantId: string,
    menuData: {
        categories: any[];
        menuItems: any[];
        modifierGroups: any[];
        modifierOptions: any[];
    },
    options: {
        syncCategories: boolean;
        syncItems: boolean;
        syncModifiers: boolean;
        syncPricing: boolean;
        syncAvailability: boolean;
    }
): Promise<{
    success: boolean;
    changesApplied: number;
    changesFailed: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let changesApplied = 0;
    let changesFailed = 0;

    try {
        // Sync categories
        if (options.syncCategories) {
            for (const category of menuData.categories) {
                try {
                    const { error } = await db.from('categories').upsert(
                        {
                            id: category.id,
                            restaurant_id: targetRestaurantId,
                            name: category.name,
                            name_am: category.name_am,
                            order_index: category.order_index,
                            section: category.section,
                        },
                        { onConflict: 'id' }
                    );

                    if (error) {
                        errors.push(`Category ${category.name}: ${error.message}`);
                        changesFailed++;
                    } else {
                        changesApplied++;
                    }
                } catch (e) {
                    errors.push(`Category ${category.name}: Unknown error`);
                    changesFailed++;
                }
            }
        }

        // Sync menu items
        if (options.syncItems) {
            for (const item of menuData.menuItems) {
                try {
                    const itemData: Record<string, unknown> = {
                        id: item.id,
                        category_id: item.category_id,
                        name: item.name,
                        name_am: item.name_am,
                        description: item.description,
                        description_am: item.description_am,
                        image_url: item.image_url,
                        is_available: item.is_available,
                        is_chef_special: item.is_chef_special,
                        is_fasting: item.is_fasting,
                        allergens: item.allergens,
                        dietary_tags: item.dietary_tags,
                        station: item.station,
                        course: item.course,
                        connected_stations: item.connected_stations,
                    };

                    if (options.syncPricing) {
                        itemData.price = item.price;
                    }

                    if (options.syncAvailability) {
                        itemData.is_available = item.is_available;
                    }

                    const { error } = await db
                        .from('menu_items')
                        .upsert(itemData, { onConflict: 'id' });

                    if (error) {
                        errors.push(`Item ${item.name}: ${error.message}`);
                        changesFailed++;
                    } else {
                        changesApplied++;
                    }
                } catch (e) {
                    errors.push(`Item ${item.name}: Unknown error`);
                    changesFailed++;
                }
            }
        }

        // Sync modifier groups
        if (options.syncModifiers) {
            for (const group of menuData.modifierGroups) {
                try {
                    const { error } = await db.from('modifier_groups').upsert(
                        {
                            id: group.id,
                            restaurant_id: targetRestaurantId,
                            menu_item_id: group.menu_item_id,
                            name: group.name,
                            name_am: group.name_am,
                            required: group.required,
                            multi_select: group.multi_select,
                            min_select: group.min_select,
                            max_select: group.max_select,
                            sort_order: group.sort_order,
                            is_active: group.is_active,
                        },
                        { onConflict: 'id' }
                    );

                    if (error) {
                        errors.push(`Modifier group ${group.name}: ${error.message}`);
                        changesFailed++;
                    } else {
                        changesApplied++;
                    }
                } catch (e) {
                    errors.push(`Modifier group ${group.name}: Unknown error`);
                    changesFailed++;
                }
            }

            // Sync modifier options
            for (const option of menuData.modifierOptions) {
                try {
                    const optionData: Record<string, unknown> = {
                        id: option.id,
                        restaurant_id: targetRestaurantId,
                        modifier_group_id: option.modifier_group_id,
                        name: option.name,
                        name_am: option.name_am,
                        sort_order: option.sort_order,
                        is_available: option.is_available,
                    };

                    if (options.syncPricing) {
                        optionData.price_adjustment = option.price_adjustment;
                    }

                    const { error } = await db
                        .from('modifier_options')
                        .upsert(optionData, { onConflict: 'id' });

                    if (error) {
                        errors.push(`Modifier option ${option.name}: ${error.message}`);
                        changesFailed++;
                    } else {
                        changesApplied++;
                    }
                } catch (e) {
                    errors.push(`Modifier option ${option.name}: Unknown error`);
                    changesFailed++;
                }
            }
        }

        return {
            success: errors.length === 0,
            changesApplied,
            changesFailed,
            errors,
        };
    } catch (error) {
        return {
            success: false,
            changesApplied,
            changesFailed,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}

// =========================================================
// Change Tracking
// =========================================================

/**
 * Record a menu change for sync
 */
export async function recordMenuChange(
    supabase: SupabaseClient<Database>,
    primaryRestaurantId: string,
    change: {
        change_type: 'create' | 'update' | 'delete' | 'price_change' | 'availability_change';
        entity_type: 'category' | 'menu_item' | 'modifier_group' | 'modifier_option';
        entity_id: string;
        change_data: Record<string, unknown>;
    },
    userId: string
): Promise<void> {
    const db = supabase as any;

    try {
        // Get config
        const { data: config } = await db
            .from('centralized_menu_configs')
            .select('id')
            .eq('primary_restaurant_id', primaryRestaurantId)
            .maybeSingle();

        if (!config) {
            return; // No centralized menu configured
        }

        // Get linked locations
        const { data: links } = await db
            .from('menu_location_links')
            .select('restaurant_id')
            .eq('menu_config_id', config.id)
            .eq('sync_enabled', true)
            .neq('restaurant_id', primaryRestaurantId);

        if (!links || links.length === 0) {
            return;
        }

        // Record the change
        await db.from('menu_change_queue').insert({
            menu_config_id: config.id,
            change_type: change.change_type,
            entity_type: change.entity_type,
            entity_id: change.entity_id,
            location_ids: links.map((l: any) => l.restaurant_id),
            change_data: change.change_data,
            status: 'pending',
            created_by: userId,
        });

        // Update pending changes count for each location
        for (const link of links) {
            await db.rpc('increment_pending_changes', {
                p_restaurant_id: link.restaurant_id,
                p_menu_config_id: config.id,
            });
        }
    } catch (error) {
        console.error('[CentralizedMenu] Failed to record change:', error);
    }
}

/**
 * Get pending changes for a location
 */
export async function getPendingChanges(
    supabase: SupabaseClient<Database>,
    primaryRestaurantId: string
): Promise<MenuChange[]> {
    const db = supabase as any;

    try {
        const { data: config } = await db
            .from('centralized_menu_configs')
            .select('id')
            .eq('primary_restaurant_id', primaryRestaurantId)
            .maybeSingle();

        if (!config) {
            return [];
        }

        const { data, error } = await db
            .from('menu_change_queue')
            .select('*')
            .eq('menu_config_id', config.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[CentralizedMenu] Failed to fetch pending changes:', error);
            return [];
        }

        return data ?? [];
    } catch (error) {
        console.error('[CentralizedMenu] Error:', error);
        return [];
    }
}
