'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type {
    FinancePageData,
    PaymentSummary,
    RefundSummary,
    PayoutSummary,
} from '@/lib/services/dashboardDataService';

interface FinancePageClientProps {
    initialData: FinancePageData | null;
}

export function FinancePageClient({ initialData }: FinancePageClientProps) {
    const { markLoaded } = usePageLoadGuard('finance');

    const [payments, setPayments] = useState<PaymentSummary[]>(initialData?.payments ?? []);
    const [refunds, setRefunds] = useState<RefundSummary[]>(initialData?.refunds ?? []);
    const [payouts, setPayouts] = useState<PayoutSummary[]>(initialData?.payouts ?? []);
    const [totals, setTotals] = useState(
        initialData?.totals ?? { payments_gross: 0, refunds_total: 0, payouts_net: 0 }
    );
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'payments' | 'refunds' | 'payouts'>('payments');

    const restaurantId = initialData?.restaurant_id;

    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    const refreshData = useCallback(async () => {
        if (!restaurantId) return;
        setRefreshing(true);
        try {
            const response = await fetch('/api/finance');
            const result = await response.json();
            if (response.ok) {
                setPayments(result.data?.payments ?? []);
                setRefunds(result.data?.refunds ?? []);
                setPayouts(result.data?.payouts ?? []);
                setTotals(
                    result.data?.totals ?? { payments_gross: 0, refunds_total: 0, payouts_net: 0 }
                );
            }
        } catch (error) {
            console.error('Failed to refresh finance data:', error);
            toast.error('Failed to refresh finance data');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId]);

    const handleExport = useCallback(async () => {
        try {
            const response = await fetch('/api/finance/export');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Report exported');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            toast.error('Failed to export report');
        }
    }, []);

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
                        Finance
                    </h1>
                    <p className="font-medium text-gray-500">
                        Track payments, refunds, and payouts.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800"
                    >
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">Gross Payments</p>
                    <p className="text-2xl font-bold text-emerald-700">
                        {totals.payments_gross.toLocaleString()} ETB
                    </p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <p className="text-sm font-medium text-red-600">Total Refunds</p>
                    <p className="text-2xl font-bold text-red-700">
                        {totals.refunds_total.toLocaleString()} ETB
                    </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <p className="text-sm font-medium text-blue-600">Net Payouts</p>
                    <p className="text-2xl font-bold text-blue-700">
                        {totals.payouts_net.toLocaleString()} ETB
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                {(['payments', 'refunds', 'payouts'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                            activeTab === tab
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50/60">
                            <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                <th className="px-5 py-4">ID</th>
                                <th className="px-5 py-4">Amount</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'payments' && payments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            )}
                            {activeTab === 'refunds' && refunds.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                                        No refunds found
                                    </td>
                                </tr>
                            )}
                            {activeTab === 'payouts' && payouts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                                        No payouts found
                                    </td>
                                </tr>
                            )}
                            {activeTab === 'payments' &&
                                payments.map(item => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                                            {item.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">
                                            {item.amount.toLocaleString()} {item.currency}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            {activeTab === 'refunds' &&
                                refunds.map(item => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                                            {item.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-red-600">
                                            {item.amount.toLocaleString()} {item.currency}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            {activeTab === 'payouts' &&
                                payouts.map(item => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                                            {item.id.slice(0, 8)}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-blue-600">
                                            {item.amount.toLocaleString()} {item.currency}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
