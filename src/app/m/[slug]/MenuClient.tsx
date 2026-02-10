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

interface MenuItem {
    id: string;
    name: string;
    title: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
    categories: {
        name: string;
        section: string;
    };
    preparationTime?: number;
}

interface RawMenuItem {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    rating?: number;
    preparation_time?: number;
    categories: {
        name: string;
        section: string;
    }[];
}

// Simplified Inner Component to consume Context
function MenuContent() {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
    const [activeCategory, setActiveCategory] = useState('all');
    const [realItems, setRealItems] = useState<MenuItem[]>([]);
    const { addToCart, count } = useCart(); // Use global cart

    useEffect(() => {
        async function fetchMenu() {
            setLoading(true);
            const supabase = createClient();

            try {
                // Fetch items with explicit columns to avoid ambiguous naming
                const { data, error } = await supabase
                    .from('menu_items')
                    .select(
                        `
                        id,
                        name,
                        price,
                        image_url,
                        rating,
                        preparation_time,
                        categories!inner (
                            name,
                            section
                        )
                    `
                    )
                    .eq('is_available', true);

                if (error) {
                    console.error('Error fetching menu:', error);
                    return;
                }

                // Helper to handle both external URLs and Supabase Storage paths
                const getSmartImageUrl = (path: string | null) => {
                    if (!path) return 'https://via.placeholder.com/150';
                    if (path.startsWith('http') || path.startsWith('fab')) return path;

                    // Use correct bucket name 'menu-images'
                    const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
                    return data.publicUrl;
                };

                const CATEGORY_MAP: Record<string, string> = {
                    burgers: 'Burger',
                    burger: 'Burger',
                    pizza: 'Pizza',
                    traditional: 'Traditional',
                    vegan: 'Vegan',
                    desert: 'Desert',
                    dessert: 'Desert',
                    'main dishes': 'Traditional',
                    pasta: 'Pizza',
                    'gourmet pizza': 'Pizza',
                    'premium grill': 'Traditional',
                    sides: 'Burger',
                    breakfast: 'Traditional',
                    bakery: 'Desert',

                    // Drinks
                    'hot drinks': 'Hot Drinks',
                    'soft drinks': 'Soft Drinks',
                    beer: 'Beer',
                    beers: 'Beer',
                    alcohol: 'Beer',
                    juice: 'Juice',
                    'fresh juices': 'Juice',
                    wine: 'Wine',
                    cocktails: 'Wine', // Map to closest alcoholic category if not separating
                    'craft cocktails': 'Wine',
                    spirits: 'Wine',
                    tea: 'Hot Drinks',
                    coffee: 'Hot Drinks',
                };

                const formattedItems = ((data as RawMenuItem[]) || []).map(
                    (item: RawMenuItem): MenuItem => ({
                        id: item.id,
                        name: item.name,
                        title: item.name,
                        imageUrl: getSmartImageUrl(item.image_url),
                        preparationTime: item.preparation_time || 15,
                        shopName:
                            CATEGORY_MAP[item.categories[0]?.name?.toLowerCase()] || 'Saba Grill',
                        price: Number(item.price),
                        rating: item.rating,
                        categories: item.categories[0],
                    })
                );
                setRealItems(formattedItems);
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchMenu();
    }, []);

    const filteredItems = realItems.filter(item => {
        const matchesSection = item.categories.section === activeTab;
        if (!matchesSection) return false;

        if (activeCategory === 'all') return true;

        // Match category name (case-insensitive)
        return item.categories.name.toLowerCase() === activeCategory.toLowerCase();
    });

    const handleAddToCart = (item: MenuItem, quantity = 1) => {
        addToCart({
            menuItemId: item.id,
            title: item.title,
            price: item.price,
            image: item.imageUrl,
            quantity: quantity,
        });
    };

    if (loading) {
        return (
            <main className="app-container bg-surface-0 pb-safe">
                <GuestHero activeTab={activeTab} onTabChange={setActiveTab} />
                <CategoryRail
                    activeTab={activeTab}
                    activeCategoryId={activeCategory}
                    onCategoryChange={setActiveCategory}
                />
                <MenuSkeleton />
            </main>
        );
    }

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
                        <h2 className="no-select font-manrope text-2xl font-black tracking-tighter text-black">
                            Main Menu
                        </h2>
                        <button className="text-brand-crimson font-manrope text-sm font-bold">
                            View All
                        </button>
                    </div>

                    <div className="flex gap-4">
                        {/* Left Column */}
                        <div className="flex-1">
                            {filteredItems
                                .filter((_, i) => i % 2 === 0)
                                .map(item => (
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
                            {filteredItems
                                .filter((_, i) => i % 2 === 1)
                                .map(item => (
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
                onOpenChange={open => !open && setSelectedItem(null)}
                item={selectedItem}
                onAddToCart={qty => selectedItem && handleAddToCart(selectedItem, qty)}
            />

            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

            <FloatingCart count={count} onClick={() => setCartOpen(true)} />
            <ServiceRequestButton />
        </main>
    );
}

export default function MenuClient() {
    return (
        <CartProvider>
            <MenuContent />
        </CartProvider>
    );
}
