// Orders Domain - Resolvers Layer
// Thin layer — maps GraphQL fields to service calls
import { GraphQLError } from 'graphql';
import { ordersService, CreateOrderInput, UpdateOrderStatusInput } from './service';
import { GraphQLContext } from '@/lib/graphql/context';
import {
    requireAuth,
    requireRestaurantAccess,
    verifyTenantIsolation,
    AuthorizedContext,
} from '@/lib/graphql/authz';

const mapOrderStatus = (
    status: string
): 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled' => {
    const statusMap: Record<
        string,
        'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
    > = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PREPARING: 'preparing',
        READY: 'ready',
        SERVED: 'served',
        CANCELLED: 'cancelled',
    };
    return statusMap[status] || 'pending';
};

const _mapOrderType = (type: string): 'dine_in' | 'takeaway' | 'delivery' => {
    const typeMap: Record<string, 'dine_in' | 'takeaway' | 'delivery'> = {
        DINE_IN: 'dine_in',
        TAKEAWAY: 'takeaway',
        DELIVERY: 'delivery',
    };
    return typeMap[type] || 'dine_in';
};

/**
 * Maps an order from the service to the GraphQL response format
 */
const mapOrderToResponse = (order: {
    id: string;
    restaurant_id: string;
    table_number?: string | null;
    order_number?: string | null;
    status?: string | null;
    order_type?: string | null;
    total_price?: number | null;
    discount_amount?: number | null;
    notes?: string | null;
    guest_fingerprint?: string | null;
    idempotency_key?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}) => ({
    id: order.id,
    restaurantId: order.restaurant_id,
    tableId: order.table_number,
    orderNumber: order.order_number,
    status: (order.status ?? 'pending').toUpperCase(),
    type: (order.order_type ?? 'dine_in').toUpperCase(),
    totalPrice: order.total_price,
    discountAmount: order.discount_amount,
    notes: order.notes,
    guestId: order.guest_fingerprint,
    idempotencyKey: order.idempotency_key,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
});

