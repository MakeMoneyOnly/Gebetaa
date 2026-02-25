'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Drawer } from 'vaul';
import { createClient } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import { Phone, User, ArrowLeft } from 'lucide-react';
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
    const [loading, setLoading] = useState(false);
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
    const [authView, setAuthView] = useState<'none' | 'login' | 'signup'>('none');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState<string | null>(null);
    const [loginPhone, setLoginPhone] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupName, setSignupName] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpTargetPhone, setOtpTargetPhone] = useState('');
    const [otpFlow, setOtpFlow] = useState<'none' | 'login' | 'signup'>('none');
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
            if (!guestContext?.restaurant_id || showPreMenuSplash) {
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
    }, [guestContext?.restaurant_id, showPreMenuSplash, supabase]);

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

    const getAuthErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'object' && error && 'message' in error) {
            const message = (error as { message?: unknown }).message;
            if (typeof message === 'string' && message.length > 0) return message;
        }
        return 'Authentication failed. Please try again.';
    };

    const normalizeEthiopianPhone = (value: string): string | null => {
        const digits = value.replace(/\D/g, '');
        if (digits.startsWith('251') && digits.length === 12) {
            return `+${digits}`;
        }
        if (digits.startsWith('09') && digits.length === 10) {
            return `+251${digits.slice(1)}`;
        }
        if (digits.startsWith('9') && digits.length === 9) {
            return `+251${digits}`;
        }
        return null;
    };

    const syncAuthenticatedGuestSession = async () => {
        if (!guestContext) return;

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
            throw new Error(payload?.error ?? 'Failed to refresh guest session.');
        }

        if (payload?.data?.session_id) {
            setGuestSessionId(payload.data.session_id as string);
        }
        setAuthState('authenticated');
        setAuthView('none');
        setShowPreMenuSplash(false);
    };

    const handleSendOtp = async (event: React.FormEvent) => {
        event.preventDefault();
        setAuthLoading(true);
        setAuthError(null);
        setAuthMessage(null);

        try {
            const rawPhone = authView === 'login' ? loginPhone : signupPhone;
            const normalizedPhone = normalizeEthiopianPhone(rawPhone);
            if (!normalizedPhone) {
                throw new Error('Please enter a valid Ethiopian phone number.');
            }

            const { error } = await supabase.auth.signInWithOtp({
                phone: normalizedPhone,
                options: {
                    shouldCreateUser: authView === 'signup',
                    data:
                        authView === 'signup'
                            ? {
                                  account_type: 'guest',
                                  full_name: signupName.trim() || undefined,
                              }
                            : undefined,
                },
            });

            if (error) throw error;

            setOtpTargetPhone(normalizedPhone);
            setOtpFlow(authView);
            setOtpCode('');
            setAuthMessage('OTP sent. Enter the code from SMS to continue.');
        } catch (error) {
            const message = getAuthErrorMessage(error);
            setAuthError(message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async (event: React.FormEvent) => {
        event.preventDefault();
        setAuthLoading(true);
        setAuthError(null);
        setAuthMessage(null);

        try {
            if (!otpTargetPhone) {
                throw new Error('No phone number found for OTP verification.');
            }

            const token = otpCode.trim();
            if (token.length < 4) {
                throw new Error('Enter the OTP code sent to your phone.');
            }

            const { data, error } = await supabase.auth.verifyOtp({
                phone: otpTargetPhone,
                token,
                type: 'sms',
            });

            if (error) throw error;
            if (!data.session && !data.user) {
                throw new Error('OTP verification failed. Please try again.');
            }

            await syncAuthenticatedGuestSession();
        } catch (error) {
            const message = getAuthErrorMessage(error);
            setAuthError(message);
        } finally {
            setAuthLoading(false);
        }
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

    if (!showPreMenuSplash && (contextError || !guestContext)) {
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
            <main className="app-container h-[100dvh] relative overflow-hidden bg-[#9E1111] text-white">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_14%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.03)_30%,rgba(0,0,0,0)_58%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(170,20,20,0.12)_0%,rgba(103,11,11,0.48)_56%,rgba(10,12,18,0.82)_100%)]" />
                    <div className="absolute top-[-210px] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#ff9b9b]/16 blur-[140px]" />
                    <div className="absolute bottom-[18%] left-[-18%] h-[280px] w-[280px] rounded-full bg-[#5f0a0a]/70 blur-[90px]" />
                    <div className="absolute right-[-24%] bottom-[14%] h-[320px] w-[320px] rounded-full bg-black/40 blur-[110px]" />
                </div>

                <div className="relative z-10 flex h-full flex-col px-6 pb-10">
                    <div className="pt-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-black/22 px-4 py-1.5 backdrop-blur-sm">
                            <span className="bg-brand-crimson flex h-6 w-6 items-center justify-center rounded-full text-sm font-black text-white">
                                G
                            </span>
                            <span className="font-manrope text-xl font-extrabold tracking-tight">Gebeta</span>
                        </div>
                    </div>

                    <section className="mt-14">
                        <p className="text-xs font-black tracking-[0.24em] text-white/70 uppercase">
                            Gebeta | Table {guestContext?.table_number || tableNumber || '--'}
                        </p>
                        <h1 className="font-manrope mt-4 text-[56px] leading-[0.88] font-black tracking-tighter text-white">
                            Beyond
                            <br />
                            Ordinary
                            <br />
                            Bites
                        </h1>
                        <p className="mt-4 max-w-[320px] text-base leading-7 font-semibold text-white/84">
                            {guestContext?.restaurant_name ? `${guestContext.restaurant_name} rewards every order.` : 'Rewards for every order.'} Log in to earn loyalty points, use gift cards, and unlock member campaigns.
                        </p>
                    </section>

                    <div className="mt-auto">
                        <p className="mb-5 text-center text-base font-semibold text-white/85">
                            Unveil top dishes &amp; flavors.
                        </p>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setAuthError(null);
                                    setAuthMessage(null);
                                    setAuthView('login');
                                    setOtpFlow('none');
                                    setOtpCode('');
                                }}
                                className="flex h-14 w-full items-center justify-center rounded-full bg-white text-lg font-black text-[#151922] shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:bg-white/95"
                            >
                                Sign In / Sign Up
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSkipToMenu()}
                                className="flex h-14 w-full items-center justify-center rounded-full border border-white/45 bg-black/12 text-lg font-black text-white backdrop-blur-sm transition hover:bg-black/18"
                            >
                                {sessionSyncing ? 'Preparing menu...' : 'Skip to Menu'}
                            </button>
                        </div>
                    </div>
                </div>

                <Drawer.Root
                    open={authView !== 'none'}
                    onOpenChange={(open) => {
                        if (!open) {
                            setAuthView('none');
                            setOtpFlow('none');
                            setOtpCode('');
                            setAuthError(null);
                            setAuthMessage(null);
                        }
                    }}
                >
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm" />
                        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[9999] flex flex-col rounded-t-[32px] bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.25)] outline-none">
                            <div className="w-full px-5 pb-8 pt-5 text-black">
                                <div className="mx-auto mb-6 h-1.5 w-12 flex-shrink-0 lg:hidden rounded-full bg-black/10" />
                                <div className="mb-4 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAuthView('none');
                                            setOtpFlow('none');
                                            setOtpCode('');
                                            setAuthError(null);
                                            setAuthMessage(null);
                                        }}
                                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-black/65 transition hover:bg-black/5 -ml-3"
                                    >
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                </div>

                                <Drawer.Title className="font-manrope text-4xl font-black tracking-tight text-black">
                                    {authView === 'login' ? 'Welcome Back' : 'Get Started'}
                                </Drawer.Title>
                                <p className="mt-2 text-base font-medium text-black/60">
                                    {otpFlow === 'none'
                                        ? authView === 'login'
                                            ? 'Log in to securely access your previous orders and exclusive loyalty rewards.'
                                            : 'Sign up for a free guest account to unlock faster checkouts, special offers, and rewards.'
                                        : `Enter the verification code sent via SMS to ${otpTargetPhone} to continue.`}
                                </p>

                                {authError ? (
                                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                        {authError}
                                    </p>
                                ) : null}
                                {authMessage ? (
                                    <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                                        {authMessage}
                                    </p>
                                ) : null}

                                {otpFlow === 'none' ? (
                                    authView === 'login' ? (
                                        <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                                            <div className="relative">
                                                <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/35" />
                                                <input
                                                    type="tel"
                                                    inputMode="tel"
                                                    value={loginPhone}
                                                    onChange={e => setLoginPhone(e.target.value)}
                                                    placeholder="Enter phone (e.g. 0911xxxxxx)"
                                                    required
                                                    className="w-full rounded-2xl border border-black/12 bg-white px-12 py-4 text-base font-semibold text-black outline-none focus:border-[#0D3B40]/30 focus:ring-2 focus:ring-[#0D3B40]/15"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={authLoading}
                                                className="bg-brand-crimson hover:bg-brand-crimson-hover h-14 w-full rounded-2xl text-xl font-black text-white transition disabled:opacity-70"
                                            >
                                                {authLoading ? 'Loading...' : 'Sign In'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAuthView('signup');
                                                    setOtpFlow('none');
                                                    setOtpCode('');
                                                    setAuthError(null);
                                                    setAuthMessage(null);
                                                }}
                                                className="w-full text-center text-sm font-bold text-black/55 underline underline-offset-4"
                                            >
                                                don&apos;t have an account? sign up
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                                            <div className="relative">
                                                <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/35" />
                                                <input
                                                    type="text"
                                                    value={signupName}
                                                    onChange={e => setSignupName(e.target.value)}
                                                    placeholder="Enter your name (optional)"
                                                    className="w-full rounded-2xl border border-black/12 bg-white px-12 py-4 text-base font-semibold text-black outline-none focus:border-[#0D3B40]/30 focus:ring-2 focus:ring-[#0D3B40]/15"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/35" />
                                                <input
                                                    type="tel"
                                                    inputMode="tel"
                                                    value={signupPhone}
                                                    onChange={e => setSignupPhone(e.target.value)}
                                                    placeholder="Enter phone (e.g. 0911xxxxxx)"
                                                    required
                                                    className="w-full rounded-2xl border border-black/12 bg-white px-12 py-4 text-base font-semibold text-black outline-none focus:border-[#0D3B40]/30 focus:ring-2 focus:ring-[#0D3B40]/15"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={authLoading}
                                                className="bg-brand-crimson hover:bg-brand-crimson-hover h-14 w-full rounded-2xl text-xl font-black text-white transition disabled:opacity-70"
                                            >
                                                {authLoading ? 'Loading...' : 'Sign Up'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAuthView('login');
                                                    setOtpFlow('none');
                                                    setOtpCode('');
                                                    setAuthError(null);
                                                    setAuthMessage(null);
                                                }}
                                                className="w-full text-center text-sm font-bold text-black/55 underline underline-offset-4"
                                            >
                                                already have an account? sign in
                                            </button>
                                        </form>
                                    )
                                ) : (
                                    <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                                        <div className="relative">
                                            <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/35" />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={otpCode}
                                                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="Enter 6-digit OTP"
                                                required
                                                className="w-full rounded-2xl border border-black/12 bg-white px-12 py-4 text-base font-semibold text-black outline-none focus:border-[#0D3B40]/30 focus:ring-2 focus:ring-[#0D3B40]/15"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="bg-brand-crimson hover:bg-brand-crimson-hover h-14 w-full rounded-2xl text-xl font-black text-white transition disabled:opacity-70"
                                        >
                                            {authLoading ? 'Verifying...' : 'Verify'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={authLoading}
                                            onClick={() => {
                                                setOtpFlow('none');
                                                setOtpCode('');
                                                setAuthMessage(null);
                                            }}
                                            className="w-full text-center text-sm font-bold text-black/55 underline underline-offset-4 disabled:opacity-60"
                                        >
                                            change phone number
                                        </button>
                                    </form>
                                )}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
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

            {guestContext && (
                <>
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
                </>
            )}
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
