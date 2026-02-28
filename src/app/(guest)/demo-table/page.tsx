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
import { FOOD_ITEMS } from '@/lib/constants';
import type { DishItem } from '@/features/menu/components/DishDetailDrawer';

const DishDetailDrawer = dynamic(
    () => import('@/features/menu/components/DishDetailDrawer').then(mod => mod.DishDetailDrawer),
    { ssr: false }
);
const CartDrawer = dynamic(
    () => import('@/features/menu/components/CartDrawer').then(mod => mod.CartDrawer),
    { ssr: false }
);

type MenuItem = DishItem;
const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/150';
const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
    'via.placeholder.com',
    'axuegixbqsvztdraenkz.supabase.co',
]);

function tryParseHttpsUrl(value: string): URL | null {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' ? parsed : null;
    } catch {
        return null;
    }
}

function isAllowedRemoteImageUrl(value: string): boolean {
    const parsed = tryParseHttpsUrl(value);
    if (!parsed) return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_REMOTE_IMAGE_HOSTS.has(hostname) || hostname.endsWith('.supabase.co');
}

interface RawCategory {
    id: string;
    name: string;
    section: 'food' | 'drinks';
}

interface RawMenuItem {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    rating: number | null;
    preparation_time: number | null;
    description: string | null;
    description_am: string | null;
    popularity: number | null;
    likes_count: number | null;
    category_id: string;
}

// Demo context for bypassing QR validation
const DEMO_CONTEXT = {
    restaurant_id: 'demo-restaurant',
    table: '1',
    slug: 'demo-table',
    sig: '0'.repeat(64),
    exp: Date.now() + 86400000, // 24 hours from now (in milliseconds)
};

