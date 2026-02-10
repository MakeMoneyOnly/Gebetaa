'use client';

import React, { useEffect } from 'react';
import { GuestHero } from '@/features/menu/components/GuestHero';
import { CategoryRail } from '@/features/menu/components/CategoryRail';
import { MenuCard } from '@/features/menu/components/MenuCard';

const MOCK_ITEMS = [
    {
        id: '1',
        title: 'Spicy Tonkotsu',
        price: 450,
        imageUrl:
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=962&auto=format&fit=crop',
        rating: 4.8,
        shopName: 'Ramen Lord',
    },
    {
        id: '2',
        title: 'Neon Tacos',
        price: 280,
        imageUrl:
            'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=960&auto=format&fit=crop',
        rating: 4.5,
        shopName: 'Loco Chino',
    },
    {
        id: '3',
        title: 'Double Smash',
        price: 380,
        imageUrl:
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=999&auto=format&fit=crop',
        rating: 4.9,
        shopName: 'Burger Joint',
    },
    {
        id: '4',
        title: 'Salmon Poke',
        price: 520,
        imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
        rating: 4.7,
        shopName: 'Aloha Bowl',
    },
    {
        id: '5',
        title: 'Glazed Pop',
        price: 150,
        imageUrl:
            'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop',
        rating: 4.6,
        shopName: 'Dough & Co.',
    },
    {
        id: '6',
        title: 'Truffle Pasta',
        price: 650,
        imageUrl:
            'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1000&auto=format&fit=crop',
        rating: 4.8,
        shopName: "Nonna's",
    },
];

import { DishDetailDrawer } from '@/features/menu/components/DishDetailDrawer';
import { useState } from 'react';

interface MenuItem {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
}

export default function MenuPage() {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        async function keepScreenOn() {
            try {
                if ('wakeLock' in navigator) {
                    await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                console.error('Wake Lock error:', err);
            }
        }
        keepScreenOn();
    }, []);

    return (
        <main className="app-container bg-surface-0 pb-safe">
            <div className="relative w-full">
                <GuestHero activeTab={activeTab} onTabChange={setActiveTab} />

                <CategoryRail
                    activeTab={activeTab}
                    activeCategoryId={activeCategory}
                    onCategoryChange={setActiveCategory}
                />

                <div className="px-4 pb-20">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h2 className="no-select text-2xl font-black text-black">Near You</h2>
                        <button className="hover:text-brand-crimson touch-manipulation text-sm font-semibold transition-all active:scale-95">
                            View All
                        </button>
                    </div>

                    {/* Masonry-style Layout from Reference Feed.tsx */}
                    <div className="flex gap-3">
                        {/* Left Column */}
                        <div className="flex-1">
                            {MOCK_ITEMS.filter((_, i) => i % 2 === 0).map(item => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setSelectedItem(item)}
                                />
                            ))}
                        </div>
                        {/* Right Column */}
                        <div className="flex-1 pt-6">
                            {MOCK_ITEMS.filter((_, i) => i % 2 === 1).map(item => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setSelectedItem(item)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <DishDetailDrawer
                open={!!selectedItem}
                onOpenChange={open => !open && setSelectedItem(null)}
                item={selectedItem}
            />
        </main>
    );
}