export const ordersResolvers = {
    Query: {
        orders: async (
            _: unknown,
            args: {
                restaurantId: string;
                status?: string;
                tableId?: string;
                first?: number;
                after?: string;
            },
            context: GraphQLContext
        ) => {
            // Authorization: Verify user has access to this restaurant
            const authContext = await requireRestaurantAccess(context, args.restaurantId);

            const orders = await ordersService.getOrders(args.restaurantId, {
                status: args.status ? mapOrderStatus(args.status) : undefined,
                tableId: args.tableId,
                limit: args.first,
                offset: args.after ? parseInt(args.after, 10) : 0,
            });

            return {
                edges: orders.map(order => ({
                    cursor: Buffer.from(order.id).toString('base64'),
                    node: order,
                })),
                pageInfo: {
                    hasNextPage: orders.length === (args.first ?? 20),
                    hasPreviousPage: !!args.after,
                    startCursor: orders[0] ? Buffer.from(orders[0].id).toString('base64') : null,
                    endCursor: orders[orders.length - 1]
                        ? Buffer.from(orders[orders.length - 1].id).toString('base64')
                        : null,
                },
            };
        },

        order: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
            const authContext = requireAuth(context);
            const order = await ordersService.getOrder(args.id);

            // Verify tenant isolation - user can only access orders from their restaurant
            if (order && order.restaurant_id !== authContext.user.restaurantId) {
                throw new GraphQLError('Access denied to this order', {
                    extensions: { code: 'FORBIDDEN', http: { status: 403 } },
                });
            }

            return order;
        },

        activeOrders: async (
            _: unknown,
            args: { restaurantId: string },
            context: GraphQLContext
        ) => {
            // Authorization: Verify user has access to this restaurant
            await requireRestaurantAccess(context, args.restaurantId);
            return ordersService.getActiveOrders(args.restaurantId);
        },

        kdsOrders: async (
            _: unknown,
            args: { restaurantId: string; station: string },
            context: GraphQLContext
        ) => {
            // Authorization: Verify user has access to this restaurant
            await requireRestaurantAccess(context, args.restaurantId);
            return ordersService.getKDSOrders(args.restaurantId, args.station);
        },
    },

    Mutation: {
        createOrder: async (
            _: unknown,
            args: { input: CreateOrderInput },
            context: GraphQLContext
        ) => {
            try {
                // Verify user has access to the restaurant
                const authContext = await requireRestaurantAccess(context, args.input.restaurantId);

                const order = await ordersService.createOrder({
                    ...args.input,
                    staffId: authContext.user.id, // Use authenticated user's ID
                });

                return {
                    success: true,
                    order: mapOrderToResponse(order),
                    error: null,
                };
            } catch (error) {
                // Re-throw GraphQL errors (like authorization errors)
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    order: null,
                    error: {
                        code: 'CREATE_ORDER_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to create order',
                    },
                };
            }
        },

        updateOrderStatus: async (
            _: unknown,
            args: { input: UpdateOrderStatusInput },
            context: GraphQLContext
        ) => {
            try {
                const authContext = requireAuth(context);

                // First fetch the order to verify tenant isolation
                const existingOrder = await ordersService.getOrder(args.input.id);
                if (!existingOrder) {
                    return {
                        success: false,
                        order: null,
                        error: {
                            code: 'ORDER_NOT_FOUND',
                            message: 'Order not found',
                        },
                    };
                }

                // Verify tenant isolation
                verifyTenantIsolation(authContext, existingOrder.restaurant_id);

                const status = args.input.status ?? 'pending';
                const order = await ordersService.updateOrderStatus({
                    id: args.input.id,
                    status: mapOrderStatus(status),
                    staffId: authContext.user.id, // Use authenticated user's ID
                });

                return {
                    success: true,
                    order: mapOrderToResponse(order),
                    error: null,
                };
            } catch (error) {
                // Re-throw GraphQL errors (like authorization errors)
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    order: null,
                    error: {
                        code: 'UPDATE_ORDER_FAILED',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Failed to update order status',
                    },
                };
            }
        },

        cancelOrder: async (
            _: unknown,
            args: { id: string; reason?: string },
            context: GraphQLContext
        ) => {
            try {
                const authContext = requireAuth(context);

                // First fetch the order to verify tenant isolation
                const existingOrder = await ordersService.getOrder(args.id);
                if (!existingOrder) {
                    return {
                        success: false,
                        order: null,
                        error: {
                            code: 'ORDER_NOT_FOUND',
                            message: 'Order not found',
                        },
                    };
                }

                // Verify tenant isolation
                verifyTenantIsolation(authContext, existingOrder.restaurant_id);

                const order = await ordersService.cancelOrder({
                    id: args.id,
                    reason: args.reason,
                    staffId: authContext.user.id, // Use authenticated user's ID
                });

                return {
                    success: true,
                    order: mapOrderToResponse(order),
                    error: null,
                };
            } catch (error) {
                // Re-throw GraphQL errors (like authorization errors)
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    order: null,
                    error: {
                        code: 'CANCEL_ORDER_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to cancel order',
                    },
                };
            }
        },

        createGuestOrder: async (
            _: unknown,
            args: { input: CreateOrderInput & { guestSessionId: string } },
            context: GraphQLContext
        ) => {
            try {
                // Guest orders require restaurant access validation
                // The guest session should be validated separately
                const authContext = await requireRestaurantAccess(context, args.input.restaurantId);

                const order = await ordersService.createOrder({
                    ...args.input,
                    guestId: args.input.guestId || args.input.guestSessionId,
                    staffId: authContext.user.id, // Use authenticated user's ID
                });

                return {
                    success: true,
                    order: mapOrderToResponse(order),
                    error: null,
                };
            } catch (error) {
                // Re-throw GraphQL errors (like authorization errors)
                if (error instanceof GraphQLError) {
                    throw error;
                }
                return {
                    success: false,
                    order: null,
                    error: {
                        code: 'CREATE_GUEST_ORDER_FAILED',
                        message:
                            error instanceof Error ? error.message : 'Failed to create guest order',
                    },
                };
            }
        },
    },

    Order: {
        __resolveReference(reference: { id: string }, context: GraphQLContext) {
            // Note: For federation, we should also verify tenant isolation here
            // But __resolveReference doesn't have access to the parent context easily
            // This is a known limitation - tenant isolation should be verified at the gateway level
            return ordersService.getOrder(reference.id);
        },
        items: async (order: { id: string }) => {
            return ordersService.getOrderItems(order.id);
        },
    },

    OrderItem: {
        __resolveReference(_reference: { id: string }) {
            // Would fetch from repository
            return null;
        },
    },
};
