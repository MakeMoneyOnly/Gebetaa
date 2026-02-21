'use client';

import React, { useEffect, useState } from 'react';
import {
    Calendar,
    Loader2,
    Wallet,
    ShoppingBag,
    TrendingUp,
    Percent,
    Star,
    Smile,
    Meh,
    Frown,
    Users,
    ChevronDown,
} from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { toast } from 'react-hot-toast';
import { MetricCard } from '@/components/merchant/MetricCard';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';

type AnalyticsMetrics = {
    total_revenue: number;
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    open_requests: number;
    active_tables: number;
    total_tables: number;
    conversion_rate: number;
    avg_order_value: number;
    avg_rating: number;
    total_reviews: number;
    top_items: Array<{ name: string; count: number; revenue: number }>;
    reviews_this_week: number;
    trends: Array<{ label: string; revenue: number; orders: number }>;
    previous_completed_orders?: number;
};

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
] as const;

export default function AnalyticsPage() {
    const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]['value']>('week');
    const [orderVolumeFilter, setOrderVolumeFilter] = useState('Weekly');
    const [orderVolumeFilterOpen, setOrderVolumeFilterOpen] = useState(false);
    const [rangeFilterOpen, setRangeFilterOpen] = useState(false);
    const [orderStats, setOrderStats] = useState<{
        count: number;
        prevCount: number;
        trends: AnalyticsMetrics['trends'];
    } | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const cached = sessionStorage.getItem('analytics.orderStats.Weekly');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const { loading, markLoaded } = usePageLoadGuard('analytics');
    const [error, setError] = useState<string | null>(null);

    // Initialize state from sessionStorage if available for instant load
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const cached = sessionStorage.getItem('analytics.metrics');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });

    const [hasRated, setHasRated] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('analytics.hasRated') === 'true';
    });
    const [ratingCardVisible, setRatingCardVisible] = useState(() => {
        if (typeof window === 'undefined') return true;
        return sessionStorage.getItem('analytics.ratingCardDismissed') !== 'true';
    });

    const fetchAnalytics = async () => {
        try {
            setError(null);

            const overviewRes = await fetch(`/api/analytics/overview?range=${range}`, {
                method: 'GET',
            });
            const overviewPayload = await overviewRes.json();

            if (!overviewRes.ok) {
                throw new Error(overviewPayload?.error ?? 'Failed to load analytics overview.');
            }

            const newMetrics = (overviewPayload?.data?.metrics ?? null) as AnalyticsMetrics | null;

            setMetrics(newMetrics);

            // Cache data for instant restore
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('analytics.metrics', JSON.stringify(newMetrics));
            }
        } catch (fetchError) {
            console.error(fetchError);
            setError(
                fetchError instanceof Error ? fetchError.message : 'Failed to load analytics.'
            );
        } finally {
            markLoaded();
        }
    };

    useEffect(() => {
        void fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    // Fetch separate stats for the Order Performance Card when filter changes
    useEffect(() => {
        const fetchOrderStats = async () => {
            const apiRange =
                orderVolumeFilter === 'Weekly'
                    ? 'week'
                    : orderVolumeFilter === 'Monthly'
                      ? 'month'
                      : 'year';

            // Try to load from cache first for immediate feedback
            if (typeof window !== 'undefined') {
                const cached = sessionStorage.getItem(`analytics.orderStats.${orderVolumeFilter}`);
                if (cached) {
                    try {
                        setOrderStats(JSON.parse(cached));
                    } catch {
                        // ignore parse error
                    }
                }
            }

            try {
                const res = await fetch(`/api/analytics/overview?range=${apiRange}`);
                const data = await res.json();
                if (res.ok && data?.data?.metrics) {
                    const newStats = {
                        count: data.data.metrics.completed_orders ?? 0,
                        prevCount: data.data.metrics.previous_completed_orders ?? 0,
                        trends: data.data.metrics.trends ?? [],
                    };
                    setOrderStats(newStats);

                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(
                            `analytics.orderStats.${orderVolumeFilter}`,
                            JSON.stringify(newStats)
                        );
                    }
                }
            } catch (err) {
                console.error('Failed to fetch order stats', err);
            }
        };
        void fetchOrderStats();
    }, [orderVolumeFilter]);

    const handleMoodUpdate = async (mood: string, rating: number) => {
        if (hasRated) {
            toast.error('You have already rated your experience.');
            return;
        }

        // Optimistic Update
        const previousMetrics = metrics;
        if (metrics) {
            const newTotalReviews = (metrics.total_reviews || 0) + 1;
            const currentTotalScore = (metrics.avg_rating || 0) * (metrics.total_reviews || 0);
            const newAvgRating = (currentTotalScore + rating) / newTotalReviews;

            setMetrics({
                ...metrics,
                total_reviews: newTotalReviews,
                avg_rating: newAvgRating,
                reviews_this_week: (metrics.reviews_this_week || 0) + 1,
            });
        }

        setHasRated(true);
        sessionStorage.setItem('analytics.hasRated', 'true');
        toast.success('Thanks for checking in! Rating saved.');

        try {
            await fetch('/api/analytics/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood, rating }),
            });
            // Re-fetch in background to ensure consistency with server
            fetchAnalytics();
        } catch {
            // Revert state if failed
            toast.error('Failed to log mood');
            setMetrics(previousMetrics);
            setHasRated(false);
            sessionStorage.removeItem('analytics.hasRated');
        }
    };

    const getActionableInsight = () => {
        if (!metrics) return { title: 'Analyzing...', message: 'Gathering data...' };

        const occupancyRate =
            metrics.total_tables > 0 ? metrics.active_tables / metrics.total_tables : 0;

        if (metrics.pending_orders > 10) {
            return {
                title: 'Kitchen High Load',
                message: `Active orders are piling up (${metrics.pending_orders}). Consider pausing low-priority stations.`,
            };
        }

        if (occupancyRate > 0.8) {
            return {
                title: 'High Occupancy',
                message: `We're at ${Math.round(occupancyRate * 100)}% capacity. Ensure host stand is managing wait times.`,
            };
        }

        if (metrics.open_requests > 5) {
            return {
                title: 'Service Alert',
                message: `${metrics.open_requests} tables need attention. Check service request logs.`,
            };
        }

        return {
            title: 'Steady Flow',
            message: 'Operations are running smoothly. Great time to restock stations.',
        };
    };

    const insight = getActionableInsight();

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
                        Analytics
                    </h1>
                    <p className="font-medium text-gray-500">
                        Live metrics and drilldown insights.
                    </p>
                    {error && <p className="mt-2 text-xs font-semibold text-amber-700">{error}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative z-40">
                        <button
                            onClick={() => setRangeFilterOpen(!rangeFilterOpen)}
                            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm transition-colors hover:bg-gray-50"
                        >
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-bold text-gray-700">
                                {RANGE_OPTIONS.find(r => r.value === range)?.label}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${rangeFilterOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {rangeFilterOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setRangeFilterOpen(false)}
                                />
                                <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-xl duration-200">
                                    {RANGE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setRange(option.value);
                                                setRangeFilterOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
                                                range === option.value
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {loading && !metrics && (
                <div className="flex items-center gap-2 rounded-[2rem] bg-white p-8 text-gray-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading analytics...
                </div>
            )}

            {(metrics || !loading) && (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            icon={Wallet}
                            chip="REVENUE"
                            value={metrics ? `${metrics.total_revenue.toLocaleString()} ETB` : '-'}
                            label="Total Revenue"
                            subLabel="Gross Sales"
                            tone="green"
                            progress={20}
                            targetLabel="Target: -"
                            currentLabel="Total"
                        />
                        <MetricCard
                            icon={ShoppingBag}
                            chip="ORDERS"
                            value={metrics ? metrics.total_orders.toLocaleString() : '-'}
                            label="Total Orders"
                            subLabel="All Channels"
                            tone="blue"
                            progress={20}
                            targetLabel="Target: -"
                            currentLabel="Volume"
                        />
                        <MetricCard
                            icon={TrendingUp}
                            chip="AOV"
                            value={
                                metrics ? `${metrics.avg_order_value.toLocaleString()} ETB` : '-'
                            }
                            label="Average Order"
                            subLabel="Per Transaction"
                            tone="purple"
                            progress={20}
                            targetLabel="Target: -"
                            currentLabel="Avg"
                        />
                        <MetricCard
                            icon={Percent}
                            chip="CONVERSION"
                            value={metrics ? `${metrics.conversion_rate}%` : '-'}
                            label="Conversion Rate"
                            subLabel="Visitor to Order"
                            tone="rose"
                            progress={metrics ? Math.round(metrics.conversion_rate / 5) : 0}
                            targetLabel="Target: 20%"
                            currentLabel={metrics ? `${metrics.conversion_rate}%` : '-'}
                        />
                    </div>

                    <div className="rounded-[2.5rem] bg-white p-8 shadow-sm">
                        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                            Revenue Trends
                        </h3>
                        <p className="mb-6 text-sm font-medium text-gray-500">
                            Current chart view with live KPI wiring
                        </p>
                        <div className="h-[360px] w-full">
                            <RevenueChart />
                        </div>
                    </div>

                    {/* Detailed Activity Card */}
                    {/* Weekly Orders Activity Card - Updated */}
                    <div className="mt-6 min-h-[400px] rounded-[2.5rem] bg-white p-10 shadow-sm">
                        <div className="mb-12 flex items-start justify-between">
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight text-gray-900">
                                    Order Performance
                                </h3>
                                <p className="mt-2 text-sm font-medium text-gray-400">
                                    {orderVolumeFilter === 'Weekly'
                                        ? "This week's activity"
                                        : orderVolumeFilter === 'Monthly'
                                          ? "This month's volume"
                                          : 'Yearly performance'}
                                </p>
                            </div>
                            <div className="relative z-30">
                                <button
                                    onClick={() => setOrderVolumeFilterOpen(!orderVolumeFilterOpen)}
                                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition-colors outline-none hover:bg-gray-50"
                                >
                                    {orderVolumeFilter}
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${orderVolumeFilterOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {orderVolumeFilterOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setOrderVolumeFilterOpen(false)}
                                        />
                                        <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-20 mt-2 w-40 rounded-xl border border-gray-100 bg-white p-1 shadow-xl duration-200">
                                            {['Weekly', 'Monthly', 'Yearly'].map(option => (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setOrderVolumeFilter(option);
                                                        setOrderVolumeFilterOpen(false);
                                                    }}
                                                    className={`w-full rounded-lg px-4 py-3 text-left text-xs font-bold transition-colors ${
                                                        orderVolumeFilter === option
                                                            ? 'bg-orange-50 text-orange-600'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex h-full flex-col gap-12 lg:flex-row">
                            {/* Left Stat Block */}
                            <div className="flex min-w-[250px] flex-col justify-center">
                                <span className="mb-4 text-6xl font-black tracking-tighter text-gray-900">
                                    +{orderStats?.count ?? 0}
                                </span>
                                <p className="max-w-[200px] text-lg leading-relaxed font-medium text-gray-500">
                                    Orders completed successfully{' '}
                                    {orderVolumeFilter === 'Weekly'
                                        ? 'this week'
                                        : orderVolumeFilter === 'Monthly'
                                          ? 'this month'
                                          : 'this year'}{' '}
                                    is{' '}
                                    <span
                                        className={
                                            (orderStats?.count ?? 0) >= (orderStats?.prevCount ?? 0)
                                                ? 'font-bold text-emerald-600'
                                                : 'font-bold text-rose-600'
                                        }
                                    >
                                        {(orderStats?.count ?? 0) === (orderStats?.prevCount ?? 0)
                                            ? 'balanced with'
                                            : (orderStats?.count ?? 0) >
                                                (orderStats?.prevCount ?? 0)
                                              ? 'higher than'
                                              : 'lower than'}
                                    </span>{' '}
                                    {orderVolumeFilter === 'Weekly'
                                        ? 'last week.'
                                        : orderVolumeFilter === 'Monthly'
                                          ? 'last month.'
                                          : 'last year.'}
                                </p>
                            </div>

                            {/* Chart Area */}
                            <div className="relative flex h-[280px] w-full flex-1 items-end justify-between pl-4">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => {
                                    // Map day index (0-6) to day name for lookup
                                    const dayNames = [
                                        'Sun',
                                        'Mon',
                                        'Tue',
                                        'Wed',
                                        'Thu',
                                        'Fri',
                                        'Sat',
                                    ];
                                    const currentDayName = dayNames[i];

                                    // Find trend data matching this day name
                                    const trend = orderStats?.trends?.find(
                                        t => t.label === currentDayName
                                    );
                                    const val = trend ? trend.orders : 0;

                                    // Calculate max for scale
                                    const allValues = orderStats?.trends?.map(t => t.orders) ?? [0];
                                    const maxVal = Math.max(...allValues, 1);

                                    // Percentage height with min height for visibility
                                    const heightPercent =
                                        val > 0
                                            ? Math.max(15, Math.min(100, (val / maxVal) * 100))
                                            : 0;

                                    const fullDays = [
                                        'Sunday',
                                        'Monday',
                                        'Tuesday',
                                        'Wednesday',
                                        'Thursday',
                                        'Friday',
                                        'Saturday',
                                    ];

                                    return (
                                        <div
                                            key={i}
                                            className="group relative flex h-full w-12 flex-col items-center justify-end gap-3 md:w-16"
                                        >
                                            {/* Tooltip */}
                                            {val > 0 && (
                                                <div className="pointer-events-none absolute -top-14 left-1/2 z-20 flex origin-bottom -translate-x-1/2 scale-90 flex-col items-center rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold whitespace-nowrap text-white opacity-0 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                                                    <span className="text-sm">{val} Orders</span>
                                                    <span className="mt-0.5 text-[10px] font-normal tracking-wider text-gray-400 uppercase">
                                                        {fullDays[i]}
                                                    </span>
                                                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
                                                </div>
                                            )}

                                            {/* Top Floating Dot */}
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full bg-emerald-400 transition-all duration-500 ${val > 0 ? 'mb-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100' : 'opacity-0'}`}
                                            />

                                            {/* The Bar - Green Gradient */}
                                            {/* Show empty placeholder if no data, or height 0 */}
                                            <div
                                                className={`relative w-full rounded-2xl transition-all duration-500 ease-out ${val > 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-50/20 group-hover:from-emerald-400 group-hover:to-emerald-100 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-50'}`}
                                                style={{
                                                    height: val > 0 ? `${heightPercent}%` : '4px',
                                                }}
                                            />

                                            {/* Bottom Avatar (Day Label) */}
                                            <div
                                                className={`z-10 box-border flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-sm font-bold text-gray-400 shadow-sm transition-all duration-300 md:h-12 md:w-12 ${val > 0 ? 'group-hover:scale-110 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-600' : ''}`}
                                            >
                                                {dayChar}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Restored Rating and Operational Cards */}
                    <div
                        className={`mt-6 grid grid-cols-1 gap-6 ${ratingCardVisible ? 'md:grid-cols-2' : ''}`}
                    >
                        {/* 1. Customer Feedback/Satisfaction - 50% width */}
                        {ratingCardVisible && (
                            <div className="flex min-h-[500px] flex-col justify-between rounded-[2.5rem] bg-white p-8 shadow-sm">
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300 delay-75" />
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900 delay-150" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRatingCardVisible(false);
                                            sessionStorage.setItem(
                                                'analytics.ratingCardDismissed',
                                                'true'
                                            );
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M9 3L3 9M3 3L9 9"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <p className="mb-6 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Review Rating
                                </p>

                                <h3 className="mb-8 text-3xl leading-tight font-bold tracking-tight text-gray-900">
                                    How is your business management going?
                                </h3>

                                <div className="mt-auto flex items-center justify-between gap-2 px-2">
                                    {[
                                        { icon: '😖', label: 'Terrible' },
                                        { icon: 'bad', label: 'Bad' },
                                        { icon: 'meh', label: 'Okay' },
                                        { icon: 'good', label: 'Good' },
                                        { icon: 'love', label: 'Great' },
                                    ].map((mood, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleMoodUpdate(mood.label, i + 1)}
                                            disabled={hasRated}
                                            className={`group flex flex-col items-center gap-2 transition-all focus:outline-none ${
                                                hasRated
                                                    ? 'cursor-not-allowed opacity-50 grayscale'
                                                    : 'hover:scale-110'
                                            }`}
                                        >
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-2xl shadow-sm transition-all group-hover:bg-white group-hover:shadow-md">
                                                {i === 0 && (
                                                    <span className="opacity-50 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                                                        😡
                                                    </span>
                                                )}
                                                {i === 1 && (
                                                    <Frown className="h-6 w-6 text-gray-400 transition-colors group-hover:text-red-500" />
                                                )}
                                                {i === 2 && (
                                                    <Meh className="h-6 w-6 text-gray-400 transition-colors group-hover:text-yellow-500" />
                                                )}
                                                {i === 3 && (
                                                    <Smile className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500" />
                                                )}
                                                {i === 4 && (
                                                    <span className="opacity-50 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                                                        😍
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto rounded-2xl bg-gray-50 p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">
                                        Total Reviews
                                    </span>
                                    <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-600">
                                        +{metrics?.reviews_this_week ?? 0} this week
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <h4 className="text-4xl font-black text-gray-900">
                                        {metrics?.avg_rating?.toFixed(1) ?? '0.0'}
                                    </h4>
                                    <div className="flex text-yellow-400">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${
                                                    star <= Math.round(metrics?.avg_rating ?? 0)
                                                        ? 'fill-current'
                                                        : 'fill-none text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-2 text-xs font-medium text-gray-400">
                                    Based on {metrics?.total_reviews ?? 0} customer ratings
                                </p>
                            </div>
                            </div>
                        )}

                        {/* 2. Operational/Occupancy Mini-View - 50% width */}
                        <div className="relative flex min-h-[500px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Users className="h-48 w-48" />
                            </div>

                            <div>
                                <h3 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                                    Live Activity
                                </h3>
                                <p className="mb-8 text-sm font-medium text-gray-500">
                                    Current restaurant status
                                </p>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                                <div className="h-3 w-3 animate-ping rounded-full bg-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Occupancy
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metrics?.total_tables &&
                                                    metrics.total_tables > 0
                                                        ? `${Math.round(((metrics.active_tables ?? 0) / metrics.total_tables) * 100)}% Full`
                                                        : 'No tables'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-gray-900">
                                            {metrics?.active_tables ?? 0}/
                                            {metrics?.total_tables ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Active Orders
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Kitchen Queue
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-gray-900">
                                            {metrics?.pending_orders ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                                                <Users className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Waiting List
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Est. 15m wait
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-gray-900">
                                            {metrics?.open_requests ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className="rounded-2xl bg-gray-900 p-6 text-white">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">
                                                Pro Tip
                                            </p>
                                            <h4 className="mt-1 text-lg font-bold">
                                                {insight.title}
                                            </h4>
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                                            <TrendingUp className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed text-gray-400">
                                        {insight.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
