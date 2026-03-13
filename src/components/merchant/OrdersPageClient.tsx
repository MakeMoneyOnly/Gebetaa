'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/utils/monetary';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { useKDSRealtime } from '@/hooks/useKDSRealtime';
import type { OrderSummary, ServiceRequestSummary } from '@/lib/services/dashboardDataService';

interface OrdersPageClientProps {
    initialData: {
        orders: OrderSummary[];
        service_requests: ServiceRequestSummary[];
        restaurant_id: string;
    } | null;
}

function statusPill(status: string | null) {
    if (status?.startsWith('service_')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60';
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
    if (status === 'ready') return 'bg-green-50 text-green-700 ring-1 ring-green-200/60';
    if (status === 'preparing' || status === 'acknowledged')
        return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
    return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60';
}

function ageTone(createdAt: string | null) {
    const ageMinutes = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
        : 0;
    if (ageMinutes >= 30) return 'text-red-500';
    if (ageMinutes >= 15) return 'text-orange-500';
    return 'text-emerald-600';
}

function getNextStatus(status: string | null): string | null {
    const flow = ['pending', 'acknowledged', 'preparing', 'ready', 'completed'];
    const currentIndex = flow.indexOf(status ?? 'pending');
    if (currentIndex === -1 || currentIndex >= flow.length - 1) return null;
    return flow[currentIndex + 1];
}

export function OrdersPageClient({ initialData }: OrdersPageClientProps) {
    const searchParams = useSearchParams();
    const { loading, markLoaded } = usePageLoadGuard('orders');

    // Initialize state with server data - NO loading flash!
    const [orders, setOrders] = useState<OrderSummary[]>(initialData?.orders ?? []);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequestSummary[]>(
        initialData?.service_requests ?? []
    );
    const [refreshing, setRefreshing] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const restaurantId = initialData?.restaurant_id;

    // Get filter values from URL
    const statusFilter = searchParams.get('status') ?? 'all';
    const searchQuery = searchParams.get('q') ?? '';

    // Mark loaded after initial render
    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    // Subscribe to realtime updates using existing hook
    useKDSRealtime({
        restaurantId: restaurantId ?? '',
        enabled: !!restaurantId,
        onNewOrder: order => {
            setOrders(prev => [
                {
                    id: order.id,
                    order_number: order.id.slice(0, 8).toUpperCase(),
                    status: order.status as string,
                    table_number: null,
                    created_at: order.created_at,
                    total_price: null,
                    notes: null,
                },
                ...prev,
            ]);
        },
        onOrderUpdate: order => {
            setOrders(prev =>
                prev.map(o => (o.id === order.id ? { ...o, status: order.status as string } : o))
            );
        },
        onOrderDelete: orderId => {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        },
    });

    // Refresh data from server
    const refreshData = useCallback(async () => {
        if (!restaurantId) return;

        setRefreshing(true);
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                ...(searchQuery && { q: searchQuery }),
            });

            const response = await fetch(`/api/orders?${params}`);
            const result = await response.json();

            if (response.ok) {
                setOrders(result.data?.orders ?? []);
                setServiceRequests(result.data?.service_requests ?? []);
            }
        } catch (error) {
            console.error('Failed to refresh orders:', error);
            toast.error('Failed to refresh orders');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId, statusFilter, searchQuery]);

    // Handle order status update
    const handleStatusUpdate = useCallback(
        async (orderId: string, newStatus: string) => {
            setUpdatingOrderId(orderId);

            // Optimistic update
            setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));

            try {
                const response = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error ?? 'Failed to update order status');
                }

                toast.success('Order status updated');
            } catch (error) {
                // Revert on error
                setOrders(prev =>
                    prev.map(o =>
                        o.id === orderId
                            ? {
                                  ...o,
                                  status:
                                      initialData?.orders.find(io => io.id === orderId)?.status ??
                                      o.status,
                              }
                            : o
                    )
                );
                toast.error(
                    error instanceof Error ? error.message : 'Failed to update order status'
                );
            } finally {
                setUpdatingOrderId(null);
            }
        },
        [initialData?.orders]
    );

    // Handle service request completion
    const handleCompleteRequest = useCallback(async (requestId: string) => {
        setServiceRequests(prev =>
            prev.map(r => (r.id === requestId ? { ...r, status: 'completed' } : r))
        );

        try {
            const response = await fetch(`/api/service-requests/${requestId}/complete`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to complete service request');
            }

            toast.success('Service request completed');
        } catch (error) {
            setServiceRequests(prev =>
                prev.map(r => (r.id === requestId ? { ...r, status: 'pending' } : r))
            );
            toast.error('Failed to complete service request');
        }
    }, []);

    // Filter orders based on URL params
    const filteredOrders = useMemo(() => {
        let filtered = orders;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                o =>
                    o.order_number?.toLowerCase().includes(query) ||
                    o.table_number?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [orders, statusFilter, searchQuery]);

    // Pending service requests
    const pendingRequests = useMemo(
        () => serviceRequests.filter(r => r.status === 'pending'),
        [serviceRequests]
    );

    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Orders</h1>
                    <p className="font-medium text-gray-500">
                        Manage orders and service requests in real-time.
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Pending Service Requests */}
            {pendingRequests.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="mb-2 font-bold text-amber-800">Pending Service Requests</h3>
                    <div className="space-y-2">
                        {pendingRequests.map(request => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between rounded-xl bg-white p-3"
                            >
                                <div>
                                    <span className="font-medium">{request.request_type}</span>
                                    {request.table_number && (
                                        <span className="ml-2 text-sm text-gray-500">
                                            Table {request.table_number}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleCompleteRequest(request.id)}
                                    className="rounded-lg bg-amber-500 px-3 py-1 text-sm font-bold text-white hover:bg-amber-600"
                                >
                                    Complete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50/60">
                            <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                <th className="px-5 py-4">Table</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Time</th>
                                <th className="px-5 py-4">Total</th>
                                <th className="px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const nextStatus = getNextStatus(order.status);
                                    const isUpdating = updatingOrderId === order.id;

                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-gray-50 transition-colors duration-150 last:border-0 hover:bg-gray-50/50"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {order.table_number || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase',
                                                        statusPill(order.status)
                                                    )}
                                                >
                                                    {(order.status || 'unknown').replace(
                                                        'service_',
                                                        ''
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    <span
                                                        className={cn(
                                                            'text-sm font-semibold',
                                                            ageTone(order.created_at)
                                                        )}
                                                    >
                                                        {order.created_at
                                                            ? new Date(
                                                                  order.created_at
                                                              ).toLocaleTimeString([], {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
                                                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                                    {formatCurrencyCompact(order.total_price)} ETB
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        disabled={!nextStatus || isUpdating}
                                                        onClick={() =>
                                                            nextStatus &&
                                                            handleStatusUpdate(order.id, nextStatus)
                                                        }
                                                        className={cn(
                                                            'h-9 rounded-xl px-3 text-xs font-bold transition-all duration-200',
                                                            !nextStatus
                                                                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                                        )}
                                                    >
                                                        {isUpdating
                                                            ? 'Updating…'
                                                            : nextStatus
                                                              ? nextStatus
                                                                    .replace('_', ' ')
                                                                    .replace(/\b\w/g, c =>
                                                                        c.toUpperCase()
                                                                    )
                                                              : 'Done'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
