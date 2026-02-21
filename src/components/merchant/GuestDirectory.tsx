'use client';

import React, { useMemo } from 'react';
import { Search, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GuestDirectoryRow = {
    id: string;
    name: string | null;
    language: string;
    tags: string[];
    is_vip: boolean;
    first_seen_at: string;
    last_seen_at: string;
    visit_count: number;
    lifetime_value: number;
    created_at: string;
    updated_at: string;
};

type Segment = 'all' | 'vip' | 'returning' | 'new';

interface GuestDirectoryProps {
    guests: GuestDirectoryRow[];
    loading: boolean;
    error: string | null;
    query: string;
    onQueryChange: (value: string) => void;
    segment: Segment;
    onSegmentChange: (value: Segment) => void;
    tagFilter: string;
    onTagFilterChange: (value: string) => void;
    onOpenGuest: (guestId: string) => void;
}

const SEGMENTS: { id: Segment; label: string }[] = [
    { id: 'all', label: 'All Guests' },
    { id: 'vip', label: 'VIP' },
    { id: 'returning', label: 'Returning' },
    { id: 'new', label: 'New' },
];

const DASHBOARD_LOCALE = 'en-ET';

function formatGuestLanguage(language: string): string {
    if (language === 'am') return 'Amharic';
    if (language === 'en') return 'English';
    return language.toUpperCase();
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat(DASHBOARD_LOCALE, {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function GuestDirectory({
    guests,
    loading,
    error,
    query,
    onQueryChange,
    segment,
    onSegmentChange,
    tagFilter,
    onTagFilterChange,
    onOpenGuest,
}: GuestDirectoryProps) {
    const topTags = useMemo(() => {
        const counts = new Map<string, number>();
        for (const guest of guests) {
            for (const tag of guest.tags ?? []) {
                const normalized = tag.trim();
                if (!normalized) continue;
                counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
            }
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([tag]) => tag);
    }, [guests]);

    return (
        <div className="space-y-6">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={event => onQueryChange(event.target.value)}
                            placeholder="Search guests by name..."
                            aria-label="Search guests by name"
                            className="h-11 w-full rounded-xl border border-gray-200 pr-3 pl-9 text-sm outline-none focus:border-gray-400"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SEGMENTS.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSegmentChange(item.id)}
                                className={cn(
                                    'h-10 rounded-xl px-3 text-xs font-semibold',
                                    segment === item.id
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {topTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onTagFilterChange('')}
                            className={cn(
                                'h-8 rounded-lg px-2 text-[11px] font-semibold',
                                tagFilter.length === 0
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            )}
                        >
                            All Tags
                        </button>
                        {topTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagFilterChange(tag)}
                                className={cn(
                                    'h-8 rounded-lg px-2 text-[11px] font-semibold',
                                    tagFilter === tag
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                )}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <p role="alert" className="text-sm font-semibold text-amber-700">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="min-h-[180px] animate-pulse rounded-[2rem] bg-white p-5 shadow-sm"
                        >
                            <div className="h-4 w-28 rounded bg-gray-100" />
                            <div className="mt-3 h-3 w-20 rounded bg-gray-100" />
                            <div className="mt-8 h-8 w-full rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
            ) : guests.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                    <p className="text-base font-semibold text-gray-700">No guests found.</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Adjust search and segment filters to continue.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {guests.map(guest => (
                        <button
                            key={guest.id}
                            type="button"
                            onClick={() => onOpenGuest(guest.id)}
                            aria-label={`Open guest profile for ${guest.name?.trim() || `Guest ${guest.id.slice(0, 8)}`}`}
                            className="rounded-[2rem] border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                                    <User className="h-5 w-5" />
                                </div>
                                {guest.is_vip && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
                                        <Star className="h-3 w-3" />
                                        VIP
                                    </span>
                                )}
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-gray-900">
                                {guest.name?.trim() || `Guest ${guest.id.slice(0, 8)}`}
                            </h3>
                            <p className="mt-1 text-xs tracking-wide text-gray-500 uppercase">
                                {formatGuestLanguage(guest.language)}
                            </p>

                            <div className="mt-4 flex items-center gap-3 text-xs text-gray-600">
                                <span>{guest.visit_count} visits</span>
                                <span>{formatCurrency(Number(guest.lifetime_value ?? 0))}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Last seen{' '}
                                {new Date(guest.last_seen_at).toLocaleDateString(DASHBOARD_LOCALE)}
                            </p>

                            {(guest.tags?.length ?? 0) > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {guest.tags.slice(0, 4).map(tag => (
                                        <span
                                            key={`${guest.id}-${tag}`}
                                            className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
