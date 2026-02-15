'use client';

import React, { useEffect, useState } from 'react';
import { GuestHero } from '@/features/menu/components/GuestHero';
import { CategoryRail } from '@/features/menu/components/CategoryRail';
import { MenuCard } from '@/features/menu/components/MenuCard';
import { FOOD_ITEMS } from '@/lib/constants';
import { DishDetailDrawer, DishItem } from '@/features/menu/components/DishDetailDrawer';

// Map FOOD_ITEMS to match DishDetailDrawer/MenuCard expectations
const MOCK_ITEMS: DishItem[] = FOOD_ITEMS.map(item => ({
    id: item.id,
    title: item.title,
    name: item.title, // Map title to name
    price: item.price,
    imageUrl: item.imageUrl,
    rating: item.rating,
    shopName: item.shop,
    categories: {
        name: item.category,
        section: 'food' // default fallback
    },
    // Optional fields
    description: "Delicious food item",
    description_am: "ጣፋጭ ምግብ",
    ingredients: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
}));

export default function MenuPage() {
    const [selectedItem, setSelectedItem] = useState<DishItem | null>(null);
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
                        <h2 className="no-select text-2xl font-black text-white">Near You</h2>
                        <button className="hover:text-brand-crimson touch-manipulation text-sm font-semibold text-white/60 transition-all active:scale-95">
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
