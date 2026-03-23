'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    Wallet,
    ShoppingCart,
    Calculator,
    Clock,
    Star,
    Smile,
    Meh,
    Frown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/merchant/MetricCard';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { useAppLocale } from '@/hooks/useAppLocale';
import { formatETBCurrency } from '@/lib/format/et';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { AnalyticsPageData } from '@/lib/services/dashboardDataService';

interface AnalyticsPageClientProps {
    initialData: AnalyticsPageData | null;
}

export function AnalyticsPageClient({ initialData }: AnalyticsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useAppLocale();
    const { markLoaded } = usePageLoadGuard('analytics');

    // Initialize state with server data - NO loading flash!
    const [data, setData] = useState<AnalyticsPageData | null>(initialData);
    const [refreshing, setRefreshing] = useState(false);

    const restaurantId = initialData?.restaurant_id;
    const range = searchParams.get('range') ?? 'today';

    // Mark loaded after initial render
    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    // Refresh data from server
    const refreshData = useCallback(async () => {
        if (!restaurantId) return;

        setRefreshing(true);
        try {
            const response = await fetch(`/api/analytics?range=${range}`);
            const result = await response.json();

            if (response.ok) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to refresh analytics:', error);
            toast.error('Failed to refresh analytics');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId, range]);

    // Handle range change
    const handleRangeChange = useCallback(
        (newRange: string) => {
            router.push(`/merchant/analytics?range=${newRange}`);
        },
        [router]
    );

    // State for rating functionality
    const [hasRated, setHasRated] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('analytics.hasRated') === 'true';
    });

    // Handle mood update (rating the experience)
    const handleMoodUpdate = useCallback(
        async (mood: string, rating: number) => {
            if (hasRated) {
                toast.error('You have already rated your experience.');
                return;
            }

            // Optimistic update
            setHasRated(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('analytics.hasRated', 'true');
            }
            toast.success('Thanks for checking in! Rating saved.');

            try {
                await fetch('/api/analytics/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mood, rating }),
                });
                // Refresh analytics data in background
                refreshData();
            } catch {
                toast.error('Failed to log mood');
                setHasRated(false);
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('analytics.hasRated');
                }
            }
        },
        [hasRated, refreshData]
    );

    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
                        Analytics
                    </h1>
                    <p className="font-medium text-gray-500">
                        Track your restaurant performance and insights.
                    </p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month'].map(r => (
                        <button
                            key={r}
                            onClick={() => handleRangeChange(r)}
                            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                                range === r
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={Wallet}
                    chip="REVENUE"
                    value={formatETBCurrency(data?.summary.total_revenue ?? 0, {
                        locale,
                        compact: true,
                    })}
                    label="Total Revenue"
                    subLabel="Gross sales period"
                    tone="green"
                    progress={15}
                    targetLabel="Target: N/A"
                    currentLabel="Current"
                />
                <MetricCard
                    icon={ShoppingCart}
                    chip="ORDERS"
                    value={data?.summary.total_orders ?? 0}
                    label="Total Orders"
                    subLabel="Completed transactions"
                    tone="blue"
                    progress={12}
                    targetLabel="Target: N/A"
                    currentLabel="Current"
                />
                <MetricCard
                    icon={Calculator}
                    chip="AOV"
                    value={formatETBCurrency(data?.summary.avg_order_value ?? 0, {
                        locale,
                        compact: true,
                    })}
                    label="Avg Order Value"
                    subLabel="Spend per checkout"
                    tone="purple"
                    progress={10}
                    targetLabel="Target: N/A"
                    currentLabel="Current"
                />
                <MetricCard
                    icon={Clock}
                    chip="PEAK"
                    value={data?.summary.peak_hour ? `${data.summary.peak_hour}:00` : 'N/A'}
                    label="Peak Hour"
                    subLabel="Busiest time of day"
                    tone="rose"
                    progress={18}
                    targetLabel="Target: N/A"
                    currentLabel="Current"
                />
            </div>

            {/* Revenue Chart */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Revenue Over Time</h2>
                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <RevenueChart />
            </div>

            {/* Order Performance Card with Gradient Bars - Recharts */}
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-bold tracking-tight text-gray-900">
                            Order Performance
                        </h3>
                        <p className="mt-1 font-medium text-gray-500">
                            1,240 Orders completed successfully this week
                        </p>
                    </div>
                </div>

                {/* Weekly Bar Chart using Recharts */}
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                                { day: 'Sun', orders: 85 },
                                { day: 'Mon', orders: 120 },
                                { day: 'Tue', orders: 95 },
                                { day: 'Wed', orders: 140 },
                                { day: 'Thu', orders: 110 },
                                { day: 'Fri', orders: 165 },
                                { day: 'Sat', orders: 180 },
                            ]}
                            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="#F1F5F9"
                            />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#10B981',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                }}
                                itemStyle={{ color: '#10B981' }}
                                cursor={{
                                    stroke: '#10B981',
                                    strokeWidth: 1,
                                    strokeDasharray: '3 3',
                                }}
                            />
                            <Bar
                                dataKey="orders"
                                fill="url(#colorOrders)"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Section: Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 1. Customer Feedback/Satisfaction - Rating Card */}
                <div className="flex h-[500px] flex-col justify-between rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
                                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300 delay-75" />
                                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-900 delay-150" />
                            </div>
                        </div>

                        <p className="mb-6 text-xs font-bold tracking-wider text-gray-400 uppercase">
                            Review Rating
                        </p>

                        <h3 className="mb-8 text-3xl leading-tight font-bold tracking-tight text-gray-900">
                            How is your business management going?
                        </h3>

                        <div className="flex items-center justify-between gap-2 px-2">
                            {[
                                { icon: '😖', label: 'Terrible', rating: 1 },
                                { icon: 'bad', label: 'Bad', rating: 2 },
                                { icon: 'meh', label: 'Okay', rating: 3 },
                                { icon: 'good', label: 'Good', rating: 4 },
                                { icon: 'love', label: 'Great', rating: 5 },
                            ].map((mood, i) => (
                                <button
                                    key={i}
                                    className="group flex flex-col items-center gap-2 transition-transform hover:scale-110 focus:outline-none"
                                    onClick={() =>
                                        handleMoodUpdate(mood.label.toLowerCase(), mood.rating)
                                    }
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
                            <span className="text-sm font-bold text-gray-900">Total Reviews</span>
                            <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-600">
                                +24 this week
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h4 className="text-4xl font-black text-gray-900">4.8</h4>
                            <div className="flex text-yellow-400">
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-400">
                            Based on 1,240 customer ratings
                        </p>
                    </div>
                </div>

                {/* 2. Operational/Live Activity Card */}
                <div className="relative flex h-[500px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
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
                                        <p className="text-sm font-bold text-gray-900">Occupancy</p>
                                        <p className="text-xs text-gray-500">85% Full</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">42/50</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Active Orders
                                        </p>
                                        <p className="text-xs text-gray-500">Kitchen Queue</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">12</span>
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
                                        <p className="text-xs text-gray-500">Est. 15m wait</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-gray-900">4</span>
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
                                    <h4 className="mt-1 text-lg font-bold">Dinner Rush Incoming</h4>
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-400">
                                Expect a 40% value spike between 7 PM - 9 PM based on historical
                                data. Prep accordingly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
