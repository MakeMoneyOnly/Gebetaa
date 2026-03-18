// Menu Domain - Resolvers Layer
// Thin layer — maps GraphQL fields to repository calls

import { GraphQLError } from 'graphql';
import { menuRepository } from './repository';
import { GraphQLContext } from '@/lib/graphql/context';
import { requireAuth, requireRestaurantAccess, verifyTenantIsolation } from '@/lib/graphql/authz';

export const menuResolvers = {
    Query: {
        menuItems: async (
            _: unknown,
            args: {
                restaurantId: string;
                categoryId?: string;
                availableOnly?: boolean;
            },
            context: GraphQLContext
        ) => {
            // Authorization: Verify user has access to this restaurant
            await requireRestaurantAccess(context, args.restaurantId);

            return menuRepository.getMenuItems(args.restaurantId, {
                categoryId: args.categoryId,
                availableOnly: args.availableOnly,
            });
        },

        menuItem: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
            const authContext = requireAuth(context);
            const menuItem = await menuRepository.getMenuItem(args.id);

            // Verify tenant isolation - user can only access menu items from their restaurant
            if (menuItem && menuItem.restaurant_id !== authContext.user.restaurantId) {
                throw new GraphQLError('Access denied to this menu item', {
                    extensions: { code: 'FORBIDDEN', http: { status: 403 } },
                });
            }

            return menuItem;
        },

        categories: async (_: unknown, args: { restaurantId: string }, context: GraphQLContext) => {
            // Authorization: Verify user has access to this restaurant
            await requireRestaurantAccess(context, args.restaurantId);

            return menuRepository.getMenuCategories(args.restaurantId);
        },

        category: async (_: unknown, args: { id: string }, _context: GraphQLContext) => {
            // For now, return null - would need a getCategory method
            // This is a placeholder for federation reference resolution
            console.log('[menu/resolvers] category query called with id:', args.id);
            return null;
        },

        searchMenu: async (
            _: unknown,
            args: { restaurantId: string; query: string },
            context: GraphQLContext
        ) => {
            // Authorization: Verify user has access to this restaurant
            await requireRestaurantAccess(context, args.restaurantId);

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
        createMenuItem: async (
            _: unknown,
            args: { input: { restaurantId: string; [key: string]: unknown } },
            context: GraphQLContext
        ) => {
            try {
                // Authorization: Verify user has access to this restaurant
                await requireRestaurantAccess(context, args.input.restaurantId);

                // Mutation not implemented in repository yet
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'NOT_IMPLEMENTED',
                        message: 'createMenuItem mutation not implemented',
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error instanceof Error ? error.message : 'Internal error',
                    },
                };
            }
        },

        updateMenuItem: async (
            _: unknown,
            args: { id: string; input: Record<string, unknown> },
            context: GraphQLContext
        ) => {
            try {
                const authContext = requireAuth(context);

                // Fetch the menu item to verify tenant isolation
                const existingItem = await menuRepository.getMenuItem(args.id);
                if (!existingItem) {
                    return {
                        success: false,
                        menuItem: null,
                        error: {
                            code: 'MENU_ITEM_NOT_FOUND',
                            message: 'Menu item not found',
                        },
                    };
                }

                // Verify tenant isolation
                verifyTenantIsolation(authContext, existingItem.restaurant_id as string);

                // Mutation not implemented in repository yet
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'NOT_IMPLEMENTED',
                        message: 'updateMenuItem mutation not implemented',
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error instanceof Error ? error.message : 'Internal error',
                    },
                };
            }
        },

        markItemAvailability: async (
            _: unknown,
            args: { id: string; available: boolean },
            context: GraphQLContext
        ) => {
            try {
                const authContext = requireAuth(context);

                // Fetch the menu item to verify tenant isolation
                const existingItem = await menuRepository.getMenuItem(args.id);
                if (!existingItem) {
                    return {
                        success: false,
                        menuItem: null,
                        error: {
                            code: 'MENU_ITEM_NOT_FOUND',
                            message: 'Menu item not found',
                        },
                    };
                }

                // Verify tenant isolation
                verifyTenantIsolation(authContext, existingItem.restaurant_id as string);

                // Mutation not implemented in repository yet
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'NOT_IMPLEMENTED',
                        message: 'markItemAvailability mutation not implemented',
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error instanceof Error ? error.message : 'Internal error',
                    },
                };
            }
        },

        updateMenuItemPrice: async (
            _: unknown,
            args: { id: string; price: number },
            context: GraphQLContext
        ) => {
            try {
                const authContext = requireAuth(context);

                // Fetch the menu item to verify tenant isolation
                const existingItem = await menuRepository.getMenuItem(args.id);
                if (!existingItem) {
                    return {
                        success: false,
                        menuItem: null,
                        error: {
                            code: 'MENU_ITEM_NOT_FOUND',
                            message: 'Menu item not found',
                        },
                    };
                }

                // Verify tenant isolation
                verifyTenantIsolation(authContext, existingItem.restaurant_id as string);

                // Mutation not implemented in repository yet
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'NOT_IMPLEMENTED',
                        message: 'updateMenuItemPrice mutation not implemented',
                    },
                };
            } catch (error) {
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    menuItem: null,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error instanceof Error ? error.message : 'Internal error',
                    },
                };
            }
        },
    },

    MenuItem: {
        __resolveReference(reference: { id: string }, _context: GraphQLContext) {
            // Note: For federation, tenant isolation should be verified at the gateway level
            // or the reference should include restaurant context
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
