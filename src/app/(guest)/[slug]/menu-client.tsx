'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Drawer } from 'vaul';
import { createClient } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import { Phone, User } from 'lucide-react';
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

interface GuestContextPayload {
    restaurant_id: string;
    table_id: string;
    table_number: string;
    slug: string;
    sig: string;
    exp: number;
    restaurant_name: string;
    restaurant_logo_url: string | null;
    is_online_order?: boolean;
}

interface CampaignAttributionPayload {
    campaign_delivery_id: string;
    campaign_id?: string;
}

/**
 * Client component that handles the interactive menu functionality.
 * This component manages:
 * - Guest context validation (QR scanning / online ordering)
 * - Menu item fetching and filtering
 * - Cart management
 * - Authentication flows
 * - Payment return handling
 */
export function MenuClientContent() {
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [paymentReturnSuccess, setPaymentReturnSuccess] = useState(false);
    const [paymentReturnOrderId, setPaymentReturnOrderId] = useState<string | null>(null);
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
    const [_sessionSyncing, setSessionSyncing] = useState(false);
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

    const getQueryParam = (key: string) => searchParams.get(key) ?? searchParams.get(`amp;${key}`);
    const tableNumber = getQueryParam('table');
    const signature = getQueryParam('sig');
    const expiresAt = getQueryParam('exp');
    const campaignDeliveryId = getQueryParam('cdid') ?? getQueryParam('campaign_delivery_id');
    const campaignId = getQueryParam('cid') ?? getQueryParam('campaign_id');
    const forceMenuEntry = getQueryParam('entry') === 'menu';
    const slug = params.slug;

    // Online ordering mode: no QR params present; this is the merchant's storefront link
    const isOnlineOrderMode = !tableNumber && !signature && !expiresAt;

    // Detect return from Chapa payment (real or mock)
    const paymentStatus = getQueryParam('payment');
    const paymentOrderId = getQueryParam('order_id');

    const supabase = useMemo(() => createClient(), []);
    const { addToCart, count } = useCart();

    // Capture payment return state once, then clean the URL so refreshes stay clean.
    useEffect(() => {
        if (paymentStatus === 'success') {
            setPaymentReturnSuccess(true);
            setPaymentReturnOrderId(paymentOrderId ?? null);
            setShowPreMenuSplash(false);
            setCartOpen(true);

            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('payment');
            nextUrl.searchParams.delete('order_id');
            nextUrl.searchParams.delete('amp;payment');
            nextUrl.searchParams.delete('amp;order_id');
            window.history.replaceState({}, '', nextUrl.toString());
        }
    }, [paymentOrderId, paymentStatus]);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        async function validateContext() {
            // ── Online Ordering Mode ──────────────────────────────────────────────
            if (isOnlineOrderMode) {
                setContextLoading(true);
                setContextError(null);
                try {
                    const url = new URL('/api/guest/restaurant', window.location.origin);
                    url.searchParams.set('slug', slug);

                    const response = await fetch(url.toString(), { method: 'GET' });
                    const payload = await response.json();

                    if (!isMountedRef.current) return;

                    if (!response.ok) {
                        setGuestContext(null);
                        setContextError(
                            payload?.error ?? 'Restaurant not found. Please check the URL.'
                        );
                        return;
                    }

                    const data = payload.data as {
                        restaurant_id: string;
                        restaurant_name: string;
                        restaurant_logo_url: string | null;
                        slug: string;
                    };

                    setGuestContext({
                        restaurant_id: data.restaurant_id,
                        table_id: '',
                        table_number: 'Online Order',
                        slug: data.slug,
                        sig: '0'.repeat(64),
                        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
                        restaurant_name: data.restaurant_name,
                        restaurant_logo_url: data.restaurant_logo_url,
                        is_online_order: true,
                    });
                } catch (error) {
                    if (!isMountedRef.current) return;
                    if (isAbortError(error)) return;
                    setGuestContext(null);
                    setContextError('Unable to load restaurant. Please try again.');
                } finally {
                    if (isMountedRef.current) setContextLoading(false);
                }
                return;
            }

            // ── Dine-in QR Mode ───────────────────────────────────────────────────
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
    }, [expiresAt, isOnlineOrderMode, signature, slug, supabase, tableNumber]);

    useEffect(() => {
        async function upsertGuestSession() {
            if (!guestContext || guestContext.is_online_order) return;

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

        void fetchMenu();
    }, [guestContext?.restaurant_id, showPreMenuSplash, supabase]);

    // Handle authentication state changes (token refresh, sign out)
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
            if (event === 'TOKEN_REFRESHED') {
                // Handle token refresh - session is renewed
                const sessionData = session as { access_token?: string } | null;
                console.log('Token refreshed:', sessionData?.access_token ? 'valid' : 'invalid');
            }
            if (event === 'SIGNED_OUT') {
                // Handle sign out - clear local state and redirect
                setAuthState('guest');
                setGuestSessionId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

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

    const handleSendOtp = async (flow: 'login' | 'signup') => {
        setAuthLoading(true);
        setAuthError(null);
        setAuthMessage(null);

        const phone = flow === 'login' ? loginPhone : signupPhone;
        const normalizedPhone = normalizeEthiopianPhone(phone);

        if (!normalizedPhone) {
            setAuthError('Please enter a valid Ethiopian phone number.');
            setAuthLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    flow,
                    name: flow === 'signup' ? signupName : undefined,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                setAuthError(payload.error ?? getAuthErrorMessage(payload));
                setAuthLoading(false);
                return;
            }

            setOtpTargetPhone(normalizedPhone);
            setOtpFlow(flow);
            setAuthMessage('Verification code sent! Check your phone.');
        } catch (error) {
            setAuthError(getAuthErrorMessage(error));
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setAuthLoading(true);
        setAuthError(null);

        if (!otpCode || otpCode.length < 4) {
            setAuthError('Please enter the verification code.');
            setAuthLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: otpTargetPhone,
                    code: otpCode,
                    flow: otpFlow,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                setAuthError(payload.error ?? getAuthErrorMessage(payload));
                setAuthLoading(false);
                return;
            }

            window.location.reload();
        } catch (error) {
            setAuthError(getAuthErrorMessage(error));
        } finally {
            setAuthLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────────

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

    // Online ordering mode: show error if restaurant not found
    if (isOnlineOrderMode && !guestContext && !contextLoading && contextError) {
        return (
            <main className="app-container flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-center">
                <div className="max-w-md">
                    <h1 className="font-manrope text-2xl font-black tracking-tight text-black dark:text-white">
                        Restaurant Not Found
                    </h1>
                    <p className="mt-3 text-sm font-medium text-black/60 dark:text-white/70">
                        {contextError ?? 'We could not find this restaurant. Please check the URL.'}
                    </p>
                </div>
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
                        {contextError ??
                            'This table QR is invalid or expired. Please rescan the table QR code.'}
                    </p>
                </div>
            </main>
        );
    }

    if (contextLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--background)]">
                <MenuSkeleton />
            </div>
        );
    }

    if (contextError) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
                <div className="mb-4 rounded-full bg-red-500/20 p-4">
                    <Phone className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-white">Unable to Load Menu</h1>
                <p className="text-gray-400">{contextError}</p>
            </div>
        );
    }

    if (!guestContext) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
                <div className="mb-4 rounded-full bg-yellow-500/20 p-4">
                    <Phone className="h-8 w-8 text-yellow-500" />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-white">Invalid Link</h1>
                <p className="text-gray-400">Please scan a valid table QR code to view the menu.</p>
            </div>
        );
    }

    // Show pre-menu splash screen for QR customers
    if (showPreMenuSplash && guestContext && !guestContext.is_online_order) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
                {guestContext.restaurant_logo_url ? (
                    <Image
                        src={guestContext.restaurant_logo_url}
                        alt={guestContext.restaurant_name}
                        width={120}
                        height={120}
                        className="mb-6 rounded-xl object-cover"
                    />
                ) : (
                    <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-xl bg-[var(--primary)]">
                        <span className="text-4xl font-bold text-white">
                            {guestContext.restaurant_name.charAt(0)}
                        </span>
                    </div>
                )}

                <h1 className="mb-2 text-2xl font-bold text-white">
                    Welcome to {guestContext.restaurant_name}
                </h1>
                <p className="mb-8 text-gray-400">
                    {guestContext.table_number !== 'Online Order'
                        ? `Table ${guestContext.table_number}`
                        : 'Online Ordering'}
                </p>

                {authState === 'guest' ? (
                    <div className="flex w-full max-w-sm flex-col gap-3">
                        <button
                            onClick={() => {
                                setAuthView('login');
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            <User className="h-5 w-5" />
                            Sign In / Register
                        </button>

                        {authView === 'login' && (
                            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[var(--card)] p-4 text-left">
                                <input
                                    type="tel"
                                    placeholder="Phone number"
                                    value={loginPhone}
                                    onChange={e => setLoginPhone(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-[var(--background)] px-3 py-2 text-white placeholder-gray-500"
                                />
                                <button
                                    onClick={() => handleSendOtp('login')}
                                    disabled={authLoading}
                                    className="w-full rounded-lg bg-[var(--primary)] py-2 font-semibold text-white disabled:opacity-50"
                                >
                                    {authLoading ? 'Sending...' : 'Send Code'}
                                </button>
                                {authError && <p className="text-sm text-red-400">{authError}</p>}
                                {authMessage && (
                                    <p className="text-sm text-green-400">{authMessage}</p>
                                )}
                                <button
                                    onClick={() => setAuthView('none')}
                                    className="mt-2 text-center text-sm text-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowPreMenuSplash(false)}
                            className="text-sm text-gray-400 underline"
                        >
                            Continue as guest
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowPreMenuSplash(false)}
                        className="rounded-lg bg-[var(--primary)] px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                    >
                        View Menu
                    </button>
                )}

                {authView !== 'none' && authView !== 'login' && (
                    <div className="mt-6 flex w-full max-w-sm flex-col gap-3 rounded-xl bg-[var(--card)] p-4 text-left">
                        <input
                            type="text"
                            placeholder="Your name"
                            value={signupName}
                            onChange={e => setSignupName(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[var(--background)] px-3 py-2 text-white placeholder-gray-500"
                        />
                        <input
                            type="tel"
                            placeholder="Phone number"
                            value={signupPhone}
                            onChange={e => setSignupPhone(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[var(--background)] px-3 py-2 text-white placeholder-gray-500"
                        />
                        <button
                            onClick={() => handleSendOtp('signup')}
                            disabled={authLoading}
                            className="w-full rounded-lg bg-[var(--primary)] py-2 font-semibold text-white disabled:opacity-50"
                        >
                            {authLoading ? 'Sending...' : 'Send Code'}
                        </button>
                        {authError && <p className="text-sm text-red-400">{authError}</p>}
                        {authMessage && <p className="text-sm text-green-400">{authMessage}</p>}
                        <button
                            onClick={() => setAuthView('none')}
                            className="mt-2 text-center text-sm text-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {otpFlow !== 'none' && (
                    <div className="mt-6 flex w-full max-w-sm flex-col gap-3 rounded-xl bg-[var(--card)] p-4 text-left">
                        <p className="text-sm text-gray-400">
                            Enter the code sent to {otpTargetPhone}
                        </p>
                        <input
                            type="text"
                            placeholder="Verification code"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-[var(--background)] px-3 py-2 text-white placeholder-gray-500"
                        />
                        <button
                            onClick={handleVerifyOtp}
                            disabled={authLoading}
                            className="w-full rounded-lg bg-[var(--primary)] py-2 font-semibold text-white disabled:opacity-50"
                        >
                            {authLoading ? 'Verifying...' : 'Verify'}
                        </button>
                        {authError && <p className="text-sm text-red-400">{authError}</p>}
                        <button
                            onClick={() => {
                                setOtpFlow('none');
                                setAuthError(null);
                            }}
                            className="mt-2 text-center text-sm text-gray-400"
                        >
                            Change phone number
                        </button>
                    </div>
                )}
            </div>
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
                            <div className="flex items-center gap-2">
                                <h2 className="no-select font-manrope text-2xl font-black tracking-tighter text-black dark:text-white">
                                    Main Menu
                                </h2>
                            </div>
                            {authState === 'authenticated' ? (
                                <p className="mt-1 text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
                                    You are signed in. Eligible orders earn loyalty points.
                                </p>
                            ) : null}
                        </div>
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
                            is_online_order: guestContext.is_online_order,
                            ...(campaignDeliveryId
                                ? {
                                      campaign_attribution: {
                                          campaign_delivery_id: campaignDeliveryId,
                                          ...(campaignId ? { campaign_id: campaignId } : {}),
                                      } as CampaignAttributionPayload,
                                  }
                                : {}),
                        }}
                        tableNumber={
                            guestContext.is_online_order ? null : guestContext.table_number
                        }
                        paymentReturnSuccess={paymentReturnSuccess}
                        paymentOrderId={paymentReturnOrderId ?? undefined}
                    />

                    <FloatingCart count={count} onClick={() => setCartOpen(true)} />
                    {/* Only show service request button for dine-in (QR) orders */}
                    {!guestContext.is_online_order && (
                        <ServiceRequestButton
                            guestContext={{
                                slug: guestContext.slug,
                                table: guestContext.table_number,
                                sig: guestContext.sig,
                                exp: guestContext.exp,
                            }}
                            tableNumber={guestContext.table_number}
                        />
                    )}
                </>
            )}
        </main>
    );
}

/**
 * Default export for the menu page - wraps the client content in Suspense and CartProvider
 */
export default function DynamicMenuPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen w-full bg-[var(--background)] text-white">
                    {/* Fallback space matches main structure to avoid jar */}
                </div>
            }
        >
            <CartProvider>
                <MenuClientContent />
            </CartProvider>
        </Suspense>
    );
}
