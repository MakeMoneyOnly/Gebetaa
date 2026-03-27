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
import { formatETBCurrency } from '@/lib/format/et';
import {
    Bell,
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
    UtensilsCrossed,
    Wallet,
} from 'lucide-react';

import { MetricCard } from '@/components/merchant/MetricCard';
import { RevenueChart } from '@/components/merchant/RevenueChart';

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
    gross_sales_previous: 0,
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

    const activeServiceRequests = queueForPreset
        .filter(item => item.type === 'service_request')
        .slice(0, 4)
        .map(item => {
            return {
                id: item.id,
                title: `${item.label}${item.table_number ? ` (Table ${item.table_number})` : ''}`,
                status: item.status,
                statusColor: item.status === 'completed' ? 'text-green-500' : 'text-blue-500',
                time: item.created_at
                    ? `${Math.max(0, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000))}m`
                    : '0m',
                icon: item.status === 'completed' ? CheckCircle : Users,
                iconBg:
                    item.status === 'completed'
                        ? 'bg-green-50 text-green-500'
                        : 'bg-blue-50 text-blue-500',
            };
        });

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
                        className="h-10 rounded-xl bg-white px-3 text-sm font-bold text-gray-700 shadow-sm transition-shadow hover:shadow-md"
                    >
                        Alert Rules
                    </button>
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
            <div className="rounded-4xl bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-start justify-between">
                    <div className="max-w-xl">
                        <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
                            Income Tracker
                        </h2>
                        <p className="text-sm font-medium text-gray-500">
                            Real-time analysis of your daily revenue streams.
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(value => !value)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-50 px-4 text-sm font-bold text-gray-700 capitalize transition-colors hover:bg-gray-100"
                        >
                            {range}
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {filterOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-32 rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/5">
                                {(['today', 'week', 'month'] as CommandCenterRange[]).map(
                                    option => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setRange(option);
                                                setFilterOpen(false);
                                            }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold capitalize ${range === option ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {option}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex h-full flex-col items-center gap-12 xl:flex-row">
                    <div className="flex h-full w-full flex-1 flex-col justify-center pl-[35px]">
                        <span className="block text-[3.5rem] leading-none font-bold tracking-tighter text-slate-900">
                            {Math.floor(metrics.gross_sales_today).toLocaleString()}
                            <span className="ml-2 text-xl font-medium text-slate-400">ETB</span>
                        </span>
                        <p className="mt-2 text-lg leading-relaxed font-medium text-wrap text-slate-500">
                            {(() => {
                                const diff = Math.floor(
                                    metrics.gross_sales_today - (metrics.gross_sales_previous ?? 0)
                                );
                                const type =
                                    range === 'today'
                                        ? 'yesterday'
                                        : range === 'week'
                                          ? 'last week'
                                          : 'last month';
                                return (
                                    <>
                                        You made{' '}
                                        <span
                                            className={
                                                diff >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                            }
                                        >
                                            {Math.abs(diff).toLocaleString()} ETB
                                        </span>{' '}
                                        {diff >= 0 ? 'more' : 'less'} than {type}
                                    </>
                                );
                            })()}
                        </p>
                    </div>
                    <div className="h-full min-h-[350px] w-full flex-[4] overflow-hidden">
                        <RevenueChart data={commandCenter?.chart_data ?? []} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                {/* Active Orders Panel */}
                <div className="flex h-full flex-col rounded-4xl bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Active Orders
                            </h2>
                            <span className="bg-brand-crimson rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm">
                                {metrics.orders_in_flight} Pending
                            </span>
                        </div>
                    </div>
                    {activeOrders.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-12 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                                <ListOrdered className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">No active orders</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">
                                New incoming orders will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeOrders.map(order => (
                                <div
                                    key={order.id}
                                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-md"
                                >
                                    <div className="flex flex-1 items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100 ${order.statusColor}`}
                                        >
                                            <order.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1 text-sm font-bold text-slate-900">
                                                {order.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {order.time} ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100">
                                            <div
                                                className={`h-2 w-2 rounded-full ${order.statusColor.replace('text-', 'bg-')}`}
                                            />
                                            <span
                                                className={`text-xs font-bold ${order.statusColor}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-slate-900">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Service Requests Panel */}
                <div className="flex h-full flex-col rounded-4xl bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Service Requests
                            </h2>
                            <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                {metrics.open_requests} Open
                            </span>
                        </div>
                    </div>
                    {activeServiceRequests.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-12 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                                <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">No pending requests</p>
                            <p className="mt-1 text-xs font-medium text-gray-500">
                                Service requests from tables will show up here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeServiceRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-md"
                                >
                                    <div className="flex flex-1 items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100 ${request.statusColor}`}
                                        >
                                            <request.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1 text-sm font-bold text-slate-900">
                                                {request.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {request.time} ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-gray-100">
                                            <div
                                                className={`h-2 w-2 rounded-full ${request.statusColor.replace('text-', 'bg-')}`}
                                            />
                                            <span
                                                className={`text-xs font-bold ${request.statusColor}`}
                                            >
                                                {request.status}
                                            </span>
                                        </div>
                                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-slate-900">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertRuleBuilderDrawer
                open={alertRuleDrawerOpen}
                onClose={() => setAlertRuleDrawerOpen(false)}
            />
        </div>
    );
}
