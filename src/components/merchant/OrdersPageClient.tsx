'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { OrdersKanbanBoard } from '@/components/merchant/OrdersKanbanBoard';
import { OrdersQueueTable } from '@/components/merchant/OrdersQueueTable';
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

export function OrdersPageClient({ initialData }: OrdersPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loading, markLoaded } = usePageLoadGuard('orders');

    // Initialize state with server data - NO loading flash!
    const [orders, setOrders] = useState<OrderSummary[]>(initialData?.orders ?? []);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequestSummary[]>(
        initialData?.service_requests ?? []
    );
    const [refreshing, setRefreshing] = useState(false);

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

    // Subscribe to realtime updates
    useRealtimeSubscription({
        channel: `orders:${restaurantId}`,
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
        onInsert: (payload) => {
            setOrders(prev => [payload.new as OrderSummary, ...prev]);
        },
        onUpdate: (payload) => {
            setOrders(prev =>
                prev.map(o => (o.id === payload.new.id ? (payload.new as OrderSummary) : o))
            );
        },
        onDelete: (payload) => {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
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
            // Optimistic update
            setOrders(prev =>
                prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
            );

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
                        o.id === orderId ? { ...o, status: initialData?.orders.find(io => io.id === orderId)?.status ?? o.status } : o
                    )
                );
                toast.error(error instanceof Error ? error.message : 'Failed to update order status');
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
                prev.map(r =>
                    r.id === requestId ? { ...r, status: 'pending' } : r
                )
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

            {/* Service Requests Queue */}
            {pendingRequests.length > 0 && (
                <ServiceRequestQueue
                    requests={pendingRequests}
                    onComplete={handleCompleteRequest}
                />
            )}

            {/* Orders Table */}
            <OrdersTable
                orders={filteredOrders}
                loading={loading && !initialData}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
}