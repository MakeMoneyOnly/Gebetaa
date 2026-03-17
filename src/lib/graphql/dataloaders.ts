/**
 * DataLoader Factory for GraphQL N+1 Query Prevention
 * CRITICAL-001: Batch and cache database queries to prevent N+1 problems
 *
 * DataLoaders are created per-request to prevent cache leakage between requests.
 * Each loader batches multiple requests for the same resource type and resolves
 * them in a single database query.
 */

import DataLoader from 'dataloader';
import { menuRepository } from '@/domains/menu/repository';
import { ordersRepository, OrderItemRow } from '@/domains/orders/repository';

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
}

/**
 * Create a new set of DataLoaders for a GraphQL request
 *
 * IMPORTANT: This must be called per-request (not shared across requests)
 * to prevent cache leakage and ensure proper batching within a single request.
 *
 * @returns DataLoaders object containing all batch loaders
 */
export function createDataLoaders(): DataLoaders {
    return {
        /**
         * Menu Items loader - batches requests for menu items by ID
         * Returns the menu item or null if not found
         */
        menuItems: new DataLoader<string, MenuItem | null>(async (ids: readonly string[]) => {
            const items = await menuRepository.getMenuItemsByIds([...ids]);
            const itemMap = new Map(items.map((item) => [item.id as string, item]));
            return ids.map((id) => itemMap.get(id) || null);
        }),

        /**
         * Modifier Groups loader - batches requests for modifier groups by menu item ID
         * Returns an array of modifier groups for each menu item (empty if none)
         */
        modifierGroups: new DataLoader<string, ModifierGroup[]>(async (menuItemIds: readonly string[]) => {
            const groups = await menuRepository.getModifierGroupsByMenuItemIds([...menuItemIds]);

            // Group by menu_item_id
            const groupsByMenuItem = new Map<string, ModifierGroup[]>();
            for (const group of groups) {
                const menuItemId = group.menu_item_id as string;
                const existing = groupsByMenuItem.get(menuItemId) || [];
                existing.push(group);
                groupsByMenuItem.set(menuItemId, existing);
            }

            return menuItemIds.map((id) => groupsByMenuItem.get(id) || []);
        }),

        /**
         * Modifier Options loader - batches requests for options by modifier group ID
         * Returns an array of options for each group (empty if none)
         */
        modifierOptions: new DataLoader<string, ModifierOption[]>(async (groupIds: readonly string[]) => {
            const options = await menuRepository.getModifierOptionsByGroupIds([...groupIds]);

            // Group by modifier_group_id
            const optionsByGroup = new Map<string, ModifierOption[]>();
            for (const option of options) {
                const groupId = option.modifier_group_id as string;
                const existing = optionsByGroup.get(groupId) || [];
                existing.push(option);
                optionsByGroup.set(groupId, existing);
            }

            return groupIds.map((id) => optionsByGroup.get(id) || []);
        }),

        /**
         * Order Items loader - batches requests for order items by order ID
         * Returns an array of order items for each order (empty if none)
         */
        orderItems: new DataLoader<string, OrderItem[]>(async (orderIds: readonly string[]) => {
            const items = await ordersRepository.getItemsByOrderIds([...orderIds]);

            // Group by order_id
            const itemsByOrder = new Map<string, OrderItem[]>();
            for (const item of items) {
                const existing = itemsByOrder.get(item.order_id) || [];
                existing.push(item);
                itemsByOrder.set(item.order_id, existing);
            }

            return orderIds.map((id) => itemsByOrder.get(id) || []);
        }),

        /**
         * Categories loader - batches requests for categories by ID
         * Returns the category or null if not found
         */
        categories: new DataLoader<string, Category | null>(async (ids: readonly string[]) => {
            const categories = await menuRepository.getCategoriesByIds([...ids]);
            const categoryMap = new Map(categories.map((cat) => [cat.id as string, cat]));
            return ids.map((id) => categoryMap.get(id) || null);
        }),
    };
}
