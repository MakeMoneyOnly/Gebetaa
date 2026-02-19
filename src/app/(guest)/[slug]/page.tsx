'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import { GuestHero } from '@/features/menu/components/GuestHero';
import { CategoryRail } from '@/features/menu/components/CategoryRail';
import { MenuCard } from '@/features/menu/components/MenuCard';
import { MenuSkeleton } from '@/features/menu/components/MenuSkeleton';
import { FloatingCart } from '@/features/menu/components/FloatingCart';
import { ServiceRequestButton } from '@/features/menu/components/ServiceRequestButton';
import { CartProvider, useCart } from '@/context/CartContext';
import { FOOD_ITEMS } from '@/lib/constants';
import type { DishItem } from '@/features/menu/components/DishDetailDrawer';
import { isAbortError } from '@/hooks/useSafeFetch';

const DishDetailDrawer = dynamic(
    () => import('@/features/menu/components/DishDetailDrawer').then(mod => mod.DishDetailDrawer),
    { ssr: false }
);
const CartDrawer = dynamic(
    () => import('@/features/menu/components/CartDrawer').then(mod => mod.CartDrawer),
    { ssr: false }
);

type MenuItem = DishItem;

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

interface GuestContextPayload {
    restaurant_id: string;
    table_number: string;
    slug: string;
    sig: string;
    exp: number;
}

interface CampaignAttributionPayload {
    campaign_delivery_id: string;
    campaign_id?: string;
}

function MenuContent() {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [contextLoading, setContextLoading] = useState(true);
    const [contextError, setContextError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const [realItems, setRealItems] = useState<MenuItem[]>([]);
    const [guestContext, setGuestContext] = useState<GuestContextPayload | null>(null);
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get('table');
    const signature = searchParams.get('sig');
    const expiresAt = searchParams.get('exp');
    const campaignDeliveryId = searchParams.get('cdid') ?? searchParams.get('campaign_delivery_id');
    const campaignId = searchParams.get('cid') ?? searchParams.get('campaign_id');
    const slug = params.slug;
    const { addToCart, count } = useCart();
    
    // Ref to track if component is mounted
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        
        async function validateContext() {
            if (!slug || !tableNumber || !signature || !expiresAt) {
                setGuestContext(null);
                setContextError('Invalid QR link. Please scan the table QR again.');
                setContextLoading(false);
                return;
            }

            setContextLoading(true);
            setContextError(null);

            try {
                const url = new URL('/api/guest/context', window.location.origin);
                url.searchParams.set('slug', slug);
                url.searchParams.set('table', tableNumber);
                url.searchParams.set('sig', signature);
                url.searchParams.set('exp', expiresAt);

                const response = await fetch(url.toString(), { method: 'GET' });
                const payload = await response.json();

                if (!isMountedRef.current) return;

                if (!response.ok) {
                    setGuestContext(null);
                    setContextError(payload?.error ?? 'Invalid or expired QR code.');
                    return;
                }

                setGuestContext(payload.data as GuestContextPayload);
            } catch (error) {
                if (!isMountedRef.current) return;
                // Silently ignore abort errors
                if (isAbortError(error)) {
                    return;
                }
                console.error('Failed to validate guest context:', error);
                setGuestContext(null);
                setContextError('Unable to validate table context. Please try again.');
            } finally {
                if (isMountedRef.current) {
                    setContextLoading(false);
                }
            }
        }

        validateContext();
        
        return () => {
            isMountedRef.current = false;
        };
    }, [expiresAt, signature, slug, tableNumber]);

    useEffect(() => {
        async function fetchMenu() {
            if (!guestContext?.restaurant_id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const supabase = createClient();

            try {
                const { data: categories, error: categoryError } = await supabase
                    .from('categories')
                    .select('id, name, section')
                    .eq('restaurant_id', guestContext.restaurant_id);

                if (categoryError) {
                    console.error('Error fetching categories:', categoryError);
                    setRealItems([]);
                    return;
                }

                const typedCategories = (categories as RawCategory[]) ?? [];
                const categoryIds = typedCategories.map(category => category.id);
                const categoryById = new Map(typedCategories.map(category => [category.id, category]));

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
                    if (!path) return 'https://via.placeholder.com/150';
                    if (path.startsWith('http') || path.startsWith('fab')) return path;
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
                            food => food.title.toLowerCase().trim() === item.name.toLowerCase().trim()
                        );

                        let imageUrl = constantItem
                            ? constantItem.imageUrl
                            : getSmartImageUrl(item.image_url);

                        if (imageUrl.includes('unsplash.com')) {
                            imageUrl =
                                'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Spicy%20Tonkotsu.webp';
                        }

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

        fetchMenu();
    }, [guestContext?.restaurant_id]);

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

    if (contextLoading || loading) {
        return (
            <main className="app-container bg-[var(--background)] pb-safe transition-colors duration-300">
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

    if (contextError || !guestContext) {
        return (
            <main className="app-container flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-center">
                <div className="max-w-md">
                    <h1 className="font-manrope text-2xl font-black tracking-tight text-black dark:text-white">
                        Invalid Table QR
                    </h1>
                    <p className="mt-3 text-sm font-medium text-black/60 dark:text-white/70">
                        {contextError ?? 'This table QR is invalid or expired. Please rescan the table QR code.'}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="app-container bg-[var(--background)] pb-safe transition-colors duration-300">
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
                        <button className="text-black/60 dark:text-white/60 font-manrope text-sm font-bold hover:text-brand-crimson transition-colors">
                            View All
                        </button>
                    </div>

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
                    slug: guestContext.slug,
                    table: guestContext.table_number,
                    sig: guestContext.sig,
                    exp: guestContext.exp,
                    ...(campaignDeliveryId
                        ? {
                            campaign_attribution: {
                                campaign_delivery_id: campaignDeliveryId,
                                ...(campaignId ? { campaign_id: campaignId } : {}),
                            } as CampaignAttributionPayload,
                        }
                        : {}),
                }}
                tableNumber={guestContext.table_number}
            />

            <FloatingCart count={count} onClick={() => setCartOpen(true)} />
            <ServiceRequestButton
                guestContext={{
                    slug: guestContext.slug,
                    table: guestContext.table_number,
                    sig: guestContext.sig,
                    exp: guestContext.exp,
                }}
                tableNumber={guestContext.table_number}
            />
        </main>
    );
}

export default function DynamicMenuPage() {
    return (
        <CartProvider>
            <MenuContent />
        </CartProvider>
    );
}
