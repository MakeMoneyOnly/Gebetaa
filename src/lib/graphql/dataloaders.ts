/**
 * DataLoader Factory for GraphQL N+1 Query Prevention
 * CRITICAL-001: Batch and cache database queries to prevent N+1 problems
 *
 * DataLoaders are created per-request to prevent cache leakage between requests.
 * Each loader batches multiple requests for the same resource type and resolves
 * them in a single database query.
 *
 * HIGH-014: All DataLoaders include tenant verification to prevent cross-tenant data leakage.
 */

import DataLoader from 'dataloader';
import { menuRepository } from '@/domains/menu/repository';
import { ordersRepository, OrderItemRow } from '@/domains/orders/repository';

/**
 * Tenant context for DataLoader operations
 * HIGH-014: Required for tenant isolation verification
 */
export interface TenantContext {
    restaurantId: string;
}

/**
 * Type definitions for DataLoader entities
 * These represent the database row types returned by the repositories
 */
export type MenuItem = Record<string, unknown>;
export type ModifierGroup = Record<string, unknown>;
export type ModifierOption = Record<string, unknown>;
export type Category = Record<string, unknown>;
export type OrderItem = OrderItemRow;

/**
 * DataLoaders interface for GraphQL context
 * Each loader handles a specific entity type with batched loading
 */
export interface DataLoaders {
    /** Load menu items by ID - returns null if not found */
    menuItems: DataLoader<string, MenuItem | null>;
    /** Load modifier groups by menu item ID - returns empty array if none */
    modifierGroups: DataLoader<string, ModifierGroup[]>;
    /** Load modifier options by modifier group ID - returns empty array if none */
    modifierOptions: DataLoader<string, ModifierOption[]>;
    /** Load order items by order ID - returns empty array if none */
    orderItems: DataLoader<string, OrderItem[]>;
    /** Load categories by ID - returns null if not found */
    categories: DataLoader<string, Category | null>;
    /** Load single modifier group by ID - returns null if not found (for federation references) */
    modifierGroup: DataLoader<string, ModifierGroup | null>;
    /** Load single modifier option by ID - returns null if not found (for federation references) */
    modifierOption: DataLoader<string, ModifierOption | null>;
}

/**
 * Create a new set of DataLoaders for a GraphQL request
 *
 * IMPORTANT: This must be called per-request (not shared across requests)
 * to prevent cache leakage and ensure proper batching within a single request.
 *
 * HIGH-014: All DataLoaders now require tenant context for verification.
 * This prevents cross-tenant data leakage when ID enumeration occurs.
 *
 * @param tenantContext - The tenant context containing restaurantId for verification
 * @returns DataLoaders object containing all batch loaders
 */
