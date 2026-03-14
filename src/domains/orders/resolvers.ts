// Orders Domain - Resolvers Layer
// Thin layer — maps GraphQL fields to service calls
import { ordersService, CreateOrderInput, UpdateOrderStatusInput } from './service';

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
            }
        ) => {
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

        order: async (_: unknown, args: { id: string }) => {
            return ordersService.getOrder(args.id);
        },

        activeOrders: async (_: unknown, args: { restaurantId: string }) => {
            return ordersService.getActiveOrders(args.restaurantId);
        },

        kdsOrders: async (_: unknown, args: { restaurantId: string; station: string }) => {
            return ordersService.getKDSOrders(args.restaurantId, args.station);
        },
    },

    Mutation: {
        createOrder: async (_: unknown, args: { input: CreateOrderInput }) => {
            try {
                // In production, staffId would come from JWT context
                const order = await ordersService.createOrder({
                    ...args.input,
                    staffId: 'staff-id-from-jwt', // TODO: Get from context
                });

                return {
                    success: true,
                    order: {
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
                    },
                    error: null,
                };
            } catch (error) {
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

        updateOrderStatus: async (_: unknown, args: { input: UpdateOrderStatusInput }) => {
            try {
                const status = args.input.status ?? 'pending';
                const order = await ordersService.updateOrderStatus({
                    id: args.input.id,
                    status: mapOrderStatus(status),
                    staffId: 'staff-id-from-jwt', // TODO: Get from context
                });

                return {
                    success: true,
                    order: {
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
                    },
                    error: null,
                };
            } catch (error) {
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

        cancelOrder: async (_: unknown, args: { id: string; reason?: string }) => {
            try {
                const order = await ordersService.cancelOrder({
                    id: args.id,
                    reason: args.reason,
                    staffId: 'staff-id-from-jwt', // TODO: Get from context
                });

                return {
                    success: true,
                    order: {
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
                    },
                    error: null,
                };
            } catch (error) {
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
            args: { input: CreateOrderInput & { guestSessionId: string } }
        ) => {
            // Guest orders are similar to regular orders but with guest session
            try {
                const order = await ordersService.createOrder({
                    ...args.input,
                    guestId: args.input.guestId || args.input.guestSessionId,
                    staffId: 'guest-session', // Guests don't have staff IDs
                });

                return {
                    success: true,
                    order: {
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
                    },
                    error: null,
                };
            } catch (error) {
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
        __resolveReference(reference: { id: string }) {
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
