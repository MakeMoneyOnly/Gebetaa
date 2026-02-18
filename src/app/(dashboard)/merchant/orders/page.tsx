'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Filter, Clock, DollarSign, Utensils, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Order, ServiceRequest } from '@/types/database';
import { OrdersQueueTable } from '@/components/merchant/OrdersQueueTable';
import { OrdersKanbanBoard } from '@/components/merchant/OrdersKanbanBoard';
import { BulkActionBar } from '@/components/merchant/BulkActionBar';

type OrderEvent = {
    id: string;
    event_type: string;
    from_status: string | null;
    to_status: string | null;
    created_at: string;
};

type OrderDetailsPayload = {
    order: Order;
    events: OrderEvent[];
};

type StaffMember = {
    id: string;
    user_id: string;
    role: string | null;
    is_active: boolean;
};

const SERVICE_REQUEST_ROW_PREFIX = 'sr_';

function toServiceStatus(queueStatus: string | null): 'pending' | 'in_progress' | 'completed' | null {
    if (queueStatus === 'service_pending') return 'pending';
    if (queueStatus === 'service_in_progress') return 'in_progress';
    if (queueStatus === 'service_completed') return 'completed';
    return null;
}

function toQueueStatus(serviceStatus: string | null): string {
    if (serviceStatus === 'completed') return 'service_completed';
    if (serviceStatus === 'in_progress') return 'service_in_progress';
    return 'service_pending';
}

function serviceRequestToQueueOrder(request: ServiceRequest): Order {
    return {
        id: `${SERVICE_REQUEST_ROW_PREFIX}${request.id}`,
        table_number: request.table_number,
        status: toQueueStatus(request.status),
        created_at: request.created_at,
        total_price: 0,
        order_number: `SR-${request.id.slice(0, 6)}`,
        notes: request.notes ?? `Service request: ${request.request_type}`,
        restaurant_id: request.restaurant_id ?? '',
        items: [],
        acknowledged_at: null,
        bar_status: null,
        completed_at: request.completed_at,
        customer_name: null,
        customer_phone: null,
        guest_fingerprint: null,
        idempotency_key: null,
        kitchen_status: null,
        station: null,
        telegram_status: null,
        updated_at: request.created_at,
    } as unknown as Order;
}

