'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { ChannelsPageData, ChannelPartner, ExternalOrderSummary } from '@/lib/services/dashboardDataService';

interface ChannelsPageClientProps {
    initialData: ChannelsPageData | null;
}

export function ChannelsPageClient({ initialData }: ChannelsPageClientProps) {
    const { markLoaded } = usePageLoadGuard('channels');

    const [partners, setPartners] = useState<ChannelPartner[]>(initialData?.partners ?? []);
    const [orders, setOrders] = useState<ExternalOrderSummary[]>(initialData?.orders ?? []);
    const [summary, setSummary] = useState(initialData?.summary ?? {
        delivery_partners: 0,
        connected_partners: 0,
        degraded_partners: 0,
        external_orders_24h: 0,
        unacked_orders: 0,
    });
    const [refreshing, setRefreshing] = useState(false);

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
            const response = await fetch('/api/channels');
            const result = await response.json();
            if (response.ok) {
                setPartners(result.data?.partners ?? []);
                setOrders(result.data?.orders ?? []);
                setSummary(result.data?.summary ?? summary);
            }
        } catch (error) {
            console.error('Failed to refresh channels:', error);
            toast.error('Failed to refresh channels');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId, summary]);

    const handleAckOrder = useCallback(async (orderId: string) => {
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { ...o, acked_at: new Date().toISOString() } : o))
        );

        try {
            const response = await fetch(`/api/channels/orders/${orderId}/ack`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to acknowledge order');
            toast.success('Order acknowledged');
        } catch (error) {
            setOrders(prev =>
                prev.map(o => (o.id === orderId ? { ...o, acked_at: null } : o))
            );
            toast.error('Failed to acknowledge order');
        }
    }, []);

    const unackedOrders = orders.filter(o => !o.acked_at);

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Channels</h1>
                    <p className="font-medium text-gray-500">Manage delivery partners and online orders.</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Partners</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.delivery_partners}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">Connected</p>
                    <p className="text-2xl font-bold text-emerald-700">{summary.connected_partners}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-sm font-medium text-amber-600">Degraded</p>
                    <p className="text-2xl font-bold text-amber-700">{summary.degraded_partners}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <p className="text-sm font-medium text-blue-600">Orders (24h)</p>
                    <p className="text-2xl font-bold text-blue-700">{summary.external_orders_24h}</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <p className="text-sm font-medium text-red-600">Unacked</p>
                    <p className="text-2xl font-bold text-red-700">{summary.unacked_orders}</p>
                </div>
            </div>

            {unackedOrders.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 font-bold text-red-800">Unacknowledged Orders</h3>
                    <div className="space-y-2">
                        {unackedOrders.slice(0, 5).map(order => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between rounded-xl bg-white p-3"
                            >
                                <div>
                                    <span className="font-medium">{order.provider_order_id}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {order.provider} • {order.total_amount.toLocaleString()} {order.currency}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleAckOrder(order.id)}
                                    className="rounded-lg bg-red-500 px-3 py-1 text-sm font-bold text-white hover:bg-red-600"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <h2 className="mb-4 text-lg font-bold text-gray-900">Delivery Partners</h2>
                    <div className="space-y-3">
                        {partners.length === 0 ? (
                            <p className="text-gray-500">No delivery partners connected</p>
                        ) : (
                            partners.map(partner => (
                                <div
                                    key={partner.id}
                                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                                >
                                    <div>
                                        <span className="font-bold text-gray-900 capitalize">{partner.provider}</span>
                                        <p className="text-xs text-gray-500">
                                            Last sync: {partner.last_sync_at ? new Date(partner.last_sync_at).toLocaleString() : 'Never'}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-bold',
                                            partner.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : partner.status === 'degraded'
                                                  ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-gray-100 text-gray-600'
                                        )}
                                    >
                                        {partner.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <h2 className="mb-4 text-lg font-bold text-gray-900">Recent External Orders</h2>
                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <p className="text-gray-500">No external orders</p>
                        ) : (
                            orders.slice(0, 5).map(order => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                                >
                                    <div>
                                        <span className="font-medium">{order.provider_order_id}</span>
                                        <p className="text-xs text-gray-500">
                                            {order.provider} • {order.total_amount.toLocaleString()} {order.currency}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-1 text-xs font-bold',
                                            order.acked_at
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        )}
                                    >
                                        {order.acked_at ? 'Acked' : 'Pending'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}