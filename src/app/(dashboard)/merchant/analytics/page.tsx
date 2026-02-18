'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { toast } from 'react-hot-toast';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';

type AnalyticsMetrics = {
    total_revenue: number;
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    open_requests: number;
    active_tables: number;
    conversion_rate: number;
    avg_order_value: number;
};

type OrderDrilldownRow = {
    id: string;
    order_number: string;
    status: string | null;
    table_number: string;
    total_price: number;
    created_at: string | null;
};

type ApiEndpointMetric = {
    endpoint: string;
    requests: number;
    errors: number;
    error_rate_percent: number;
    latency_ms: {
        p50: number;
        p95: number;
        avg: number;
    };
    slo: {
        latency_target_p95_ms: number;
        error_rate_target_percent: number;
        latency_status: 'healthy' | 'breach' | 'no_data';
        error_status: 'healthy' | 'breach' | 'no_data';
    };
};

type ApiMetricTrend = {
    endpoint: string;
    bucket: string;
    requests: number;
    errors: number;
    error_rate_percent: number;
    p95_latency_ms: number;
};

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
] as const;

export default function AnalyticsPage() {
    const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]['value']>('week');
    const { loading, markLoaded } = usePageLoadGuard('analytics');
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
    const [drilldownRows, setDrilldownRows] = useState<OrderDrilldownRow[]>([]);
    const [apiEndpointMetrics, setApiEndpointMetrics] = useState<ApiEndpointMetric[]>([]);
    const [apiTrend, setApiTrend] = useState<ApiMetricTrend[]>([]);

    const fetchAnalytics = async () => {
        try {
            setError(null);

            const [overviewRes, ordersRes, apiMetricsRes] = await Promise.all([
                fetch(`/api/analytics/overview?range=${range}`, { method: 'GET' }),
                fetch('/api/orders?limit=50', { method: 'GET' }),
                fetch(`/api/analytics/api-metrics?range=${range}`, { method: 'GET' }),
            ]);

            const overviewPayload = await overviewRes.json();
            const ordersPayload = await ordersRes.json();
            const apiMetricsPayload = await apiMetricsRes.json();

            if (!overviewRes.ok) {
                throw new Error(overviewPayload?.error ?? 'Failed to load analytics overview.');
            }
            if (!ordersRes.ok) {
                throw new Error(ordersPayload?.error ?? 'Failed to load drilldown orders.');
            }
            if (!apiMetricsRes.ok) {
                throw new Error(apiMetricsPayload?.error ?? 'Failed to load API reliability metrics.');
            }

            setMetrics((overviewPayload?.data?.metrics ?? null) as AnalyticsMetrics | null);
            setDrilldownRows((ordersPayload?.data?.orders ?? []) as OrderDrilldownRow[]);
            setApiEndpointMetrics((apiMetricsPayload?.data?.endpoints ?? []) as ApiEndpointMetric[]);
            setApiTrend((apiMetricsPayload?.data?.trend ?? []) as ApiMetricTrend[]);
        } catch (fetchError) {
            console.error(fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load analytics.');
        } finally {
            markLoaded();
        }
    };

    useEffect(() => {
        void fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const metricCards = useMemo(
        () => [
            { label: 'Revenue', value: metrics ? `${metrics.total_revenue.toLocaleString()} ETB` : '-' },
            { label: 'Orders', value: metrics ? metrics.total_orders.toLocaleString() : '-' },
            { label: 'Avg Order', value: metrics ? `${metrics.avg_order_value.toLocaleString()} ETB` : '-' },
            { label: 'Conversion', value: metrics ? `${metrics.conversion_rate}%` : '-' },
            { label: 'Pending', value: metrics ? metrics.pending_orders.toLocaleString() : '-' },
            { label: 'Open Requests', value: metrics ? metrics.open_requests.toLocaleString() : '-' },
            { label: 'Active Tables', value: metrics ? metrics.active_tables.toLocaleString() : '-' },
            { label: 'Completed', value: metrics ? metrics.completed_orders.toLocaleString() : '-' },
        ],
        [metrics]
    );

    const exportDrilldownCsv = () => {
        if (drilldownRows.length === 0) {
            toast('No drilldown rows to export.');
            return;
        }

        const header = ['order_id', 'order_number', 'status', 'table_number', 'total_price', 'created_at'];
        const csvRows = [
            header.join(','),
            ...drilldownRows.map((row) =>
                [row.id, row.order_number, row.status ?? '', row.table_number, row.total_price, row.created_at ?? '']
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(',')
            ),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-drilldown-${range}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const apiSummary = useMemo(() => {
        const sampledRequests = apiEndpointMetrics.reduce((sum, metric) => sum + metric.requests, 0);
        const weightedErrorRate = sampledRequests > 0
            ? Number((apiEndpointMetrics.reduce((sum, metric) => sum + metric.error_rate_percent * metric.requests, 0) / sampledRequests).toFixed(2))
            : 0;
        const worstP95 = apiEndpointMetrics.reduce((max, metric) => Math.max(max, metric.latency_ms.p95), 0);
        const breaches = apiEndpointMetrics.filter(
            (metric) => metric.slo.latency_status === 'breach' || metric.slo.error_status === 'breach'
        ).length;

        return {
            sampledRequests,
            weightedErrorRate,
            worstP95,
            breaches,
        };
    }, [apiEndpointMetrics]);

    return (
        <div className="space-y-6 pb-20 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 font-medium">Live metrics and drilldown insights.</p>
                    {error && <p className="text-xs mt-2 text-amber-700 font-semibold">{error}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 p-2">
                        <Calendar className="h-4 w-4 text-gray-400 ml-1" />
                        <select
                            value={range}
                            onChange={(event) => setRange(event.target.value as (typeof RANGE_OPTIONS)[number]['value'])}
                            className="bg-transparent text-sm font-semibold text-gray-800 outline-none pr-2"
                        >
                            {RANGE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={exportDrilldownCsv}
                        className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {loading && (
                <div className="bg-white rounded-[2rem] p-8 shadow-sm flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading analytics...
                </div>
            )}

            {!loading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {metricCards.map((card) => (
                            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{card.label}</p>
                                <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue Trends</h3>
                        <p className="text-gray-500 text-sm font-medium mb-6">Current chart view with live KPI wiring</p>
                        <div className="h-[360px] w-full">
                            <RevenueChart />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Order Drilldown</h3>
                            <span className="text-xs font-semibold text-gray-500">{drilldownRows.length} rows</span>
                        </div>
                        {drilldownRows.length === 0 ? (
                            <p className="text-sm text-gray-500">No drilldown data available.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-100">
                                            <th className="py-2 pr-4">Order #</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Table</th>
                                            <th className="py-2 pr-4">Amount</th>
                                            <th className="py-2">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drilldownRows.map((row) => (
                                            <tr key={row.id} className="border-b border-gray-50">
                                                <td className="py-2 pr-4 font-semibold text-gray-900">{row.order_number}</td>
                                                <td className="py-2 pr-4 text-gray-600">{row.status ?? 'unknown'}</td>
                                                <td className="py-2 pr-4 text-gray-600">{row.table_number}</td>
                                                <td className="py-2 pr-4 text-gray-900 font-semibold">{row.total_price}</td>
                                                <td className="py-2 text-gray-600">
                                                    {row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">API Reliability Dashboard</h3>
                            <span className="text-xs font-semibold text-gray-500">{apiSummary.sampledRequests} sampled requests</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Worst P95</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">{apiSummary.worstP95}ms</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Weighted Error Rate</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">{apiSummary.weightedErrorRate}%</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">SLO Breaches</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">{apiSummary.breaches}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Endpoints Tracked</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">{apiEndpointMetrics.length}</p>
                            </div>
                        </div>

                        {apiEndpointMetrics.length === 0 ? (
                            <p className="text-sm text-gray-500">No API telemetry samples captured for this range yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-100">
                                            <th className="py-2 pr-4">Endpoint</th>
                                            <th className="py-2 pr-4">Requests</th>
                                            <th className="py-2 pr-4">P50</th>
                                            <th className="py-2 pr-4">P95</th>
                                            <th className="py-2 pr-4">Error %</th>
                                            <th className="py-2 pr-4">Latency SLO</th>
                                            <th className="py-2">Error SLO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiEndpointMetrics.map((metric) => (
                                            <tr key={metric.endpoint} className="border-b border-gray-50">
                                                <td className="py-2 pr-4 font-semibold text-gray-900">{metric.endpoint}</td>
                                                <td className="py-2 pr-4 text-gray-700">{metric.requests}</td>
                                                <td className="py-2 pr-4 text-gray-700">{metric.latency_ms.p50}ms</td>
                                                <td className="py-2 pr-4 text-gray-700">{metric.latency_ms.p95}ms</td>
                                                <td className="py-2 pr-4 text-gray-700">{metric.error_rate_percent}%</td>
                                                <td className={`py-2 pr-4 font-semibold ${metric.slo.latency_status === 'breach' ? 'text-rose-600' : metric.slo.latency_status === 'no_data' ? 'text-gray-500' : 'text-emerald-600'}`}>
                                                    {metric.slo.latency_status}
                                                </td>
                                                <td className={`py-2 font-semibold ${metric.slo.error_status === 'breach' ? 'text-rose-600' : metric.slo.error_status === 'no_data' ? 'text-gray-500' : 'text-emerald-600'}`}>
                                                    {metric.slo.error_status}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {apiTrend.length > 0 && (
                            <div className="overflow-x-auto">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Trend</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-100">
                                            <th className="py-2 pr-3">Bucket</th>
                                            <th className="py-2 pr-3">Endpoint</th>
                                            <th className="py-2 pr-3">Req</th>
                                            <th className="py-2 pr-3">Err%</th>
                                            <th className="py-2">P95</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiTrend.slice(-18).map((entry, index) => (
                                            <tr key={`${entry.endpoint}-${entry.bucket}-${index}`} className="border-b border-gray-50">
                                                <td className="py-2 pr-3 text-gray-700">{entry.bucket}</td>
                                                <td className="py-2 pr-3 text-gray-700">{entry.endpoint}</td>
                                                <td className="py-2 pr-3 text-gray-700">{entry.requests}</td>
                                                <td className="py-2 pr-3 text-gray-700">{entry.error_rate_percent}%</td>
                                                <td className="py-2 text-gray-700">{entry.p95_latency_ms}ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
