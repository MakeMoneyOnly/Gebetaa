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
        label: 'Recalled',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        borderColor: 'border-purple-200',
        icon: <RefreshCw size={16} />,
    },
};

function PauseCircleIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="10" y1="15" x2="10" y2="9" />
            <line x1="14" y1="15" x2="14" y2="9" />
        </svg>
    );
}

// ── Tracker Content ────────────────────────────────────────────────────────────

function TrackerContent() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const slug = params.slug;

    const orderId = searchParams.get('order_id');
    const tableNumber = searchParams.get('table');
    const sig = searchParams.get('sig');
    const exp = searchParams.get('exp');

    const [items, setItems] = useState<KdsItem[]>([]);
    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Fetch initial data
    useEffect(() => {
        async function fetchOrderData() {
            if (!orderId) {
                setError('No order ID provided');
                setLoading(false);
                return;
            }

            try {
                // Fetch restaurant name
                const { data: restaurant } = await supabase
                    .from('restaurants')
                    .select('name')
                    .eq('slug', slug)
                    .single();

                if (restaurant) {
                    setRestaurantName(restaurant.name);
                }

                // Fetch order items with KDS status
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('id, order_number, table_number, status, created_at, total_price')
                    .eq('id', orderId)
                    .single();

                if (orderError) throw orderError;
                setOrder(orderData);

                // Fetch order items
                const { data: orderItems, error: itemsError } = await supabase
                    .from('order_items')
                    .select(
                        'id, name, quantity, notes, modifiers, kds_status, kds_station, started_at, ready_at'
                    )
                    .eq('order_id', orderId);

                if (itemsError) throw itemsError;

                setItems(
                    (orderItems || []).map(
                        (item: {
                            id: string;
                            name: string;
                            quantity: number;
                            notes?: string | null;
                            modifiers?: string[] | null;
                            kds_status?: string | null;
                            kds_station?: string | null;
                            started_at?: string | null;
                            ready_at?: string | null;
                        }) => ({
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            station: item.kds_station || 'kitchen',
                            status: (item.kds_status as KdsStatus) || 'queued',
                            notes: item.notes,
                            modifiers: item.modifiers,
                            started_at: item.started_at,
                            ready_at: item.ready_at,
                        })
                    )
                );

                setLastRefresh(new Date());
            } catch (err) {
                console.error('Error fetching order data:', err);
                setError('Failed to load order status');
            } finally {
                setLoading(false);
            }
        }

        fetchOrderData();
    }, [orderId, slug, supabase]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!orderId) return;

        channelRef.current = supabase
            .channel(`order-tracker:${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'order_items',
                    filter: `order_id=eq.${orderId}`,
                },
                (payload: { new: unknown }) => {
                    const updatedItem = payload.new as KdsItem & { id: string };
                    setItems(prev =>
                        prev.map(item =>
                            item.id === updatedItem.id
                                ? {
                                      ...item,
                                      status: updatedItem.status,
                                      started_at: updatedItem.started_at,
                                      ready_at: updatedItem.ready_at,
                                  }
                                : item
                        )
                    );
                    setLastRefresh(new Date());
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [orderId, supabase]);

    // Poll for updates every 8 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!orderId) return;

            const { data: orderItems } = await supabase
                .from('order_items')
                .select('id, kds_status, started_at, ready_at')
                .eq('order_id', orderId);

            if (orderItems) {
                setItems(prev =>
                    prev.map(item => {
                        const updated = orderItems.find((oi: { id: string }) => oi.id === item.id);
                        if (updated) {
                            return {
                                ...item,
                                status: (updated.kds_status as KdsStatus) || item.status,
                                started_at: updated.started_at,
                                ready_at: updated.ready_at,
                            };
                        }
                        return item;
                    })
                );
                setLastRefresh(new Date());
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [orderId, supabase]);

    // Group items by status
    const itemsByStatus = useMemo(() => {
        const grouped: Record<KdsStatus, KdsItem[]> = {
            queued: [],
            in_progress: [],
            on_hold: [],
            ready: [],
            recalled: [],
        };

        for (const item of items) {
            grouped[item.status].push(item);
        }

        return grouped;
    }, [items]);

    const allReady = items.length > 0 && items.every(item => item.status === 'ready');

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <ChefHat className="h-10 w-10 animate-pulse text-slate-300" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
                <div className="rounded-xl bg-red-50 p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <Link
                        href={`/${slug}/menu`}
                        className="bg-brand-500 hover:bg-brand-600 mt-4 inline-block rounded-lg px-4 py-2 text-white"
                    >
                        Back to Menu
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-lg">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href={`/${slug}/menu`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {restaurantName || 'Order Tracker'}
                        </h1>
                        {order?.order_number && (
                            <p className="text-sm text-slate-500">Order #{order.order_number}</p>
                        )}
                    </div>
                </div>

                {/* All ready banner */}
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

                {/* Items by status */}
                <div className="space-y-4">
                    {(['in_progress', 'queued', 'on_hold', 'ready'] as KdsStatus[]).map(status => {
                        const statusItems = itemsByStatus[status];
                        if (statusItems.length === 0) return null;

                        const config = STATUS_CONFIG[status];

                        return (
                            <div key={status} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${config.color}`}>
                                        {config.icon}
                                        <span className="ml-1">{config.label}</span>
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        ({statusItems.length})
                                    </span>
                                </div>

                                {statusItems.map(item => (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border ${config.borderColor} ${config.bg} p-4`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {item.quantity}× {item.name}
                                                </p>
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {item.modifiers.join(', ')}
                                                    </p>
                                                )}
                                                {item.notes && (
                                                    <p className="mt-1 text-xs text-slate-400 italic">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Last updated */}
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

export default function TrackerClient() {
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
