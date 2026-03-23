'use client';

/**
 * Live Guest Order Tracker — /[slug]/tracker
 *
 * Shows real-time prep status of each item after a guest places an order.
 * Accessed from the success screen or via a deep-link: /<slug>/tracker?order_id=...&table=...&sig=...&exp=...
 * Polls /api/guest/track every 8 seconds and subscribes to Supabase Realtime for instant updates.
 */

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
    ChefHat,
    Clock,
    CheckCircle2,
    FlameKindling,
    PackageCheck,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react';
import { formatETBCurrency } from '@/lib/format/et';

// ── Types ─────────────────────────────────────────────────────────────────────

type KdsStatus = 'queued' | 'in_progress' | 'on_hold' | 'ready' | 'recalled';

interface KdsItem {
    id: string;
    name: string;
    quantity: number;
    station: string;
    status: KdsStatus;
    notes?: string | null;
    modifiers?: string[] | null;
    started_at?: string | null;
    ready_at?: string | null;
}

interface OrderSummary {
    id: string;
    order_number: string;
    table_number: string;
    status: string;
    created_at: string;
    total_price: number;
}

// ── Status step config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    KdsStatus,
    { label: string; color: string; bg: string; borderColor: string; icon: React.ReactNode }
> = {
    queued: {
        label: 'Queued',
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        borderColor: 'border-slate-200',
        icon: <Clock size={16} />,
    },
    in_progress: {
        label: 'Being prepared',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: <FlameKindling size={16} />,
    },
    on_hold: {
        label: 'On hold',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <PauseCircleIcon size={16} />,
    },
    ready: {
        label: 'Ready',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        icon: <CheckCircle2 size={16} />,
    },
    recalled: {
        label: 'Being re-fired',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        borderColor: 'border-rose-200',
        icon: <FlameKindling size={16} />,
    },
};

const ORDER_STATUS_STEPS = ['pending', 'acknowledged', 'preparing', 'ready', 'served'] as const;

function PauseCircleIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="10" x2="10" y1="15" y2="9" />
            <line x1="14" x2="14" y1="15" y2="9" />
        </svg>
    );
}

function getOrderStepIndex(status: string) {
    const idx = ORDER_STATUS_STEPS.indexOf(status as (typeof ORDER_STATUS_STEPS)[number]);
    return idx < 0 ? 0 : idx;
}

