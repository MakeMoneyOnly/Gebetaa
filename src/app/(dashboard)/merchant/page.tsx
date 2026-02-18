'use client';

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
} from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { AttentionQueuePanel } from '@/components/merchant/command-center/AttentionQueuePanel';
import { AlertRuleBuilderDrawer } from '@/components/merchant/command-center/AlertRuleBuilderDrawer';
import {
    DashboardPreset,
    DashboardPresetSwitcher,
} from '@/components/merchant/command-center/DashboardPresetSwitcher';
import {
    AttentionItem,
    CommandCenterData,
    CommandCenterRange,
    CommandCenterMetrics,
} from '@/components/merchant/command-center/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { isAbortError } from '@/hooks/useSafeFetch';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';

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

export default function MerchantDashboard() {
    const router = useRouter();
    const [range, setRange] = useState<CommandCenterRange>('today');
    const [commandCenter, setCommandCenter] = useState<CommandCenterData | null>(null);
    const { loading, markLoaded } = usePageLoadGuard('dashboard');
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeTick, setTimeTick] = useState(Date.now());
    const [filterOpen, setFilterOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<DashboardPreset>('owner');
    const [alertRuleDrawerOpen, setAlertRuleDrawerOpen] = useState(false);
    
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
                markLoaded();
                setRefreshing(false);
            }
        },
        [range, markLoaded]
    );

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

    useEffect(() => {
        const intervalId = window.setInterval(() => setTimeTick(Date.now()), 30_000);
        return () => window.clearInterval(intervalId);
    }, []);

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

    const queueForPreset = useMemo(() => {
        if (activePreset === 'kitchen_lead') {
            return queue.filter((item) => item.type !== 'alert');
        }
        if (activePreset === 'manager') {
            return queue.filter((item) => !(item.type === 'alert' && item.severity === 'low'));
        }
        return queue;
    }, [activePreset, queue]);

    const activeOrders = queueForPreset.filter((item) => item.type === 'order').slice(0, 4).map((item) => {
        const statusLower = item.status.toLowerCase();
        const isReady = ['ready', 'served', 'completed'].includes(statusLower);
        const isHold = statusLower === 'acknowledged';

        return {
            id: item.id,
            title: `${item.label}${item.table_number ? ` (Table ${item.table_number})` : ''}`,
            status: item.status,
            statusColor: isReady ? 'text-green-500' : isHold ? 'text-blue-500' : 'text-orange-500',
            time: item.created_at
                ? `${Math.max(0, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000))}m`
                : '0m',
            icon: isReady ? CheckCircle : isHold ? PauseCircle : PlayCircle,
            iconBg: isReady ? 'bg-green-50 text-green-500' : isHold ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500',
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
                setError(advanceError instanceof Error ? advanceError.message : 'Failed to advance order status');
            }
        },
        [fetchCommandCenter]
    );

    if (loading) {
        return (
            <div className="space-y-8 pb-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-56 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-44 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-[180px] rounded-[2rem]" />
                    ))}
                </div>
                <Skeleton className="h-[360px] rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Hello, Saba Grill</h1>
                    <p className="text-gray-500 font-medium">Here&apos;s your daily performance summary.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-black bg-gray-50 px-3 py-2 rounded-xl">
                        {new Date().toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <button className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                        <CalendarCheck className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${error ? 'bg-rose-100 text-rose-700' : isStale ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {error ? 'SYNC FAILED' : isStale ? 'STALE DATA' : 'IN SYNC'}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                        Last sync: {generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'never'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardPresetSwitcher onPresetResolved={setActivePreset} />
                    <button
                        onClick={() => setAlertRuleDrawerOpen(true)}
                        className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700"
                    >
                        Alert Rules
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen((value) => !value)}
                            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 inline-flex items-center gap-2 capitalize"
                        >
                            {range}
                            <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {filterOpen && (
                            <div className="absolute right-0 mt-2 w-28 rounded-xl bg-white shadow-lg p-1 z-20">
                                {(['today', 'week', 'month'] as CommandCenterRange[]).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setRange(option);
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-2 text-sm rounded-lg capitalize ${range === option ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fetchCommandCenter(true)}
                        className="h-10 px-4 rounded-xl bg-black text-white font-bold text-sm hover:bg-gray-800"
                        disabled={refreshing}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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
                    progress={Math.min(20, Math.max(1, Math.round(20 - metrics.avg_ticket_time_minutes / 3)))}
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

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Income Tracker</h2>
                        <p className="text-gray-500 font-medium text-sm">Real-time analysis of your daily revenue streams.</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-500">Gross ETB {metrics.gross_sales_today}</span>
                </div>
                <div className="flex flex-col xl:flex-row items-center gap-12 h-full">
                    <div className="w-full xl:w-[20%] pl-[35px] flex flex-col justify-center h-full">
                        <span className="text-[3.5rem] leading-none font-bold text-slate-900 tracking-tighter block">{metrics.payment_success_rate}%</span>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed text-wrap">Payment success in current range</p>
                    </div>
                    <div className="flex-1 w-full overflow-hidden h-full min-h-[350px]">
                        <RevenueChart />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-black">Active Orders</h2>
                        <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold">{metrics.orders_in_flight} Pending</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {activeOrders.map((order) => (
                        <div key={order.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${order.iconBg}`}>
                                    <order.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 mb-1">{order.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">{order.time} ago</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50">
                                    <div className={`h-2 w-2 rounded-full ${order.statusColor.replace('text-', 'bg-')}`} />
                                    <span className={`text-xs font-bold ${order.statusColor}`}>{order.status}</span>
                                </div>
                                <button className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-black">
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
        <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{chip}</span>
                    <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{value}</h3>
                </div>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
                <div className="mb-3">
                    <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">{label}</h3>
                    <p className="text-gray-400 text-xs font-medium">{subLabel}</p>
                </div>
                <div className="flex justify-between items-center gap-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const isActive = i < progress;
                        const opacity = isActive ? 0.3 + (0.7 * (i / Math.max(progress, 1))) : 1;
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
