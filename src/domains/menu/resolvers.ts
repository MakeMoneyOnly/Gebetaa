// Menu Domain - Resolvers Layer
// Thin layer — maps GraphQL fields to repository calls

import { menuRepository } from './repository';

export const menuResolvers = {
    Query: {
        menuItems: async (
            _: unknown,
            args: {
                restaurantId: string;
                categoryId?: string;
                availableOnly?: boolean;
            }
        ) => {
            return menuRepository.getMenuItems(args.restaurantId, {
                categoryId: args.categoryId,
                availableOnly: args.availableOnly,
            });
        },

        menuItem: async (_: unknown, args: { id: string }) => {
            return menuRepository.getMenuItem(args.id);
        },

        categories: async (_: unknown, args: { restaurantId: string }) => {
            return menuRepository.getMenuCategories(args.restaurantId);
        },

        category: async (_: unknown, args: { id: string }) => {
            // For now, return null - would need a getCategory method
            // This is a placeholder for federation reference resolution
            console.log('[menu/resolvers] category query called with id:', args.id);
            return null;
        },

        searchMenu: async (_: unknown, args: { restaurantId: string; query: string }) => {
            // Use getMenuItems with client-side filtering for now
            // In production, this would use full-text search
            const items = await menuRepository.getMenuItems(args.restaurantId);
            const lowerQuery = args.query.toLowerCase();
            return items.filter(
                (item: Record<string, unknown>) =>
                    (item.name as string)?.toLowerCase().includes(lowerQuery) ||
                    (item.name_am as string)?.toLowerCase().includes(lowerQuery)
            );
        },
    },

    Mutation: {
        createMenuItem: async (_: unknown, _args: { input: Record<string, unknown> }) => {
            // Mutation not implemented in repository yet
            return {
                success: false,
                menuItem: null,
                error: {
                    code: 'NOT_IMPLEMENTED',
                    message: 'createMenuItem mutation not implemented',
                },
            };
        },

        updateMenuItem: async (
            _: unknown,
            _args: { id: string; input: Record<string, unknown> }
        ) => {
            // Mutation not implemented in repository yet
            return {
                success: false,
                menuItem: null,
                error: {
                    code: 'NOT_IMPLEMENTED',
                    message: 'updateMenuItem mutation not implemented',
                },
            };
        },

        markItemAvailability: async (_: unknown, _args: { id: string; available: boolean }) => {
            // Mutation not implemented in repository yet
            return {
                success: false,
                menuItem: null,
                error: {
                    code: 'NOT_IMPLEMENTED',
                    message: 'markItemAvailability mutation not implemented',
                },
            };
        },

        updateMenuItemPrice: async (_: unknown, _args: { id: string; price: number }) => {
            // Mutation not implemented in repository yet
            return {
                success: false,
                menuItem: null,
                error: {
                    code: 'NOT_IMPLEMENTED',
                    message: 'updateMenuItemPrice mutation not implemented',
                },
            };
        },
    },

    MenuItem: {
        __resolveReference(reference: { id: string }) {
            return menuRepository.getMenuItem(reference.id);
        },
        category: async (_menuItem: Record<string, unknown>) => {
            // Category resolution would need getCategory method
            return null;
        },
        modifierGroups: async (menuItem: Record<string, unknown>) => {
            const id = menuItem.id as string;
            if (!id) return [];
            return menuRepository.getModifierGroups(id);
        },
    },

    Category: {
        __resolveReference(_reference: { id: string }) {
            // Would need getCategory method
            return null;
        },
        items: async (_category: Record<string, unknown>) => {
            // Would need getMenuItemsByCategory method
            return [];
        },
    },

    ModifierGroup: {
        __resolveReference(_reference: { id: string }) {
            // Would need getModifierGroup method
            return null;
        },
        options: async (group: Record<string, unknown>) => {
            const id = group.id as string;
            if (!id) return [];
            return menuRepository.getModifierOptions(id);
        },
    },

    ModifierOption: {
        __resolveReference(_reference: { id: string }) {
            // Would need getModifierOption method
            return null;
        },
    },
};
