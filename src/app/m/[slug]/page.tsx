'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { GuestHero } from '@/features/menu/components/GuestHero';
import { CategoryRail } from '@/features/menu/components/CategoryRail';
import { MenuCard } from '@/features/menu/components/MenuCard';
import { MenuSkeleton } from '@/features/menu/components/MenuSkeleton';
import { FloatingCart } from '@/features/menu/components/FloatingCart';
import { ServiceRequestButton } from '@/features/menu/components/ServiceRequestButton';
import { CartProvider, useCart } from '@/context/CartContext';

// Dynamically import drawer components with SSR disabled to prevent hydration errors
const DishDetailDrawer = dynamic(
    () => import('@/features/menu/components/DishDetailDrawer').then(mod => mod.DishDetailDrawer),
    { ssr: false }
);
const CartDrawer = dynamic(
    () => import('@/features/menu/components/CartDrawer').then(mod => mod.CartDrawer),
    { ssr: false }
);

// Simplified Inner Component to consume Context
function MenuContent() {
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { addToCart, count } = useCart(); // Use global cart

    const MOCK_ITEMS = [
        {
            id: '1',
            title: 'Spicy Tonkotsu',
            price: 450,
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=962&auto=format&fit=crop',
            rating: 4.8,
            shopName: 'Ramen Lord'
        },
        {
            id: '2',
            title: 'Neon Tacos',
            price: 280,
            imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=960&auto=format&fit=crop',
            rating: 4.5,
            shopName: 'Loco Chino'
        },
        {
            id: '3',
            title: 'Double Smash',
            price: 380,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop',
            rating: 4.9,
            shopName: 'Burger Joint'
        },
        {
            id: '4',
            title: 'Salmon Poke',
            price: 520,
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
            rating: 4.7,
            shopName: 'Aloha Bowl'
        },
        {
            id: '5',
            title: 'Glazed Pop',
            price: 150,
            imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop',
            rating: 4.6,
            shopName: 'Dough & Co.'
        },
        {
            id: '6',
            title: 'Truffle Pasta',
            price: 650,
            imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1000&auto=format&fit=crop',
            rating: 4.8,
            shopName: 'Nonna\'s'
        }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        async function keepScreenOn() {
            try {
                if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                    await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                // Ignore harmless errors, typical in dev/background tabs
                console.log('Wake Lock skipped:', err);
            }
        }

        keepScreenOn();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                keepScreenOn();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleAddToCart = (item: any, quantity = 1) => {
        addToCart({
            menuItemId: item.id,
            title: item.title,
            price: item.price,
            quantity: quantity,
            image: item.imageUrl
        });
        setSelectedItem(null);
    };

    if (loading) {
        return (
            <main className="app-container bg-surface-0 pb-safe">
                <GuestHero />
                <CategoryRail />
                <MenuSkeleton />
            </main>
        );
    }

    return (
        <main className="app-container bg-surface-0 pb-safe">
            <div className="w-full relative">
                <GuestHero />
                <CategoryRail />

                <div className="px-4 pb-20">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-2xl font-black text-black no-select">Near You</h2>
                        <button className="text-sm font-semibold hover:text-brand-crimson transition-all active:scale-95 touch-manipulation">
                            View All
                        </button>
                    </div>

                    <div className="flex gap-3">
                        {/* Left Column */}
                        <div className="flex-1">
                            {MOCK_ITEMS.filter((_, i) => i % 2 === 0).map((item) => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setSelectedItem(item)}
                                    // Pass selected item to add handler
                                    onAdd={() => handleAddToCart(item)}
                                />
                            ))}
                        </div>
                        {/* Right Column */}
                        <div className="flex-1 pt-6">
                            {MOCK_ITEMS.filter((_, i) => i % 2 === 1).map((item) => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setSelectedItem(item)}
                                    onAdd={() => handleAddToCart(item)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <DishDetailDrawer
                open={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
                item={selectedItem}
                onAddToCart={(qty) => handleAddToCart(selectedItem, qty)}
            />

            <CartDrawer
                open={cartOpen}
                onOpenChange={setCartOpen}
            />

            <FloatingCart count={count} onClick={() => setCartOpen(true)} />
            <ServiceRequestButton />
        </main>
    );
}

export default function DynamicMenuPage({ params }: { params: { slug: string } }) {
    return (
        <CartProvider>
            <MenuContent />
        </CartProvider>
    );
}
