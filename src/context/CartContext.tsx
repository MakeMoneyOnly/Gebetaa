'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useHaptic } from '@/hooks/useHaptic';

export interface CartItem {
    menuItemId: string; // The ID from the database
    uniqueId: string; // Random ID for cart management (handling variants)
    title: string;
    price: number;
    quantity: number;
    instructions?: string;
    image?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'uniqueId'>) => void;
    removeFromCart: (uniqueId: string) => void;
    updateQuantity: (uniqueId: string, delta: number) => void;
    updateInstructions: (uniqueId: string, instructions: string) => void;
    clearCart: () => void;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const { trigger } = useHaptic();

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('gebeta-cart');
        if (savedCart) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('gebeta-cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, 'uniqueId'>) => {
        trigger('success');
        setItems((prev) => {
            // Check if exact item already exists (same ID and instructions)
            const existingIndex = prev.findIndex(
                (item) =>
                    item.menuItemId === newItem.menuItemId &&
                    item.instructions === newItem.instructions
            );

            if (existingIndex >= 0) {
                // Update quantity
                const updated = [...prev];
                updated[existingIndex].quantity += newItem.quantity;
                return updated;
            }

            // Add new item
            return [...prev, { ...newItem, uniqueId: crypto.randomUUID() }];
        });
    };

    const removeFromCart = (uniqueId: string) => {
        trigger('medium');
        setItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const updateQuantity = (uniqueId: string, delta: number) => {
        trigger('soft');
        setItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId === uniqueId) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter((item) => item.quantity > 0)
        );
    };

    const updateInstructions = (uniqueId: string, instructions: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.uniqueId === uniqueId ? { ...item, instructions } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('gebeta-cart');
    };

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const count = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                updateInstructions,
                clearCart,
                total,
                count,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
