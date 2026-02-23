'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
    table_id: string;
    table_number: string;
    slug: string;
    sig: string;
    exp: number;
    restaurant_name: string;
    restaurant_logo_url: string | null;
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
    const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
    const [authState, setAuthState] = useState<'guest' | 'authenticated'>('guest');
    const [showPreMenuSplash, setShowPreMenuSplash] = useState(true);
    const [sessionSyncing, setSessionSyncing] = useState(false);
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get('table');
    const signature = searchParams.get('sig');
    const expiresAt = searchParams.get('exp');
    const campaignDeliveryId = searchParams.get('cdid') ?? searchParams.get('campaign_delivery_id');
    const campaignId = searchParams.get('cid') ?? searchParams.get('campaign_id');
    const forceMenuEntry = searchParams.get('entry') === 'menu';
    const slug = params.slug;
    const supabase = useMemo(() => createClient(), []);
    const { addToCart, count } = useCart();

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
                if (isAbortError(error)) return;
                console.error('Failed to validate guest context:', error);
                setGuestContext(null);
                setContextError('Unable to validate table context. Please try again.');
            } finally {
                if (isMountedRef.current) {
                    setContextLoading(false);
                }
            }
        }

        void validateContext();

        return () => {
            isMountedRef.current = false;
        };
    }, [expiresAt, signature, slug, tableNumber]);

    useEffect(() => {
        async function upsertGuestSession() {
            if (!guestContext) return;

            setSessionSyncing(true);
            try {
                const response = await fetch('/api/guest/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: guestSessionId ?? undefined,
                        source: campaignDeliveryId ? 'campaign_qr' : 'qr',
                        guest_context: {
                            slug: guestContext.slug,
                            table: guestContext.table_number,
                            sig: guestContext.sig,
                            exp: guestContext.exp,
                        },
                    }),
                });

                const payload = await response.json();
                if (!response.ok) {
                    console.warn('Failed to upsert guest session:', payload?.error);
                    return;
                }

                const resolvedSessionId = payload?.data?.session_id as string | undefined;
                const resolvedAuthState = payload?.data?.auth_state as
                    | 'guest'
                    | 'authenticated'
                    | undefined;

                if (resolvedSessionId) {
                    setGuestSessionId(resolvedSessionId);
                }
                if (resolvedAuthState) {
                    setAuthState(resolvedAuthState);
                    if (resolvedAuthState === 'authenticated' || forceMenuEntry) {
                        setShowPreMenuSplash(false);
                    }
                } else if (forceMenuEntry) {
                    setShowPreMenuSplash(false);
                }
            } catch (error) {
                if (!isAbortError(error)) {
                    console.error('Failed to sync guest session:', error);
                }
            } finally {
                setSessionSyncing(false);
            }
        }

        void upsertGuestSession();
    }, [campaignDeliveryId, forceMenuEntry, guestContext, guestSessionId]);

    useEffect(() => {
        async function fetchMenu() {
            if (!guestContext?.restaurant_id) {
                setLoading(false);
                return;
            }

            setLoading(true);
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

                        let imageUrl = constantItem ? constantItem.imageUrl : getSmartImageUrl(item.image_url);

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

        void fetchMenu();
    }, [guestContext?.restaurant_id, supabase]);

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

    const buildAuthHref = (path: '/guest/auth/login' | '/guest/auth/signup') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('entry', 'menu');
        if (guestSessionId) {
            params.set('gsid', guestSessionId);
        }
        const nextUrl = `/${slug}?${params.toString()}`;
        return `${path}?next=${encodeURIComponent(nextUrl)}`;
    };

    const handleSkipToMenu = async () => {
        setShowPreMenuSplash(false);
        if (!guestContext) return;

        try {
            await fetch('/api/guest/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: guestSessionId ?? undefined,
                    skip_selected: true,
                    source: campaignDeliveryId ? 'campaign_qr' : 'qr',
                    guest_context: {
                        slug: guestContext.slug,
                        table: guestContext.table_number,
                        sig: guestContext.sig,
                        exp: guestContext.exp,
                    },
                }),
            });
        } catch (error) {
            if (!isAbortError(error)) {
                console.warn('Skip analytics update failed:', error);
            }
        }
    };

    if (contextLoading || loading) {
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

    if (showPreMenuSplash) {
        return (
            <main className="app-container relative min-h-screen overflow-hidden bg-[#9E1111] text-white">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_30%,rgba(0,0,0,0)_60%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(158,17,17,0.15)_0%,rgba(64,8,8,0.42)_58%,rgba(9,10,14,0.82)_100%)]" />
                    <div className="absolute top-[-230px] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#ff9090]/18 blur-[140px]" />
                </div>

                <div className="relative z-10 flex min-h-screen flex-col px-5 pb-10">
                    <div className="pt-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-black/18 px-4 py-1.5 backdrop-blur-sm">
                            <span className="bg-brand-crimson flex h-6 w-6 items-center justify-center rounded-full text-sm font-black text-white">
                                G
                            </span>
                            <span className="font-manrope text-xl font-extrabold tracking-tight">Gebeta</span>
                        </div>
                    </div>

                    <div className="mt-auto w-full">
                        <div className="rounded-[28px] border border-white/18 bg-[linear-gradient(180deg,rgba(7,10,18,0.62)_0%,rgba(7,10,18,0.86)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                            <p className="text-xs font-black tracking-[0.25em] text-white/65 uppercase">
                                Gebeta | Table {guestContext.table_number}
                            </p>
                            <h1 className="mt-3 font-manrope text-4xl leading-[0.95] font-black tracking-tighter text-white">
                                Welcome to {guestContext.restaurant_name}
                            </h1>
                            <p className="mt-3 text-base leading-7 font-semibold text-white/80">
                                Order in seconds. Log in to earn loyalty points, redeem gift cards, and unlock member campaigns.
                            </p>

                            <div className="mt-5 space-y-2 text-sm leading-6 font-semibold text-white/72">
                                <p>Earn points on eligible orders.</p>
                                <p>Use your gift card balance instantly at checkout.</p>
                                <p>Access members-only campaigns for this restaurant.</p>
                            </div>

                            <div className="mt-7 space-y-3">
                                <Link
                                    href={buildAuthHref('/guest/auth/login')}
                                    className="flex h-14 w-full items-center justify-center rounded-full bg-white text-lg font-black text-[#12141a] transition hover:bg-white/95"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href={buildAuthHref('/guest/auth/signup')}
                                    className="flex h-14 w-full items-center justify-center rounded-full border border-white/35 bg-transparent text-lg font-black text-white transition hover:bg-white/8"
                                >
                                    Sign Up
                                </Link>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleSkipToMenu()}
                                className="mt-6 w-full text-center text-lg font-bold text-white/78 underline-offset-4 transition hover:text-white hover:underline"
                            >
                                {sessionSyncing ? 'Preparing menu...' : 'Skip to Menu'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="app-container pb-safe bg-[var(--background)] transition-colors duration-300">
            <div className="relative w-full">
                <GuestHero activeTab={activeTab} onTabChange={setActiveTab} />
                <CategoryRail
                    activeTab={activeTab}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={setActiveCategoryId}
                />

                <div className="px-4 pb-20">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <div>
                            <h2 className="no-select font-manrope text-2xl font-black tracking-tighter text-black dark:text-white">
                                Main Menu
                            </h2>
                            {authState === 'authenticated' ? (
                                <p className="mt-1 text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
                                    You are signed in. Eligible orders earn loyalty points.
                                </p>
                            ) : null}
                        </div>
                        <button className="font-manrope hover:text-brand-crimson text-sm font-bold text-black/60 transition-colors dark:text-white/60">
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
                    guest_session_id: guestSessionId ?? undefined,
                    auth_state: authState,
                    login_url: buildAuthHref('/guest/auth/login'),
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
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0b1013] text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <p className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">
                        Loading Menu...
                    </p>
                </div>
            </div>
        }>
            <CartProvider>
                <MenuContent />
            </CartProvider>
        </Suspense>
    );
}
