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
            <div className="flex min-h-screen bg-[var(--background)] w-full text-white">
                {/* Fallback space matches main structure to avoid jar */}
            </div>
        }>
            <CartProvider>
                <MenuContent />
            </CartProvider>
        </Suspense>
    );
}