function DemoMenuContent() {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const [realItems, setRealItems] = useState<MenuItem[]>([]);
    const { addToCart, count } = useCart();

    useEffect(() => {
        async function fetchDemoMenu() {
            setLoading(true);
            const supabase = createClient();

            try {
                // Find the restaurant that has the most recently added menu item
                // This ensures we connect to the active restaurant the user is working on
                const { data: lastItem } = await supabase
                    .from('menu_items')
                    .select('restaurant_id')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let restaurantId = lastItem?.restaurant_id;

                let restaurants: { id: string; slug: string } | null = null;

                if (restaurantId) {
                    const { data } = await supabase
                        .from('restaurants')
                        .select('id, slug')
                        .eq('id', restaurantId)
                        .maybeSingle();
                    restaurants = data;
                } else {
                    // Fallback to latest restaurant if no items exist
                    const { data } = await supabase
                        .from('restaurants')
                        .select('id, slug')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    restaurants = data;
                    restaurantId = restaurants?.id;
                }

                if (!restaurantId || !restaurants) {
                    // No restaurant found, use fallback items
                    setRealItems([]);
                    setLoading(false);
                    return;
                }

                // Update demo context with real restaurant ID and Slug
                DEMO_CONTEXT.restaurant_id = restaurantId;
                if (restaurants.slug) {
                    DEMO_CONTEXT.slug = restaurants.slug;
                }

                // Try to find a valid table for this restaurant
                const { data: tableData } = await supabase
                    .from('tables')
                    .select('table_number')
                    .eq('restaurant_id', restaurantId)
                    .eq('is_active', true)
                    .limit(1)
                    .maybeSingle();

                if (tableData) {
                    DEMO_CONTEXT.table = tableData.table_number;
                } else {
                    // Fallback to table '1' if no tables exist (though purchase might fail if not created)
                    console.warn(
                        'No active tables found for demo restaurant. Defaulting to table 1.'
                    );
                    DEMO_CONTEXT.table = '1';
                }

                const { data: categories, error: categoryError } = await supabase
                    .from('categories')
                    .select('id, name, section')
                    .eq('restaurant_id', restaurantId);

                if (categoryError) {
                    console.error('Error fetching categories:', categoryError);
                    setRealItems([]);
                    return;
                }

                const typedCategories = (categories as RawCategory[]) ?? [];
                const categoryIds = typedCategories.map(category => category.id);
                const categoryById = new Map(
                    typedCategories.map(category => [category.id, category])
                );

                if (categoryIds.length === 0) {
                    setRealItems([]);
                    return;
                }

                const { data: items, error: itemError } = await supabase
                    .from('menu_items')
                    .select(
                        'id, name, price, image_url, rating, preparation_time, description, description_am, popularity, likes_count, category_id'
                    )
                    .eq('is_available', true)
                    .in('category_id', categoryIds);

                if (itemError) {
                    console.error('Error fetching menu:', itemError);
                    setRealItems([]);
                    return;
                }

                const getSmartImageUrl = (path: string | null) => {
                    if (!path) return FALLBACK_IMAGE_URL;
                    if (path.startsWith('fab')) return path;
                    if (isAllowedRemoteImageUrl(path)) {
                        return path;
                    }
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
                    'hot drinks': 'Hot Drinks',
                    'soft drinks': 'Soft Drinks',
                    beer: 'Beer',
                    beers: 'Beer',
                    alcohol: 'Beer',
                    juice: 'Juice',
                    'fresh juices': 'Juice',
                    wine: 'Wine',
                    cocktails: 'Wine',
                    'craft cocktails': 'Wine',
                    spirits: 'Wine',
                    tea: 'Hot Drinks',
                    coffee: 'Hot Drinks',
                };

                const formattedItems = ((items as RawMenuItem[]) || [])
                    .map((item: RawMenuItem): MenuItem | null => {
                        const category = categoryById.get(item.category_id);
                        if (!category) return null;

                        const constantItem = FOOD_ITEMS.find(
                            food =>
                                food.title.toLowerCase().trim() === item.name.toLowerCase().trim()
                        );

                        const imageUrl = constantItem
                            ? constantItem.imageUrl
                            : getSmartImageUrl(item.image_url);

                        return {
                            id: item.id,
                            name: item.name,
                            title: item.name,
                            imageUrl,
                            preparationTime: item.preparation_time || 15,
                            shopName: CATEGORY_MAP[category.name?.toLowerCase()] || 'Saba Grill',
                            price: Number(item.price),
                            rating: item.rating ?? undefined,
                            categories: {
                                name: category.name,
                                section: category.section,
                            },
                            description: item.description ?? undefined,
                            description_am: item.description_am ?? undefined,
                            popularity: item.popularity ?? undefined,
                            likesCount: item.likes_count ?? undefined,
                        };
                    })
                    .filter((item): item is MenuItem => item !== null);

                setRealItems(formattedItems);
            } catch (error) {
                console.error('Unexpected menu error:', error);
                setRealItems([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDemoMenu();
    }, []);

    const filteredItems = realItems.filter(item => {
        const matchesSection = item.categories?.section === activeTab;
        if (!matchesSection) return false;

        if (activeCategoryId === 'all') return true;
        return item.categories?.name?.toLowerCase() === activeCategoryId.toLowerCase();
    });

    const handleAddToCart = (item: MenuItem, quantity = 1) => {
        addToCart({
            menuItemId: item.id,
            title: item.title,
            price: item.price,
            image: item.imageUrl,
            quantity,
        });
    };

    if (loading) {
        return (
            <main className="app-container pb-safe bg-[var(--background)] transition-colors duration-300">
                <GuestHero activeTab={activeTab} onTabChange={setActiveTab} />
                <CategoryRail
                    activeTab={activeTab}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={setActiveCategoryId}
                />
                <MenuSkeleton />
            </main>
        );
    }

    return (
        <main className="app-container pb-safe bg-[var(--background)] transition-colors duration-300">
            {/* Demo Banner */}
            <div className="bg-brand-crimson/10 border-brand-crimson/20 border-b px-4 py-2 text-center">
                <p className="text-brand-crimson text-sm font-medium">
                    🎉 Demo Mode - Explore the menu without scanning a QR code
                </p>
            </div>

            <div className="relative w-full">
                <GuestHero activeTab={activeTab} onTabChange={setActiveTab} />
                <CategoryRail
                    activeTab={activeTab}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={setActiveCategoryId}
                />

                <div className="px-4 pb-20">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h2 className="no-select font-manrope text-2xl font-black tracking-tighter text-black dark:text-white">
                            Main Menu
                        </h2>
                        <button className="font-manrope hover:text-brand-crimson text-sm font-bold text-black/60 transition-colors dark:text-white/60">
                            View All
                        </button>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="font-medium text-black/60 dark:text-white/60">
                                No menu items found. Please add items to your restaurant menu.
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                {filteredItems
                                    .filter((_, i) => i % 2 === 0)
                                    .map(item => (
                                        <MenuCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => setSelectedItem(item)}
                                            onAdd={() => handleAddToCart(item)}
                                        />
                                    ))}
                            </div>
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
                    )}
                </div>
            </div>

            <DishDetailDrawer
                open={!!selectedItem}
                onOpenChange={open => !open && setSelectedItem(null)}
                item={selectedItem}
                onAddToCart={qty => selectedItem && handleAddToCart(selectedItem, qty)}
            />

            <CartDrawer
                open={cartOpen}
                onOpenChange={setCartOpen}
                guestContext={{
                    slug: DEMO_CONTEXT.slug,
                    table: DEMO_CONTEXT.table,
                    sig: DEMO_CONTEXT.sig,
                    exp: DEMO_CONTEXT.exp,
                }}
                tableNumber={DEMO_CONTEXT.table}
            />

            <FloatingCart count={count} onClick={() => setCartOpen(true)} />
            <ServiceRequestButton
                guestContext={{
                    slug: DEMO_CONTEXT.slug,
                    table: DEMO_CONTEXT.table,
                    sig: DEMO_CONTEXT.sig,
                    exp: DEMO_CONTEXT.exp,
                }}
                tableNumber={DEMO_CONTEXT.table}
            />
        </main>
    );
}

export default function DemoTablePage() {
    return (
        <CartProvider>
            <DemoMenuContent />
        </CartProvider>
    );
}
