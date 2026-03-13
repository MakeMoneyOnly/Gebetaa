// Orders Domain - Service Layer
// Business logic — pure TypeScript, no framework coupling
import { ordersRepository, OrderRow, OrderItemRow } from './repository';
import { publishEvent } from '@/lib/events/publisher';

export interface CreateOrderInput {
    restaurantId: string;
    tableId?: string;
    type: 'dine_in' | 'takeaway' | 'delivery';
    items: {
        menuItemId: string;
        quantity: number;
        modifiers?: Record<string, unknown>;
        notes?: string;
    }[];
    notes?: string;
    idempotencyKey: string;
    staffId: string;
    guestId?: string;
}

export interface UpdateOrderStatusInput {
    id: string;
    status: OrderRow['status'];
    staffId: string;
}

export interface CancelOrderInput {
    id: string;
    reason?: string;
    staffId: string;
}

function generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `${dateStr}-${random}`;
}

function calculateItemTotal(
    unitPrice: number,
    quantity: number,
    modifiers?: Record<string, unknown>
): number {
    let total = unitPrice * quantity;

    // Add modifier price adjustments
    if (modifiers && typeof modifiers === 'object') {
        Object.values(modifiers).forEach((modifier: unknown) => {
            if (modifier && typeof modifier === 'object' && 'priceAdjustment' in modifier) {
                total += (modifier as { priceAdjustment: number }).priceAdjustment * quantity;
            }
        });
    }

    return total;
}

export class OrdersService {
    async createOrder(input: CreateOrderInput): Promise<OrderRow> {
        // Check for idempotency - prevent duplicate orders
        const existing = await ordersRepository.findByRestaurant(input.restaurantId, { limit: 1 });

        const idempotent = existing.find(o => o.idempotency_key === input.idempotencyKey);
        if (idempotent) {
            return idempotent;
        }

        // Calculate totals
        let totalPrice = 0;
        const orderItems = input.items.map(item => {
            // In production, fetch menu item price from database
            const unitPrice = 0; // Would be fetched from menu_items
            const itemTotal = calculateItemTotal(unitPrice, item.quantity, item.modifiers);
            totalPrice += itemTotal;

            return {
                restaurant_id: input.restaurantId,
                menu_item_id: item.menuItemId,
                quantity: item.quantity,
                unit_price: unitPrice,
                item_total: itemTotal,
                modifiers: item.modifiers,
                notes: item.notes,
            };
        });

        // Create order
        const order = await ordersRepository.create({
            restaurant_id: input.restaurantId,
            table_id: input.tableId,
            order_number: generateOrderNumber(),
            type: input.type,
            total_price: totalPrice,
            notes: input.notes,
            staff_id: input.staffId,
            guest_id: input.guestId,
            idempotency_key: input.idempotencyKey,
        });

        // Create order items
        await ordersRepository.createItems(
            orderItems.map(item => ({
                ...item,
                order_id: order.id,
            }))
        );

        // Publish order created event
        await publishEvent('order.created', {
            orderId: order.id,
            restaurantId: input.restaurantId,
            status: order.status,
        });

        return order;
    }

    async updateOrderStatus(input: UpdateOrderStatusInput): Promise<OrderRow> {
        const order = await ordersRepository.updateStatus(input.id, input.status);

        // Publish status changed event
        await publishEvent('order.status_changed', {
            orderId: order.id,
            restaurantId: order.restaurant_id,
            status: order.status,
            staffId: input.staffId,
        });

        // If order is completed, publish completed event
        if (order.status === 'served') {
            await publishEvent('order.completed', {
                orderId: order.id,
                restaurantId: order.restaurant_id,
                totalPrice: order.total_price,
            });
        }

        return order;
    }

    async cancelOrder(input: CancelOrderInput): Promise<OrderRow> {
        const order = await ordersRepository.cancel(input.id, input.reason);

        await publishEvent('order.cancelled', {
            orderId: order.id,
            restaurantId: order.restaurant_id,
            reason: input.reason,
            staffId: input.staffId,
        });

        return order;
    }

    async getOrder(id: string): Promise<OrderRow | null> {
        return ordersRepository.findById(id);
    }

    async getOrders(
        restaurantId: string,
        options: {
            status?: OrderRow['status'];
            tableId?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<OrderRow[]> {
        return ordersRepository.findByRestaurant(restaurantId, options);
    }

    async getActiveOrders(restaurantId: string): Promise<OrderRow[]> {
        return ordersRepository.findActiveByRestaurant(restaurantId);
    }

    async getKDSOrders(restaurantId: string, station: string): Promise<OrderRow[]> {
        return ordersRepository.findByKDSStation(restaurantId, station);
    }

    async getOrderItems(orderId: string): Promise<OrderItemRow[]> {
        return ordersRepository.getItems(orderId);
    }
}

export const ordersService = new OrdersService();
