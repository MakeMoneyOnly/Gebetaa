'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { MapPin, Clock, Phone, Info, ChevronLeft, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { isAbortError } from '@/hooks/useSafeFetch';

// Lazy load map component to avoid SSR issues
const LocationMap = dynamic(
    () => import('@/features/menu/components/LocationMap').then(mod => mod.default),
    { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-gray-200" /> }
);

interface RestaurantInfo {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    description: string | null;
    description_am: string | null;
    latitude: number | null;
    longitude: number | null;
    opening_hours: Record<string, { open: string; close: string; closed?: boolean }> | null;
    social_links: Record<string, string> | null;
}

type TabType = 'location' | 'hours' | 'contact' | 'about';

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday', labelAm: 'ሰኞ' },
    { key: 'tuesday', label: 'Tuesday', labelAm: 'ማክሰኞ' },
    { key: 'wednesday', label: 'Wednesday', labelAm: 'ረቡዕ' },
    { key: 'thursday', label: 'Thursday', labelAm: 'ሐሙስ' },
    { key: 'friday', label: 'Friday', labelAm: 'ዓርብ' },
    { key: 'saturday', label: 'Saturday', labelAm: 'ቅዳሜ' },
    { key: 'sunday', label: 'Sunday', labelAm: 'እሑድ' },
];

