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
        __resolveReference: async (reference: { id: string }, context: GraphQLContext) => {
            const menuItem = await menuRepository.getMenuItem(reference.id);

            // Validate tenant isolation
            if (menuItem && context.user?.restaurantId) {
                if (menuItem.restaurant_id !== context.user.restaurantId) {
                    console.error(
                        `Tenant isolation violation: User ${context.user.id} attempted to access menu item ${reference.id}`
                    );
                    return null;
                }
            }

            return menuItem;
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
        __resolveReference: async (_reference: { id: string }, _context: GraphQLContext) => {
            // Would need getCategory method
            // When implemented, should validate tenant isolation:
            // const category = await menuRepository.getCategory(_reference.id);
            // if (category && _context.user?.restaurantId) {
            //     if (category.restaurant_id !== _context.user.restaurantId) {
            //         console.error(`Tenant isolation violation: User ${_context.user.id} attempted to access category ${_reference.id}`);
            //         return null;
            //     }
            // }
            return null;
        },
        items: async (_category: Record<string, unknown>) => {
            // Would need getMenuItemsByCategory method
            return [];
        },
    },

    ModifierGroup: {
        __resolveReference: async (_reference: { id: string }, _context: GraphQLContext) => {
            // Would need getModifierGroup method
            // When implemented, should validate tenant isolation:
            // const modifierGroup = await menuRepository.getModifierGroup(_reference.id);
            // if (modifierGroup && _context.user?.restaurantId) {
            //     if (modifierGroup.restaurant_id !== _context.user.restaurantId) {
            //         console.error(`Tenant isolation violation: User ${_context.user.id} attempted to access modifier group ${_reference.id}`);
            //         return null;
            //     }
            // }
            return null;
        },
        options: async (group: Record<string, unknown>) => {
            const id = group.id as string;
            if (!id) return [];
            return menuRepository.getModifierOptions(id);
        },
    },

    ModifierOption: {
        __resolveReference: async (_reference: { id: string }, _context: GraphQLContext) => {
            // Would need getModifierOption method
            // When implemented, should validate tenant isolation via parent modifier group
            return null;
        },
    },
};
