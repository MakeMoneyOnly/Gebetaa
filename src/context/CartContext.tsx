'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem } from '@/types/database';

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateNotes: (id: string, notes: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    tableNumber: string | null;
    setTableNumber: (table: string | null) => void;
    restaurantId: string | null;
    setRestaurantId: (id: string | null) => void;
    restaurantSlug: string | null;
    setRestaurantSlug: (slug: string | null) => void;
    orderHistory: CartItem[];
    addToHistory: (items: CartItem[]) => void;
    clearHistory: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
    children,
    initialTableNumber,
    initialRestaurantSlug,
    initialRestaurantId
}: {
    children: ReactNode;
    initialTableNumber?: string | null;
    initialRestaurantSlug?: string | null;
    initialRestaurantId?: string | null;
}) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [tableNumber, setTableNumber] = useState<string | null>(initialTableNumber || null);
    const [restaurantId, setRestaurantId] = useState<string | null>(initialRestaurantId || null);
    const [restaurantSlug, setRestaurantSlug] = useState<string | null>(initialRestaurantSlug || null);
    const [orderHistory, setOrderHistory] = useState<CartItem[]>([]);

    // Load cart and history from localStorage on mount
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart);
                // Only restore cart if same restaurant
                if (parsed.restaurantSlug === restaurantSlug) {
                    setItems(parsed.items || []);
                }
            } catch (e) {
                console.error('Failed to parse cart:', e);
            }
        }

        const storedHistory = localStorage.getItem('orderHistory');
        if (storedHistory) {
            try {
                const parsed = JSON.parse(storedHistory);
                if (parsed.restaurantSlug === restaurantSlug) {
                    setOrderHistory(parsed.items || []);
                }
            } catch (e) {
                console.error('Failed to parse history:', e);
            }
        }
    }, [restaurantSlug]);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify({
            items,
            restaurantSlug,
            tableNumber,
        }));
    }, [items, restaurantSlug, tableNumber]);

    // Save history to localStorage
    useEffect(() => {
        localStorage.setItem('orderHistory', JSON.stringify({
            items: orderHistory,
            restaurantSlug
        }));
    }, [orderHistory, restaurantSlug]);

    const addItem = (item: CartItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i =>
                    i.id === item.id
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }
            return [...prev, item];
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, quantity } : i
        ));
    };

    const updateNotes = (id: string, notes: string) => {
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, notes } : i
        ));
    };

    const clearCart = () => {
        setItems([]);
    };

    const addToHistory = (newItems: CartItem[]) => {
        setOrderHistory(prev => {
            // we might want to merge quantities if same item ordered again, or keep separate "orders".
            // For reviews, we just want to know *what* they ordered. 
            // Let's just append for now, duplicates are fine (handled in UI).
            return [...prev, ...newItems];
        });
    };

    const clearHistory = () => {
        setOrderHistory([]);
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            updateNotes,
            clearCart,
            totalItems,
            totalPrice,
            tableNumber,
            setTableNumber,
            restaurantId,
            setRestaurantId,
            restaurantSlug,
            setRestaurantSlug,
            orderHistory,
            addToHistory,
            clearHistory,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