function RestaurantInfoContent() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const slug = params.slug;
    const initialTab = (searchParams.get('tab') as TabType) || 'location';

    const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    const supabase = createClient();

    useEffect(() => {
        async function fetchRestaurant() {
            if (!slug) return;

            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('restaurants')
                    .select(
                        `
                        id,
                        name,
                        slug,
                        logo_url,
                        address,
                        city,
                        phone,
                        email,
                        website,
                        description,
                        description_am,
                        latitude,
                        longitude,
                        opening_hours,
                        social_links
                    `
                    )
                    .eq('slug', slug)
                    .maybeSingle();

                if (fetchError) {
                    throw new Error(fetchError.message);
                }

                if (!data) {
                    throw new Error('Restaurant not found');
                }

                setRestaurant(data as RestaurantInfo);
            } catch (err) {
                if (isAbortError(err)) return;
                setError(err instanceof Error ? err.message : 'Failed to load restaurant info');
            } finally {
                setLoading(false);
            }
        }

        fetchRestaurant();
    }, [slug, supabase]);

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'location', label: 'Location', icon: <MapPin className="h-4 w-4" /> },
        { id: 'hours', label: 'Hours', icon: <Clock className="h-4 w-4" /> },
        { id: 'contact', label: 'Contact', icon: <Phone className="h-4 w-4" /> },
        { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
                <div className="flex animate-pulse flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-gray-300" />
                    <div className="h-6 w-48 rounded bg-gray-300" />
                </div>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
                <div className="text-center">
                    <div className="mb-4 inline-flex rounded-full bg-red-500/20 p-4">
                        <Info className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="mb-2 text-xl font-semibold text-white">Unable to Load</h1>
                    <p className="text-gray-400">
                        {error ?? 'Restaurant information not available'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-[var(--background)]/95 backdrop-blur-sm dark:border-gray-800">
                <div className="flex items-center gap-4 px-4 py-3">
                    <button
                        onClick={() => window.history.back()}
                        className="-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="h-6 w-6 text-black dark:text-white" />
                    </button>
                    <div className="flex items-center gap-3">
                        {restaurant.logo_url ? (
                            <Image
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]">
                                <span className="text-lg font-bold text-white">
                                    {restaurant.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <h1 className="font-manrope text-lg font-bold text-black dark:text-white">
                            {restaurant.name}
                        </h1>
                    </div>
                </div>

                {/* Tab Navigation */}
                <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Content */}
            <main className="px-4 py-6">
                {/* Location Tab */}
                {activeTab === 'location' && (
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl bg-[var(--card)] shadow-sm">
                            {restaurant.latitude && restaurant.longitude ? (
                                <LocationMap
                                    latitude={restaurant.latitude}
                                    longitude={restaurant.longitude}
                                    name={restaurant.name}
                                />
                            ) : (
                                <div className="flex h-64 items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <p className="text-gray-500">Map not available</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm">
                            <h2 className="font-manrope mb-4 text-lg font-bold text-black dark:text-white">
                                Address
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {restaurant.address ?? 'Address not available'}
                            </p>
                            {restaurant.city && (
                                <p className="mt-1 text-gray-500">{restaurant.city}, Ethiopia</p>
                            )}

                            {restaurant.latitude && restaurant.longitude && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
                                >
                                    <Navigation className="h-4 w-4" />
                                    Get Directions
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Hours Tab */}
                {activeTab === 'hours' && (
                    <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm">
                        <h2 className="font-manrope mb-4 text-lg font-bold text-black dark:text-white">
                            Opening Hours
                        </h2>

                        {restaurant.opening_hours ? (
                            <div className="space-y-3">
                                {DAYS_OF_WEEK.map(day => {
                                    const hours = restaurant.opening_hours?.[day.key];
                                    const today = new Date();
                                    const dayNames = [
                                        'sunday',
                                        'monday',
                                        'tuesday',
                                        'wednesday',
                                        'thursday',
                                        'friday',
                                        'saturday',
                                    ];
                                    const isToday = dayNames[today.getDay()] === day.key;

                                    return (
                                        <div
                                            key={day.key}
                                            className={`flex items-center justify-between py-2 ${
                                                isToday
                                                    ? '-mx-2 rounded-lg bg-[var(--primary)]/10 px-2'
                                                    : ''
                                            }`}
                                        >
                                            <div>
                                                <span
                                                    className={`font-medium ${isToday ? 'text-[var(--primary)]' : 'text-black dark:text-white'}`}
                                                >
                                                    {day.label}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-400">
                                                    ({day.labelAm})
                                                </span>
                                                {isToday && (
                                                    <span className="ml-2 rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`text-sm ${hours?.closed ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                                            >
                                                {hours?.closed
                                                    ? 'Closed'
                                                    : hours
                                                      ? `${hours.open} - ${hours.close}`
                                                      : 'Not set'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500">Opening hours not available</p>
                        )}
                    </div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                    <div className="space-y-4">
                        {restaurant.phone && (
                            <a
                                href={`tel:${restaurant.phone}`}
                                className="flex items-center gap-4 rounded-2xl bg-[var(--card)] p-4 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium text-black dark:text-white">
                                        {restaurant.phone}
                                    </p>
                                </div>
                            </a>
                        )}

                        {restaurant.email && (
                            <a
                                href={`mailto:${restaurant.email}`}
                                className="flex items-center gap-4 rounded-2xl bg-[var(--card)] p-4 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-black dark:text-white">
                                        {restaurant.email}
                                    </p>
                                </div>
                            </a>
                        )}

                        {restaurant.website && (
                            <a
                                href={restaurant.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 rounded-2xl bg-[var(--card)] p-4 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Navigation className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Website</p>
                                    <p className="font-medium text-black dark:text-white">
                                        {restaurant.website.replace(/^https?:\/\//, '')}
                                    </p>
                                </div>
                            </a>
                        )}

                        {restaurant.social_links &&
                            Object.keys(restaurant.social_links).length > 0 && (
                                <div className="rounded-2xl bg-[var(--card)] p-4 shadow-sm">
                                    <h3 className="mb-3 font-medium text-black dark:text-white">
                                        Follow Us
                                    </h3>
                                    <div className="flex gap-3">
                                        {Object.entries(restaurant.social_links).map(
                                            ([platform, url]) => (
                                                <a
                                                    key={platform}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                >
                                                    <span className="text-xs font-bold text-gray-600 uppercase dark:text-gray-300">
                                                        {platform.slice(0, 2)}
                                                    </span>
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {!restaurant.phone && !restaurant.email && !restaurant.website && (
                            <div className="rounded-2xl bg-[var(--card)] p-6 text-center shadow-sm">
                                <p className="text-gray-500">Contact information not available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm">
                            <h2 className="font-manrope mb-4 text-lg font-bold text-black dark:text-white">
                                About {restaurant.name}
                            </h2>

                            {restaurant.description ? (
                                <div className="space-y-4">
                                    <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                                        {restaurant.description}
                                    </p>

                                    {restaurant.description_am && (
                                        <p className="mt-4 border-t border-gray-200 pt-4 text-sm leading-relaxed text-gray-500 dark:border-gray-700">
                                            {restaurant.description_am}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">No description available</p>
                            )}
                        </div>

                        {restaurant.logo_url && (
                            <div className="rounded-2xl bg-[var(--card)] p-6 text-center shadow-sm">
                                <Image
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    width={120}
                                    height={120}
                                    className="mx-auto rounded-xl object-cover"
                                />
                                <p className="mt-4 text-sm text-gray-500">
                                    Thank you for dining with us!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function RestaurantInfoPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
                    <div className="flex animate-pulse flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-xl bg-gray-300" />
                        <div className="h-6 w-48 rounded bg-gray-300" />
                    </div>
                </div>
            }
        >
            <RestaurantInfoContent />
        </Suspense>
    );
}
