'use client';

/**
 * Merchant Dashboard Client Component
 *
 * This component receives initial data from a Server Component,
 * eliminating the loading flash on initial render.
 *
 * Architecture Pattern:
 * - Server Component fetches initial data (no loading state)
 * - Client Component handles interactivity (filters, refresh, realtime)
 * - Supabase Realtime merges live updates with server data
 *
 * Performance Benefits:
 * - No loading skeleton on initial page load
 * - Instant render with server-provided data
 * - Realtime updates for live metrics
 */

import { type ComponentType, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    CalendarCheck,
    CheckCircle,
    ChevronDown,
    Clock,
    ListOrdered,
    MoreHorizontal,
    PauseCircle,
    PlayCircle,
    Timer,
    Users,
    Wallet,
    Star,
    Utensils,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { AttentionQueuePanel } from '@/components/merchant/command-center/AttentionQueuePanel';
import { KdsReliabilityPanel } from '@/components/merchant/KdsReliabilityPanel';
import { AlertRuleBuilderDrawer } from '@/components/merchant/command-center/AlertRuleBuilderDrawer';
import {
    AttentionItem,
    CommandCenterRange,
    CommandCenterMetrics,
} from '@/components/merchant/command-center/types';
import { isAbortError } from '@/hooks/useSafeFetch';
import { useMerchantActivity } from '@/hooks/useMerchantActivity';
import type { CommandCenterData } from '@/lib/services/dashboardDataService';

const STALE_AFTER_MS = 90_000;

const EMPTY_METRICS: CommandCenterMetrics = {
    orders_in_flight: 0,
    avg_ticket_time_minutes: 0,
    active_tables: 0,
    open_requests: 0,
    payment_success_rate: 0,
    gross_sales_today: 0,
    total_orders_today: 0,
    avg_order_value_etb: 0,
    unique_tables_today: 0,
};

function nextOrderStatus(status: string) {
    switch (status) {
        case 'pending':
            return 'acknowledged';
        case 'acknowledged':
            return 'preparing';
        case 'preparing':
            return 'ready';
        case 'ready':
            return 'served';
        case 'served':
            return 'completed';
        default:
            return null;
    }
}

interface MerchantDashboardClientProps {
    initialData: CommandCenterData | null;
}

export function MerchantDashboardClient({ initialData }: MerchantDashboardClientProps) {
    const router = useRouter();
    const [range, setRange] = useState<CommandCenterRange>('today');

    // Initialize state with server data - NO loading flash!
    const [commandCenter, setCommandCenter] = useState<CommandCenterData | null>(
        initialData ?? null
    );

    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeTick, setTimeTick] = useState(Date.now());
    const [filterOpen, setFilterOpen] = useState(false);
    const [alertRuleDrawerOpen, setAlertRuleDrawerOpen] = useState(false);

    const { restaurantName } = useMerchantActivity();

    // Ref for abort controller
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchCommandCenter = useCallback(
        async (isManualRefresh = false, signal?: AbortSignal) => {
            if (isManualRefresh) {
                setRefreshing(true);
            }

            try {
                const response = await fetch(`/api/merchant/command-center?range=${range}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal,
                });
                if (!response.ok) {
                    throw new Error(`Command center request failed (${response.status})`);
                }

                const payload = await response.json();
                setCommandCenter(payload?.data ?? null);
                setError(null);
            } catch (fetchError) {
                // Silently ignore abort errors
                if (isAbortError(fetchError)) {
                    return;
                }
                setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
            } finally {
                setRefreshing(false);
            }
        },
        [range]
    );

    // Fetch when range changes
    useEffect(() => {
        // Abort any pending requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        fetchCommandCenter(false, signal);

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [fetchCommandCenter]);

    // Time tick for staleness detection
    useEffect(() => {
        const intervalId = window.setInterval(() => setTimeTick(Date.now()), 30_000);
        return () => window.clearInterval(intervalId);
    }, []);

    // Event listeners for refresh and alert rules
    useEffect(() => {
        const onRefresh = () => {
            fetchCommandCenter(true);
        };
        const onOpenAlertRules = () => {
            setAlertRuleDrawerOpen(true);
        };
        window.addEventListener('merchant:command-center-refresh', onRefresh);
        window.addEventListener('merchant:open-alert-rules', onOpenAlertRules);
        return () => {
            window.removeEventListener('merchant:command-center-refresh', onRefresh);
            window.removeEventListener('merchant:open-alert-rules', onOpenAlertRules);
        };
    }, [fetchCommandCenter]);

    const metrics = commandCenter?.metrics ?? EMPTY_METRICS;
    const queue = useMemo(() => commandCenter?.attention_queue ?? [], [commandCenter]);
    const generatedAt = commandCenter?.sync_status.generated_at;
    const isStale = useMemo(() => {
        if (!generatedAt) return true;
        return timeTick - new Date(generatedAt).getTime() > STALE_AFTER_MS;
    }, [generatedAt, timeTick]);

    const queueForPreset = queue;

    const activeOrders = queueForPreset
        .filter(item => item.type === 'order')
        .slice(0, 4)
        .map(item => {
            const statusLower = item.status.toLowerCase();
            const isReady = ['ready', 'served', 'completed'].includes(statusLower);
            const isHold = statusLower === 'acknowledged';

            return {
                id: item.id,
                title: `${item.label}${item.table_number ? ` (Table ${item.table_number})` : ''}`,
                status: item.status,
                statusColor: isReady
                    ? 'text-green-500'
                    : isHold
                      ? 'text-blue-500'
                      : 'text-orange-500',
                time: item.created_at
                    ? `${Math.max(0, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000))}m`
                    : '0m',
                icon: isReady ? CheckCircle : isHold ? PauseCircle : PlayCircle,
                iconBg: isReady
                    ? 'bg-green-50 text-green-500'
                    : isHold
                      ? 'bg-orange-50 text-orange-500'
                      : 'bg-blue-50 text-blue-500',
            };
        });

    const handleAdvanceOrder = useCallback(
        async (item: AttentionItem) => {
            if (item.type !== 'order') return;
            const next = nextOrderStatus(item.status);
            if (!next) return;

            try {
                const response = await fetch(`/api/orders/${item.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: next }),
                });
                if (!response.ok) {
                    throw new Error(`Unable to advance order (${response.status})`);
                }
                fetchCommandCenter(true);
            } catch (advanceError) {
                // Silently ignore abort errors
                if (isAbortError(advanceError)) {
                    return;
                }
                setError(
                    advanceError instanceof Error
                        ? advanceError.message
                        : 'Failed to advance order status'
                );
            }
        },
        [fetchCommandCenter]
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Hello, {restaurantName}
                    </h1>
                    <p className="font-medium text-gray-500">
                        Here's your daily performance summary.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-gray-50 px-3 py-2 text-sm font-bold text-black">
                        {new Date().toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <button className="bg-brand-crimson flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#a0151e]">
                        <CalendarCheck className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${error ? 'bg-rose-100 text-rose-700' : isStale ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                        {error ? 'SYNC FAILED' : isStale ? 'STALE DATA' : 'IN SYNC'}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                        Last sync:{' '}
                        {generatedAt
                            ? new Date(generatedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : 'never'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAlertRuleDrawerOpen(true)}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700"
                    >
                        Alert Rules
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(value => !value)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 capitalize"
                        >
                            {range}
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {filterOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-28 rounded-xl bg-white p-1 shadow-lg">
                                {(['today', 'week', 'month'] as CommandCenterRange[]).map(
                                    option => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setRange(option);
                                                setFilterOpen(false);
                                            }}
                                            className={`w-full rounded-lg px-2.5 py-2 text-left text-sm capitalize ${range === option ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {option}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fetchCommandCenter(true)}
                        className="bg-brand-crimson h-10 rounded-xl px-4 text-sm font-bold text-white hover:bg-[#a0151e]"
                        disabled={refreshing}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                <MetricCard
                    icon={ListOrdered}
                    chip="Live"
                    value={metrics.orders_in_flight}
                    label="Orders In Flight"
                    subLabel={`${metrics.total_orders_today} total in range`}
                    tone="blue"
                    progress={Math.min(20, Math.max(1, metrics.orders_in_flight))}
                    targetLabel="Target: 20"
                    currentLabel={`Current: ${metrics.orders_in_flight}`}
                />
                <MetricCard
                    icon={Timer}
                    chip="Live"
                    value={`${metrics.avg_ticket_time_minutes}m`}
                    label="Avg Ticket Time"
                    subLabel="Open to served/completed"
                    tone="rose"
                    progress={Math.min(
                        20,
                        Math.max(1, Math.round(20 - metrics.avg_ticket_time_minutes / 3))
                    )}
                    targetLabel="Target: 40m"
                    currentLabel={`Current: ${metrics.avg_ticket_time_minutes}m`}
                />
                <MetricCard
                    icon={Users}
                    chip={`${metrics.unique_tables_today}`}
                    value={metrics.active_tables}
                    label="Active Tables"
                    subLabel="Current service load"
                    tone="purple"
                    progress={Math.min(20, Math.max(1, metrics.active_tables))}
                    targetLabel="Target: 20"
                    currentLabel={`Current: ${metrics.active_tables}`}
                />
                <MetricCard
                    icon={Wallet}
                    chip={`${metrics.payment_success_rate}%`}
                    value={metrics.open_requests}
                    label="Open Requests"
                    subLabel={`Payment success ${metrics.payment_success_rate}%`}
                    tone="green"
                    progress={Math.min(20, Math.max(1, metrics.open_requests))}
                    targetLabel="Target: 5"
                    currentLabel={`Current: ${metrics.open_requests}`}
                />
            </div>

            {/* Income Tracker */}
            <div className="rounded-[2.5rem] bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-start justify-between">
                    <div className="max-w-xl">
                        <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
                            Income Tracker
                        </h2>
                        <p className="text-sm font-medium text-gray-500">
                            Real-time analysis of your daily revenue streams.
                        </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-500">
                        Gross ETB {metrics.gross_sales_today}
                    </span>
                </div>
                <div className="flex h-full flex-col items-center gap-12 xl:flex-row">
                    <div className="flex h-full w-full flex-1 flex-col justify-center pl-[35px]">
                        <span className="block text-[3.5rem] leading-none font-bold tracking-tighter text-slate-900">
                            {metrics.payment_success_rate}%
                        </span>
                        <p className="text-lg leading-relaxed font-medium text-wrap text-slate-500">
                            Payment success in current range
                        </p>
                    </div>
                    <div className="h-full min-h-[350px] w-full flex-[4] overflow-hidden">
                        <RevenueChart />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-black">Active Orders</h2>
                        <span className="bg-brand-crimson rounded-full px-3 py-1 text-xs font-bold text-white">
                            {metrics.orders_in_flight} Pending
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {activeOrders.map(order => (
                        <div
                            key={order.id}
                            className="group flex cursor-pointer items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex flex-1 items-center gap-4">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${order.iconBg}`}
                                >
                                    <order.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-bold text-gray-900">
                                        {order.title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">
                                            {order.time} ago
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1">
                                    <div
                                        className={`h-2 w-2 rounded-full ${order.statusColor.replace('text-', 'bg-')}`}
                                    />
                                    <span className={`text-xs font-bold ${order.statusColor}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <button className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-black">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AttentionQueuePanel
                items={queueForPreset}
                loading={false}
                error={error}
                onRetry={() => fetchCommandCenter(true)}
                onAdvanceOrder={handleAdvanceOrder}
                onOpenOrders={() => router.push('/merchant/orders')}
                onOpenTables={() => router.push('/merchant/tables')}
                onOpenSettings={() => router.push('/merchant/settings')}
            />

            <KdsReliabilityPanel />

            <AlertRuleBuilderDrawer
                open={alertRuleDrawerOpen}
                onClose={() => setAlertRuleDrawerOpen(false)}
            />
        </div>
    );
}

function MetricCard({
    icon: Icon,
    chip,
    value,
    label,
    subLabel,
    tone,
    progress,
    targetLabel,
    currentLabel,
}: {
    icon: ComponentType<{ className?: string }>;
    chip: string;
    value: string | number;
    label: string;
    subLabel: string;
    tone: 'blue' | 'rose' | 'green' | 'purple';
    progress: number;
    targetLabel: string;
    currentLabel: string;
}) {
    const toneMap = {
        blue: 'bg-blue-500',
        rose: 'bg-rose-500',
        green: 'bg-green-600',
        purple: 'bg-purple-500',
    };

    return (
        <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-2 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                        {chip}
                    </span>
                    <h3 className="mt-[20px] text-4xl font-bold tracking-tight text-gray-900">
                        {value}
                    </h3>
                </div>
            </div>
            <div className="absolute right-5 bottom-5 left-5">
                <div className="mb-3">
                    <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">{label}</h3>
                    <p className="text-xs font-medium text-gray-400">{subLabel}</p>
                </div>
                <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const isActive = i < progress;
                        const opacity = isActive ? 0.3 + 0.7 * (i / Math.max(progress, 1)) : 1;
                        return (
                            <div
                                key={i}
                                style={{ opacity: isActive ? opacity : 1 }}
                                className={`h-[11px] w-[11px] rounded-full ${isActive ? toneMap[tone] : 'bg-gray-100'}`}
                            />
                        );
                    })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-medium text-gray-400">
                    <span>{targetLabel}</span>
                    <span>{currentLabel}</span>
                </div>
            </div>
        </div>
    );
}
