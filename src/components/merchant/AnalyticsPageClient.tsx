'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { AnalyticsPageData } from '@/lib/services/dashboardDataService';

interface AnalyticsPageClientProps {
    initialData: AnalyticsPageData | null;
}

export function AnalyticsPageClient({ initialData }: AnalyticsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
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
    const handleRangeChange = useCallback((newRange: string) => {
        router.push(`/merchant/analytics?range=${newRange}`);
    }, [router]);

    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Analytics</h1>
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary.total_revenue.toLocaleString() ?? 0} ETB
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary.total_orders ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary.avg_order_value.toLocaleString() ?? 0} ETB
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Peak Hour</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary.peak_hour ? `${data.summary.peak_hour}:00` : 'N/A'}
                    </p>
                </div>
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
        </div>
    );
}