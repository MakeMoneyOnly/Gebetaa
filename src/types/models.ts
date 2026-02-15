import { Database } from './database';

export type UserRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'bill_requested';
export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'void';

export interface RestaurantTable {
    id: string;
    restaurant_id: string;
    table_number: string;
    status: TableStatus;
    qr_code_url: string | null;
    active_order_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface RestaurantStaff {
    id: string;
    user_id: string;
    restaurant_id: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    item_id: string;
    name: string;
    quantity: number;
    price: number;
    notes: string | null;
    modifiers: string[] | null; // Simplified JSONB for now
    station: 'kitchen' | 'bar';
    status: OrderItemStatus;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

// Augment the existing Database type if needed, or just specific table helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