function elapsedLabel(createdAt: string): string {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return 'Just placed';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

function TrackerContent() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const slug = params.slug;

    const orderId = searchParams.get('order_id') ?? '';
    const table = searchParams.get('table') ?? '';
    const sig = searchParams.get('sig') ?? '';
    const exp = searchParams.get('exp') ?? '';

    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [items, setItems] = useState<KdsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const supabase = useMemo(() => createClient(), []);
    const isMountedRef = useRef(true);

    // Build the tracking URL once
    const trackUrl = useMemo(() => {
        if (!orderId || !sig || !exp || !table) return null;
        const u = new URL(
            '/api/guest/track',
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        );
        u.searchParams.set('slug', slug);
        u.searchParams.set('order_id', orderId);
        u.searchParams.set('table', table);
        u.searchParams.set('sig', sig);
        u.searchParams.set('exp', exp);
        return u.toString();
    }, [slug, orderId, table, sig, exp]);

    const fetchStatus = async (silent = false) => {
        if (!trackUrl) return;
        if (!silent) setLoading(true);
        try {
            const res = await fetch(trackUrl, { cache: 'no-store' });
            const payload = await res.json();
            if (!isMountedRef.current) return;
            if (!res.ok) {
                setError(payload?.error ?? 'Failed to load order status.');
                return;
            }
            setOrder(payload.data.order);
            setItems(payload.data.items ?? []);
            setLastRefresh(new Date());
            setError(null);
        } catch {
            if (isMountedRef.current) setError('Network error. Pull to refresh.');
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        isMountedRef.current = true;
        void fetchStatus();
        return () => {
            isMountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackUrl]);

    // Polling every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            void fetchStatus(true);
        }, 8000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackUrl]);

    // Realtime subscription on kds_order_items for instant updates
    useEffect(() => {
        if (!orderId) return;
        const channel = supabase
            .channel(`tracker-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'kds_order_items',
                    filter: `order_id=eq.${orderId}`,
                },
                () => {
                    void fetchStatus(true);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                () => {
                    void fetchStatus(true);
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, supabase]);

    // Derived aggregates
    const totalItems = items.length;
    const readyItems = items.filter(i => i.status === 'ready').length;
    const progressPct = totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0;
    const allReady = totalItems > 0 && readyItems === totalItems;
    const orderStepIndex = getOrderStepIndex(order?.status ?? 'pending');

    if (loading && !order) {
        return (
            <main className="font-manrope flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <ChefHat className="h-10 w-10 animate-pulse" />
                    <p className="text-sm font-medium">Loading your order...</p>
                </div>
            </main>
        );
    }

    if (error && !order) {
        return (
            <main className="font-manrope flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
                <ChefHat className="h-12 w-12 text-slate-300" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Can't load order
                </h1>
                <p className="text-sm font-medium text-slate-500">{error}</p>
                <button
                    onClick={() => void fetchStatus()}
                    className="mt-2 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </main>
        );
    }

    return (
        <main className="font-manrope min-h-screen bg-[#f8fafc] pb-12">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-md">
                <div className="mx-auto flex max-w-lg items-center justify-between">
                    <Link
                        href={`/${slug}?table=${table}&sig=${sig}&exp=${exp}&entry=menu`}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                        <ArrowLeft size={16} /> Menu
                    </Link>
                    <div className="text-center">
                        <p className="text-xs font-semibold text-slate-400">Live tracker</p>
                        {order && (
                            <p className="text-sm font-bold text-slate-900">
                                Order #{order.order_number}{' '}
                                <span className="mx-1 font-normal text-slate-300">/</span> Table{' '}
                                {order.table_number}
                                <span className="mx-1 font-normal text-slate-300">·</span>{' '}
                                {formatETBCurrency(order.total_price)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => void fetchStatus(true)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
                {/* ── Order Progress Card ──────────────────────────────────── */}
                <div
                    className={`card-shadow overflow-hidden rounded-4xl transition-all ${
                        allReady ? 'ring-2 ring-emerald-500/10' : ''
                    } bg-white`}
                >
                    <div className="p-6 md:p-8">
                        {/* Overall progress bar */}
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                    {allReady ? 'Your food is ready!' : 'Kitchen is cooking...'}
                                </h1>
                                <p className="mt-1 text-sm font-medium text-slate-500 md:mt-2">
                                    {order ? elapsedLabel(order.created_at) : ''}
                                    {totalItems > 0 && <span className="mx-1.5">·</span>}
                                    {totalItems > 0 && `${readyItems}/${totalItems} items ready`}
                                </p>
                            </div>
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-sm ${
                                    allReady
                                        ? 'bg-emerald-500 text-white'
                                        : 'border border-slate-100 bg-slate-50 text-slate-700'
                                }`}
                            >
                                {progressPct}%
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 inset-shadow-sm">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    allReady ? 'bg-emerald-500' : 'bg-slate-900'
                                }`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>

                    {/* ── Order Status Steps ────────────────────────────────── */}
                    <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-6 md:px-8">
                        <div className="relative z-0 flex items-start justify-between">
                            {/* Connector line background */}
                            <div className="absolute top-[11px] right-6 left-6 -z-10 h-[2px] bg-slate-200" />
                            {/* Connector line active */}
                            <div
                                className="absolute top-[11px] left-6 -z-10 h-[2px] bg-slate-900 transition-all duration-700 ease-out"
                                style={{ width: `calc(${(orderStepIndex / 4) * 100}% - 3rem)` }}
                            />

                            {(['Received', 'Confirmed', 'Cooking', 'Ready', 'Served'] as const).map(
                                (label, idx) => {
                                    const isActive = idx === orderStepIndex;
                                    const isDone = idx < orderStepIndex;
                                    return (
                                        <div
                                            key={label}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <div
                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-500 ${
                                                    isDone
                                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                                        : isActive
                                                          ? 'border-2 border-slate-900 bg-white text-slate-900 shadow-sm ring-4 ring-slate-900/10'
                                                          : 'border border-slate-200 bg-white text-slate-400'
                                                }`}
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 size={12} strokeWidth={3} />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                            <p
                                                className={`mt-1 text-[11px] font-semibold transition-colors ${
                                                    isDone || isActive
                                                        ? 'text-slate-800'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                {label}
                                            </p>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Item-Level Status Cards ──────────────────────────────── */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">
                            Active items
                        </h2>
                        {totalItems > 0 && (
                            <span className="rounded-full bg-slate-200/60 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                {totalItems} total
                            </span>
                        )}
                    </div>

                    {items.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {items.map(item => {
                                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.queued;
                                const isReady = item.status === 'ready';
                                return (
                                    <div
                                        key={item.id}
                                        className="group card-shadow hover:card-shadow-lg flex flex-col gap-3 rounded-3xl bg-white p-5 text-left transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                                                        isReady
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    {isReady ? (
                                                        <PackageCheck size={24} />
                                                    ) : (
                                                        <ChefHat size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-base leading-tight font-bold text-slate-900">
                                                        {item.quantity}× {item.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-medium text-slate-500 capitalize">
                                                        {item.station} station
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${cfg.color} ${cfg.bg}`}
                                            >
                                                {cfg.icon}
                                                {cfg.label}
                                            </div>
                                        </div>

                                        {(item.notes ||
                                            (item.modifiers && item.modifiers.length > 0)) && (
                                            <div className="mt-2 pl-[60px]">
                                                {item.notes && (
                                                    <p className="mb-2 text-sm font-medium text-slate-500 italic">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.modifiers.map((mod, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-lg border border-slate-200/60 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600"
                                                            >
                                                                {mod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-slate-200 bg-white/50 p-10 text-center">
                            <ChefHat className="mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-base font-bold text-slate-900">
                                Retrieving items...
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                The kitchen is processing your ticket.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── All Ready Banner ─────────────────────────────────────── */}
                {allReady && (
                    <div className="card-shadow rounded-4xl border border-emerald-100 bg-emerald-50 p-6 text-center md:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <PackageCheck className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-emerald-900">
                            Your food is ready!
                        </h2>
                        <p className="mt-2 text-base font-medium text-emerald-700/80">
                            Your waiter will bring it to your table shortly.
                        </p>
                    </div>
                )}

                {/* ── Last updated ──────────────────────────────────────────── */}
                <p className="pt-4 text-center text-xs font-medium text-slate-400">
                    Last updated{' '}
                    {lastRefresh.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })}{' '}
                    · Auto-refreshes every 8s
                </p>
            </div>
        </main>
    );
}

export default function TrackerPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-50">
                    <ChefHat className="h-10 w-10 animate-pulse text-slate-300" />
                </main>
            }
        >
            <TrackerContent />
        </Suspense>
    );
}