export function createDataLoaders(tenantContext: TenantContext): DataLoaders {
    const { restaurantId } = tenantContext;

    /**
     * HIGH-014: Helper to verify tenant ownership of entities
     * Filters results to only include entities belonging to the current tenant
     */
    const verifyTenantOwnership = <T extends { restaurant_id?: string }>(
        items: T[],
        ids: readonly string[],
        idExtractor: (item: T) => string
    ): (T | null)[] => {
        const itemMap = new Map(items.map(item => [idExtractor(item), item]));
        return ids.map(id => {
            const item = itemMap.get(id);
            // Return null if item not found or doesn't belong to tenant
            if (!item) return null;
            // Verify tenant ownership - if restaurant_id exists, it must match
            if (item.restaurant_id && item.restaurant_id !== restaurantId) {
                console.warn(
                    `[DataLoader] Tenant isolation violation: attempted access to ${id} by restaurant ${restaurantId}`
                );
                return null;
            }
            return item;
        });
    };

    return {
        /**
         * Menu Items loader - batches requests for menu items by ID
         * Returns the menu item or null if not found
         * HIGH-014: Includes tenant verification
         */
        menuItems: new DataLoader<string, MenuItem | null>(async (ids: readonly string[]) => {
            const items = await menuRepository.getMenuItemsByIds([...ids]);
            return verifyTenantOwnership(items as MenuItem[], ids, item => item.id as string);
        }),

        /**
         * Modifier Groups loader - batches requests for modifier groups by menu item ID
         * Returns an array of modifier groups for each menu item (empty if none)
         * HIGH-014: Includes tenant verification via menu item ownership
         */
        modifierGroups: new DataLoader<string, ModifierGroup[]>(
            async (menuItemIds: readonly string[]) => {
                const groups = await menuRepository.getModifierGroupsByMenuItemIds([
                    ...menuItemIds,
                ]);

                // Group by menu_item_id with tenant verification
                const groupsByMenuItem = new Map<string, ModifierGroup[]>();
                for (const group of groups) {
                    const menuItemId = group.menu_item_id as string;
                    // Verify the parent menu item belongs to tenant
                    if (group.restaurant_id && group.restaurant_id !== restaurantId) {
                        continue; // Skip groups from other tenants
                    }
                    const existing = groupsByMenuItem.get(menuItemId) || [];
                    existing.push(group);
                    groupsByMenuItem.set(menuItemId, existing);
                }

                return menuItemIds.map(id => groupsByMenuItem.get(id) || []);
            }
        ),

        /**
         * Modifier Options loader - batches requests for options by modifier group ID
         * Returns an array of options for each group (empty if none)
         * HIGH-014: Includes tenant verification via modifier group ownership
         */
        modifierOptions: new DataLoader<string, ModifierOption[]>(
            async (groupIds: readonly string[]) => {
                const options = await menuRepository.getModifierOptionsByGroupIds([...groupIds]);

                // Group by modifier_group_id with tenant verification
                const optionsByGroup = new Map<string, ModifierOption[]>();
                for (const option of options) {
                    const groupId = option.modifier_group_id as string;
                    // Verify the parent modifier group belongs to tenant
                    if (option.restaurant_id && option.restaurant_id !== restaurantId) {
                        continue; // Skip options from other tenants
                    }
                    const existing = optionsByGroup.get(groupId) || [];
                    existing.push(option);
                    optionsByGroup.set(groupId, existing);
                }

                return groupIds.map(id => optionsByGroup.get(id) || []);
            }
        ),

        /**
         * Order Items loader - batches requests for order items by order ID
         * Returns an array of order items for each order (empty if none)
         * HIGH-014: Includes tenant verification via order ownership
         */
        orderItems: new DataLoader<string, OrderItem[]>(async (orderIds: readonly string[]) => {
            const items = await ordersRepository.getItemsByOrderIds([...orderIds]);

            // Group by order_id with tenant verification
            const itemsByOrder = new Map<string, OrderItem[]>();
            for (const item of items) {
                // Verify the parent order belongs to tenant
                if (item.restaurant_id && item.restaurant_id !== restaurantId) {
                    continue; // Skip items from other tenants
                }
                const existing = itemsByOrder.get(item.order_id) || [];
                existing.push(item);
                itemsByOrder.set(item.order_id, existing);
            }

            return orderIds.map(id => itemsByOrder.get(id) || []);
        }),

        /**
         * Categories loader - batches requests for categories by ID
         * Returns the category or null if not found
         * HIGH-014: Includes tenant verification
         */
        categories: new DataLoader<string, Category | null>(async (ids: readonly string[]) => {
            const categories = await menuRepository.getCategoriesByIds([...ids]);
            return verifyTenantOwnership(categories as Category[], ids, cat => cat.id as string);
        }),

        /**
         * Single Modifier Group loader - batches requests for single modifier groups by ID
         * Returns the modifier group or null if not found (for federation reference resolution)
         * HIGH-014: Includes tenant verification
         */
        modifierGroup: new DataLoader<string, ModifierGroup | null>(
            async (ids: readonly string[]) => {
                const groups = await menuRepository.getModifierGroupsByIds([...ids]);
                return verifyTenantOwnership(
                    groups as ModifierGroup[],
                    ids,
                    group => group.id as string
                );
            }
        ),

        /**
         * Single Modifier Option loader - batches requests for single modifier options by ID
         * Returns the modifier option or null if not found (for federation reference resolution)
         * HIGH-014: Includes tenant verification
         */
        modifierOption: new DataLoader<string, ModifierOption | null>(
            async (ids: readonly string[]) => {
                const options = await menuRepository.getModifierOptionsByIds([...ids]);
                return verifyTenantOwnership(
                    options as ModifierOption[],
                    ids,
                    option => option.id as string
                );
            }
        ),
    };
}
