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
            <main className="app-container h-[100dvh] relative overflow-hidden bg-white text-white">
                <img 
                    src="data:image/webp;base64,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" 
                    alt="Splash Background" 
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                <div className="relative z-10 flex h-full flex-col px-25 pb-[calc(10vh-30px)] max-w-md mx-auto">
                    <div className="mt-auto space-y-1">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthError(null);
                                setAuthMessage(null);
                                setAuthView('login');
                                setOtpFlow('none');
                                setOtpCode('');
                            }}
                            className="flex h-14 w-full items-center justify-center rounded-3xl bg-[#FFC900] text-xl font-black tracking-tight text-[#a60000] shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition active:scale-[0.98]"
                        >
                            Sign In / Sign up
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSkipToMenu()}
                            className="flex h-14 w-full items-center justify-center text-xl font-black tracking-tight text-[#FFC900] transition active:scale-[0.98]"
                        >
                            Skip to Menu
                        </button>
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