// Static filter tabs
const filterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailsPayload | null>(null);
    const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionInfo, setActionInfo] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'cards'>('table');
    const [sortKey, setSortKey] = useState<'created_at' | 'table_number' | 'status' | 'total_price'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<'acknowledged' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'>('acknowledged');
    const [bulkStaffId, setBulkStaffId] = useState('');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const { user } = useRole(null);
    const supabase = createClient();

    const getNextStatus = (status: string | null) => {
        switch (status) {
            case 'service_pending':
                return 'service_in_progress';
            case 'service_in_progress':
                return 'service_completed';
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
    };

    const handleStatusUpdate = async (orderId: string, currentStatus: string | null) => {
        if (orderId.startsWith(SERVICE_REQUEST_ROW_PREFIX)) {
            const requestId = orderId.replace(SERVICE_REQUEST_ROW_PREFIX, '');
            const nextQueueStatus = getNextStatus(currentStatus);
            const nextServiceStatus = toServiceStatus(nextQueueStatus);
            if (!nextServiceStatus) {
                return;
            }

            try {
                setUpdatingOrderId(orderId);
                setActionError(null);
                const previousRequests = serviceRequests;
                setServiceRequests((prev) =>
                    prev.map((request) =>
                        request.id === requestId ? { ...request, status: nextServiceStatus } : request
                    )
                );
                const response = await fetch(`/api/service-requests/${requestId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: nextServiceStatus }),
                });
                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    setServiceRequests(previousRequests);
                    if (response.status === 409) {
                        setActionError(payload?.error ?? 'Invalid status transition. Please refresh and retry.');
                        return;
                    }
                    throw new Error(`Failed to update service request status (${response.status})`);
                }
                return;
            } catch (error) {
                console.error('Failed to update service request status:', error);
                setActionError(
                    error instanceof Error ? error.message : 'Failed to update service request status.'
                );
                return;
            } finally {
                setUpdatingOrderId(null);
            }
        }

        const nextStatus = getNextStatus(currentStatus);
        if (!nextStatus) {
            return;
        }

        try {
            setUpdatingOrderId(orderId);
            setActionError(null);
            const previousOrders = orders;
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: nextStatus } : order
                )
            );
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setOrders(previousOrders);
                if (response.status === 409) {
                    setActionError(payload?.error ?? 'Invalid status transition. Please refresh and retry.');
                    return;
                }
                throw new Error(`Failed to update order status (${response.status})`);
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            setActionError(error instanceof Error ? error.message : 'Failed to update order status.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleOpenDetails = async (orderId: string) => {
        if (orderId.startsWith(SERVICE_REQUEST_ROW_PREFIX)) {
            const requestId = orderId.replace(SERVICE_REQUEST_ROW_PREFIX, '');
            const request = serviceRequests.find((entry) => entry.id === requestId) ?? null;
            if (!request) {
                setDetailsError('Unable to load service request details.');
                return;
            }
            setDetailsError(null);
            setSelectedOrderDetails(null);
            setSelectedServiceRequest(request);
            return;
        }

        try {
            setLoadingOrderId(orderId);
            setDetailsError(null);
            setSelectedServiceRequest(null);
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch order details (${response.status})`);
            }
            const payload = await response.json();
            setSelectedOrderDetails(payload?.data ?? null);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            setDetailsError('Unable to load order details.');
            setSelectedOrderDetails(null);
        } finally {
            setLoadingOrderId(null);
        }
    };

    const fetchOrders = useCallback(async (status: string, search: string) => {
        setLoading(true);
        if (!user) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams();
            if (status !== 'all') {
                params.set('status', status);
            }
            if (search.trim().length > 0) {
                params.set('search', search.trim());
            }
            params.set('limit', '100');

            const response = await fetch(`/api/orders?${params.toString()}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch orders (${response.status})`);
            }

            const payload = await response.json();
            setOrders(payload?.data?.orders ?? []);
        } catch (error) {
            console.error('Error fetching orders from API:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchServiceRequests = useCallback(async (status: string, search: string) => {
        if (!user) {
            setServiceRequests([]);
            return;
        }
        try {
            const params = new URLSearchParams();
            if (status !== 'all') {
                params.set('status', status);
            }
            if (search.trim().length > 0) {
                params.set('search', search.trim());
            }
            params.set('limit', '100');

            const response = await fetch(`/api/service-requests?${params.toString()}`, {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch service requests (${response.status})`);
            }
            const payload = await response.json();
            setServiceRequests(payload?.data?.requests ?? []);
        } catch (error) {
            console.error('Error fetching service requests from API:', error);
            setServiceRequests([]);
        }
    }, [user]);

    const fetchStaff = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/staff', {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) return;
            const payload = await response.json();
            setStaff((payload?.data?.staff ?? []).filter((member: StaffMember) => member.is_active));
        } catch {
            setStaff([]);
        }
    }, [user]);

    useEffect(() => {
        const storedFilter = window.localStorage.getItem('orders.activeFilter');
        const storedSearch = window.localStorage.getItem('orders.searchTerm');
        const storedView = window.localStorage.getItem('orders.viewMode');
        const storedSortKey = window.localStorage.getItem('orders.sortKey');
        const storedSortDirection = window.localStorage.getItem('orders.sortDirection');
        if (storedFilter && filterTabs.some(tab => tab.id === storedFilter)) {
            setActiveFilter(storedFilter);
        }
        if (storedSearch) {
            setSearchTerm(storedSearch);
            setDebouncedSearchTerm(storedSearch);
        }
        if (storedView === 'table' || storedView === 'cards' || storedView === 'kanban') {
            setViewMode(storedView);
        }
        if (storedSortKey === 'created_at' || storedSortKey === 'table_number' || storedSortKey === 'status' || storedSortKey === 'total_price') {
            setSortKey(storedSortKey);
        }
        if (storedSortDirection === 'asc' || storedSortDirection === 'desc') {
            setSortDirection(storedSortDirection);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem('orders.activeFilter', activeFilter);
    }, [activeFilter]);

    useEffect(() => {
        window.localStorage.setItem('orders.searchTerm', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        window.localStorage.setItem('orders.viewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        window.localStorage.setItem('orders.sortKey', sortKey);
    }, [sortKey]);

    useEffect(() => {
        window.localStorage.setItem('orders.sortDirection', sortDirection);
    }, [sortDirection]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === '/' && !(event.target instanceof HTMLInputElement)) {
                event.preventDefault();
                const input = document.getElementById('orders-search-input');
                input?.focus();
                return;
            }
            if (event.key === '1') setActiveFilter('all');
            if (event.key === '2') setActiveFilter('pending');
            if (event.key === '3') setActiveFilter('completed');
            if (event.key === '4') setActiveFilter('cancelled');
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (user) {
            fetchOrders(activeFilter, debouncedSearchTerm);
            fetchServiceRequests(activeFilter, debouncedSearchTerm);
            fetchStaff();
        } else {
            setLoading(false);
        }
    }, [activeFilter, debouncedSearchTerm, fetchOrders, fetchServiceRequests, fetchStaff, user]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    // Re-fetch to get full sorting/filtering correctly
                    fetchOrders(activeFilter, debouncedSearchTerm);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'service_requests' },
                () => {
                    fetchServiceRequests(activeFilter, debouncedSearchTerm);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeFilter, debouncedSearchTerm, fetchOrders, fetchServiceRequests, supabase]);

    const serviceRequestRows = useMemo(
        () => serviceRequests.map(serviceRequestToQueueOrder),
        [serviceRequests]
    );
    
    const queueRows = useMemo(
        () => [...orders, ...serviceRequestRows],
        [orders, serviceRequestRows]
    );

    // Filter logic
    const filteredOrders = useMemo(() => {
        return queueRows.filter(order => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'pending') {
                return order.status === 'pending' || order.status === 'service_pending';
            }
            if (activeFilter === 'completed') {
                return order.status === 'completed' || order.status === 'service_completed';
            }
            return order.status === activeFilter;
        });
    }, [queueRows, activeFilter]);

    const queueOrders = useMemo(() => {
        return [...filteredOrders].sort((a, b) => {
            const aValue =
                sortKey === 'total_price'
                    ? Number(a.total_price ?? 0)
                    : sortKey === 'created_at'
                        ? new Date(a.created_at ?? 0).getTime()
                        : String(a[sortKey] ?? '').toLowerCase();
            const bValue =
                sortKey === 'total_price'
                    ? Number(b.total_price ?? 0)
                    : sortKey === 'created_at'
                        ? new Date(b.created_at ?? 0).getTime()
                        : String(b[sortKey] ?? '').toLowerCase();

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredOrders, sortKey, sortDirection]);

    const handleSortChange = (key: 'created_at' | 'table_number' | 'status' | 'total_price') => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortKey(key);
        setSortDirection('asc');
    };

    useEffect(() => {
        const visibleIds = new Set(
            queueOrders
                .filter((order) => !order.id.startsWith(SERVICE_REQUEST_ROW_PREFIX))
                .map((order) => order.id)
        );
        setSelectedOrderIds(prev => {
            // Only update if there are selected items that are no longer visible
            const filtered = prev.filter(id => visibleIds.has(id));
            if (filtered.length === prev.length) {
                return prev; // Return same reference if nothing changed
            }
            return filtered;
        });
    }, [queueOrders]);

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleAllVisibleSelection = () => {
        const visibleIds = queueOrders
            .filter((order) => !order.id.startsWith(SERVICE_REQUEST_ROW_PREFIX))
            .map((order) => order.id);
        const allVisibleSelected = visibleIds.every((id) => selectedOrderIds.includes(id));
        if (allVisibleSelected) {
            setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
            return;
        }
        setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    };

    const applyBulkStatus = async () => {
        if (selectedOrderIds.length === 0) return;
        try {
            setBulkLoading(true);
            setActionError(null);
            setActionInfo(null);
            const response = await fetch('/api/orders/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_ids: selectedOrderIds,
                    status: bulkStatus,
                }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setActionError(payload?.error ?? `Bulk status failed (${response.status})`);
                return;
            }
            setActionInfo(`Updated ${payload?.data?.updated_count ?? selectedOrderIds.length} orders to ${bulkStatus}.`);
            setSelectedOrderIds([]);
            fetchOrders(activeFilter, debouncedSearchTerm);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Bulk status update failed.');
        } finally {
            setBulkLoading(false);
        }
    };

    const applyBulkAssign = async () => {
        if (selectedOrderIds.length === 0 || !bulkStaffId) return;
        try {
            setBulkLoading(true);
            setActionError(null);
            setActionInfo(null);
            const results = await Promise.all(
                selectedOrderIds.map(async (orderId) => {
                    const response = await fetch(`/api/orders/${orderId}/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ staff_id: bulkStaffId }),
                    });
                    return response.ok;
                })
            );
            const successCount = results.filter(Boolean).length;
            if (successCount === 0) {
                setActionError('Bulk assignment failed for all selected orders.');
                return;
            }
            if (successCount < selectedOrderIds.length) {
                setActionError(`Assigned ${successCount}/${selectedOrderIds.length} orders.`);
            } else {
                setActionInfo(`Assigned ${successCount} orders successfully.`);
            }
            setSelectedOrderIds([]);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Bulk assignment failed.');
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 rounded-xl" />
                        <Skeleton className="h-4 w-64 rounded-lg" />
                    </div>
                    {/* Header Actions Skeleton */}
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-64 rounded-xl" />
                        <Skeleton className="h-12 w-24 rounded-xl" />
                    </div>
                </div>
                {/* Filter Pills Skeleton */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-28 rounded-xl flex-shrink-0" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-6 rounded-[2rem] space-y-4 bg-white shadow-sm flex flex-col justify-between h-[280px]">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full rounded-lg" />
                                <Skeleton className="h-4 w-2/3 rounded-lg" />
                            </div>
                            <div className="pt-4 mt-auto flex gap-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Orders</h1>
                    <p className="text-gray-500 font-medium">Manage and track your restaurant orders.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                        <input
                            id="orders-search-input"
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="pl-11 pr-4 h-12 w-64 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        />
                    </div>
                    <button className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <div className="flex rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "h-10 px-3 rounded-lg text-xs font-bold transition-colors",
                                viewMode === 'table' ? "bg-black text-white" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Queue
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                "h-10 px-3 rounded-lg text-xs font-bold transition-colors",
                                viewMode === 'kanban' ? "bg-black text-white" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn(
                                "h-10 px-3 rounded-lg text-xs font-bold transition-colors",
                                viewMode === 'cards' ? "bg-black text-white" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Filters (Matches Skeleton) */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={cn(
                            "h-10 px-6 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                            activeFilter === tab.id
                                ? "bg-black text-white shadow-lg shadow-black/10"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {queueOrders.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white rounded-[2rem] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                        <Utensils className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500 font-medium text-lg">Try changing the filter or search term.</p>
                </div>
            ) : viewMode === 'table' ? (
                <OrdersQueueTable
                    orders={queueOrders}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    onOpenDetails={handleOpenDetails}
                    onStatusUpdate={handleStatusUpdate}
                    getNextStatus={getNextStatus}
                    loadingOrderId={loadingOrderId}
                    updatingOrderId={updatingOrderId}
                    selectedOrderIds={selectedOrderIds}
                    onToggleOrder={toggleOrderSelection}
                    onToggleAllVisible={toggleAllVisibleSelection}
                />
            ) : viewMode === 'kanban' ? (
                <OrdersKanbanBoard
                    orders={queueOrders}
                    onOpenDetails={handleOpenDetails}
                    onStatusUpdate={handleStatusUpdate}
                    getNextStatus={getNextStatus}
                    loadingOrderId={loadingOrderId}
                    updatingOrderId={updatingOrderId}
                    selectedOrderIds={selectedOrderIds}
                    onToggleOrder={toggleOrderSelection}
                />
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queueOrders.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-[2rem] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                            <Utensils className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-500 font-medium text-lg">Try changing the filter or search term.</p>
                    </div>
                ) : (
                    queueOrders.map((order) => {
                        const isServiceRequest = order.id.startsWith(SERVICE_REQUEST_ROW_PREFIX);
                        let statusColor = "bg-blue-50 text-blue-600";
                        if (order.status === 'completed' || order.status === 'service_completed') statusColor = "bg-green-50 text-green-600";
                        else if (order.status === 'pending' || order.status === 'service_pending') statusColor = "bg-yellow-50 text-yellow-600";
                        else if (order.status === 'cancelled') statusColor = "bg-red-50 text-red-600";
                        else if (order.status === 'ready') statusColor = "bg-green-50 text-green-600";
                        else if (order.status === 'preparing' || order.status === 'acknowledged' || order.status === 'service_in_progress') statusColor = "bg-orange-50 text-orange-600";

                        const nextStatus = getNextStatus(order.status);
                        const isUpdating = updatingOrderId === order.id;
                        const isSelected = !isServiceRequest && selectedOrderIds.includes(order.id);

                        return (
                            <div key={order.id} className={cn(
                                "group p-6 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[320px] relative overflow-hidden",
                                isSelected ? "ring-2 ring-black/10 border border-black/20" : ""
                            )}>
                                {isServiceRequest ? (
                                    <div className="mb-2">
                                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                            Service Request
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mb-2">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleOrderSelection(order.id)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </div>
                                )}

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative z-10">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Table</span>
                                        <h4 className="text-4xl font-extrabold text-gray-900 tracking-tighter">
                                            {order.table_number || 'N/A'}
                                        </h4>
                                        {isServiceRequest ? (
                                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                                {serviceRequests.find((request) => `${SERVICE_REQUEST_ROW_PREFIX}${request.id}` === order.id)?.request_type || 'service'}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm",
                                        statusColor
                                    )}>
                                        {(order.status || '').replace('service_', '')}
                                    </span>
                                </div>

                                {/* Order Info */}
                                <div className="space-y-4 mb-8 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                                            <p className={cn(
                                                "text-sm font-bold",
                                                (() => {
                                                    const ageMinutes = order.created_at
                                                        ? Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000))
                                                        : 0;
                                                    if (ageMinutes >= 30) return "text-red-600";
                                                    if (ageMinutes >= 15) return "text-orange-600";
                                                    return "text-green-600";
                                                })()
                                            )}>
                                                {new Date(order.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {isServiceRequest
                                                    ? (serviceRequests.find((request) => `${SERVICE_REQUEST_ROW_PREFIX}${request.id}` === order.id)?.notes || 'No notes')
                                                    : `${order.total_price} ETB`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons - Overlay Style */}
                                <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                                    <button
                                        onClick={() => handleOpenDetails(order.id)}
                                        className="h-12 rounded-2xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:scale-[1.02]"
                                    >
                                        {loadingOrderId === order.id ? 'Loading...' : 'Details'}
                                    </button>
                                    <button
                                        disabled={!nextStatus || isUpdating}
                                        onClick={() => handleStatusUpdate(order.id, order.status)}
                                        className={cn(
                                            "h-12 rounded-2xl text-xs font-bold transition-all flex items-center justify-center",
                                            !nextStatus
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-[1.02]"
                                        )}
                                    >
                                        {isUpdating
                                            ? 'Updating...'
                                            : nextStatus
                                                ? `Mark ${nextStatus.replace('service_', '')}`
                                                : 'No Action'}
                                    </button>
                                </div>

                                {/* Decorative Gradient on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        );
                    })
                )}
            </div>
            )}

            <BulkActionBar
                selectedCount={selectedOrderIds.length}
                selectedStatus={bulkStatus}
                onStatusChange={setBulkStatus}
                onApplyStatus={applyBulkStatus}
                selectedStaffId={bulkStaffId}
                onStaffChange={setBulkStaffId}
                onApplyAssign={applyBulkAssign}
                onClearSelection={() => setSelectedOrderIds([])}
                staffOptions={staff}
                loading={bulkLoading}
            />

            {selectedOrderDetails?.order && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-black">
                                    Order #{selectedOrderDetails.order.order_number || selectedOrderDetails.order.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-gray-500">Table {selectedOrderDetails.order.table_number || 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrderDetails(null)}
                                className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="font-semibold text-black">{selectedOrderDetails.order.status || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total</span>
                                <span className="font-semibold text-black">{selectedOrderDetails.order.total_price} ETB</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-semibold text-black">
                                    {selectedOrderDetails.order.created_at
                                        ? new Date(selectedOrderDetails.order.created_at).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Notes</p>
                                <p className="font-medium text-black bg-gray-50 rounded-xl p-3">
                                    {selectedOrderDetails.order.notes || 'No notes'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-2">Timeline</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {(selectedOrderDetails.events ?? []).length === 0 ? (
                                        <p className="text-xs text-gray-400">No timeline events yet.</p>
                                    ) : (
                                        selectedOrderDetails.events.map((event) => (
                                            <div key={event.id} className="rounded-lg border border-gray-100 px-3 py-2">
                                                <p className="text-xs font-semibold text-gray-700">
                                                    {event.from_status ? `${event.from_status} -> ` : ''}{event.to_status ?? event.event_type}
                                                </p>
                                                <p className="text-[11px] text-gray-400">
                                                    {new Date(event.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedServiceRequest && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-black">
                                    Service Request #{selectedServiceRequest.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-gray-500">Table {selectedServiceRequest.table_number || 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedServiceRequest(null)}
                                className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Request Type</span>
                                <span className="font-semibold text-black">{selectedServiceRequest.request_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="font-semibold text-black">{selectedServiceRequest.status || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-semibold text-black">
                                    {selectedServiceRequest.created_at
                                        ? new Date(selectedServiceRequest.created_at).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Notes</p>
                                <p className="font-medium text-black bg-gray-50 rounded-xl p-3">
                                    {selectedServiceRequest.notes || 'No notes'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailsError && !selectedOrderDetails && !selectedServiceRequest && (
                <div className="fixed bottom-6 right-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl shadow-lg">
                    {detailsError}
                </div>
            )}
            {actionError && (
                <div className="fixed bottom-6 left-6 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded-xl shadow-lg">
                    {actionError}
                </div>
            )}
            {actionInfo && (
                <div className="fixed bottom-6 right-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl shadow-lg">
                    {actionInfo}
                </div>
            )}
        </div>
    );
}
