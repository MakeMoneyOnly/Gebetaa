'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Filter, Utensils, X } from 'lucide-react';
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

function toServiceStatus(
    queueStatus: string | null
): 'pending' | 'in_progress' | 'completed' | null {
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
    { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
    // Seed from sessionStorage cache so the table renders instantly on tab-switch
    // (stale-while-revalidate pattern — fresh data replaces it silently in background)
    // Read the saved filter from localStorage so we seed the RIGHT cache key on mount
    const [orders, setOrders] = useState<Order[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const savedFilter = localStorage.getItem('orders.activeFilter') ?? 'all';
            const cached = sessionStorage.getItem(`orders.cache.${savedFilter}.`);
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const savedFilter = localStorage.getItem('orders.activeFilter') ?? 'all';
            const cached = sessionStorage.getItem(`orders.srCache.${savedFilter}.`);
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    // Only show skeleton on very first ever load — persisted in sessionStorage so
    // tab switches / minimize-restore never re-trigger it
    const [loading, setLoading] = useState(() => {
        if (typeof window === 'undefined') return true;
        return sessionStorage.getItem('orders.initialLoadDone') !== '1';
    });
    // Ref to abort stale in-flight requests when filter/search changes
    const ordersAbortRef = React.useRef<AbortController | null>(null);
    const srAbortRef = React.useRef<AbortController | null>(null);
    // Initialize activeFilter directly from localStorage (not in a useEffect) so it's
    // correct on the very first render and matches the cache seed above
    const [activeFilter, setActiveFilter] = useState(() => {
        if (typeof window === 'undefined') return 'all';
        const saved = localStorage.getItem('orders.activeFilter') ?? 'all';
        const validFilters = ['all', 'pending', 'completed', 'cancelled'];
        return validFilters.includes(saved) ? saved : 'all';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailsPayload | null>(
        null
    );
    const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(
        null
    );
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionInfo, setActionInfo] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'cards'>('table');
    const [sortKey, setSortKey] = useState<
        'created_at' | 'table_number' | 'status' | 'total_price'
    >('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<
        'acknowledged' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
    >('acknowledged');
    const [bulkStaffId, setBulkStaffId] = useState('');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const { user, loading: roleLoading } = useRole(null);
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
                setServiceRequests(prev =>
                    prev.map(request =>
                        request.id === requestId
                            ? { ...request, status: nextServiceStatus }
                            : request
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
                        setActionError(
                            payload?.error ?? 'Invalid status transition. Please refresh and retry.'
                        );
                        return;
                    }
                    throw new Error(`Failed to update service request status (${response.status})`);
                }
                return;
            } catch (error) {
                console.error('Failed to update service request status:', error);
                setActionError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to update service request status.'
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
                prev.map(order => (order.id === orderId ? { ...order, status: nextStatus } : order))
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
                    setActionError(
                        payload?.error ?? 'Invalid status transition. Please refresh and retry.'
                    );
                    return;
                }
                throw new Error(`Failed to update order status (${response.status})`);
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            setActionError(
                error instanceof Error ? error.message : 'Failed to update order status.'
            );
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleOpenDetails = async (orderId: string) => {
        if (orderId.startsWith(SERVICE_REQUEST_ROW_PREFIX)) {
            const requestId = orderId.replace(SERVICE_REQUEST_ROW_PREFIX, '');
            const request = serviceRequests.find(entry => entry.id === requestId) ?? null;
            if (!request) {
                setDetailsError('Unable to load service request details.');
                return;
            }
            setDetailsError(null);
            setSelectedOrderDetails(null);
            setSelectedServiceRequest(request);
            return;
        }

        // Open modal immediately with cached order data — no waiting
        const cachedOrder = orders.find(o => o.id === orderId) ?? null;
        if (cachedOrder) {
            setDetailsError(null);
            setSelectedServiceRequest(null);
            setSelectedOrderDetails({ order: cachedOrder, events: [] });
        } else {
            setLoadingOrderId(orderId);
        }

        // Fetch full details (with events) in the background
        try {
            setLoadingEvents(true);
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
            if (!cachedOrder) setSelectedOrderDetails(null);
        } finally {
            setLoadingOrderId(null);
            setLoadingEvents(false);
        }
    };

    const fetchOrders = useCallback(
        async (status: string, search: string) => {
            if (!user) {
                setOrders([]);
                setLoading(false);
                return;
            }

            // Abort any previous in-flight request for orders (race condition fix)
            ordersAbortRef.current?.abort();
            const controller = new AbortController();
            ordersAbortRef.current = controller;

            // Seed UI instantly from per-filter cache — no empty flash
            const cacheKey = `orders.cache.${status}.${search.trim()}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) setOrders(JSON.parse(cached));
            } catch {}

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
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch orders (${response.status})`);
                }

                const payload = await response.json();
                // Only replace state when real data arrives — never flash empty
                const fresh = payload?.data?.orders ?? [];
                setOrders(fresh);
                // Write-through cache keyed by filter+search
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
            } catch (error) {
                if ((error as Error).name === 'AbortError') return; // stale request — ignore
                console.error('Error fetching orders from API:', error);
                // Do NOT clear orders on error — keep showing stale data
            }
        },
        [user]
    );

    const fetchServiceRequests = useCallback(
        async (status: string, search: string) => {
            if (!user) {
                setServiceRequests([]);
                return;
            }

            // Abort any previous in-flight SR request (race condition fix)
            srAbortRef.current?.abort();
            const controller = new AbortController();
            srAbortRef.current = controller;

            // Seed UI instantly from per-filter cache
            const cacheKey = `orders.srCache.${status}.${search.trim()}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) setServiceRequests(JSON.parse(cached));
            } catch {}

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
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch service requests (${response.status})`);
                }
                const payload = await response.json();
                // Only replace state when real data arrives — never flash empty
                const fresh = payload?.data?.requests ?? [];
                setServiceRequests(fresh);
                // Write-through cache keyed by filter+search
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
            } catch (error) {
                if ((error as Error).name === 'AbortError') return; // stale request — ignore
                console.error('Error fetching service requests from API:', error);
                // Do NOT clear on error — keep showing stale data
            }
        },
        [user]
    );

    const fetchStaff = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/staff', {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) return;
            const payload = await response.json();
            setStaff(
                (payload?.data?.staff ?? []).filter((member: StaffMember) => member.is_active)
            );
        } catch {
            setStaff([]);
        }
    }, [user]);

    useEffect(() => {
        const storedSearch = window.localStorage.getItem('orders.searchTerm');
        const storedView = window.localStorage.getItem('orders.viewMode');
        const storedSortKey = window.localStorage.getItem('orders.sortKey');
        const storedSortDirection = window.localStorage.getItem('orders.sortDirection');
        if (storedSearch) {
            setSearchTerm(storedSearch);
            setDebouncedSearchTerm(storedSearch);
        }
        if (storedView === 'table' || storedView === 'cards' || storedView === 'kanban') {
            setViewMode(storedView);
        }
        if (
            storedSortKey === 'created_at' ||
            storedSortKey === 'table_number' ||
            storedSortKey === 'status' ||
            storedSortKey === 'total_price'
        ) {
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
        if (roleLoading) return;

        if (user) {
            const alreadyLoaded = sessionStorage.getItem('orders.initialLoadDone') === '1';
            if (!alreadyLoaded) {
                setLoading(true);
            }
            Promise.all([
                fetchOrders(activeFilter, debouncedSearchTerm),
                fetchServiceRequests(activeFilter, debouncedSearchTerm),
            ]).finally(() => {
                sessionStorage.setItem('orders.initialLoadDone', '1');
                setLoading(false);
            });
            fetchStaff();
        } else {
            setLoading(false);
        }
    }, [
        activeFilter,
        debouncedSearchTerm,
        fetchOrders,
        fetchServiceRequests,
        fetchStaff,
        user,
        roleLoading,
    ]);

    // Silently refresh when the tab becomes visible again — enterprise pattern.
    // Uses its own fetch path so it NEVER aborts the main useEffect fetch.
    useEffect(() => {
        const onVisibilityChange = async () => {
            if (document.visibilityState !== 'visible' || !user || roleLoading) return;

            // Seed from cache first so existing data stays visible while we refresh
            const ordersCacheKey = `orders.cache.${activeFilter}.${debouncedSearchTerm.trim()}`;
            const srCacheKey = `orders.srCache.${activeFilter}.${debouncedSearchTerm.trim()}`;

            try {
                const params = new URLSearchParams();
                if (activeFilter !== 'all') params.set('status', activeFilter);
                if (debouncedSearchTerm.trim()) params.set('search', debouncedSearchTerm.trim());
                params.set('limit', '100');

                const [ordersRes, srRes] = await Promise.all([
                    fetch(`/api/orders?${params.toString()}`, { method: 'GET', cache: 'no-store' }),
                    fetch(`/api/service-requests?${params.toString()}`, {
                        method: 'GET',
                        cache: 'no-store',
                    }),
                ]);

                if (ordersRes.ok) {
                    const payload = await ordersRes.json();
                    const fresh = payload?.data?.orders ?? [];
                    setOrders(fresh);
                    try {
                        sessionStorage.setItem(ordersCacheKey, JSON.stringify(fresh));
                    } catch {}
                }
                if (srRes.ok) {
                    const payload = await srRes.json();
                    const fresh = payload?.data?.requests ?? [];
                    setServiceRequests(fresh);
                    try {
                        sessionStorage.setItem(srCacheKey, JSON.stringify(fresh));
                    } catch {}
                }
            } catch {
                // Network error — keep showing stale data, don't clear anything
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [activeFilter, debouncedSearchTerm, user, roleLoading]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                // Re-fetch to get full sorting/filtering correctly
                fetchOrders(activeFilter, debouncedSearchTerm);
            })
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
                .filter(order => !order.id.startsWith(SERVICE_REQUEST_ROW_PREFIX))
                .map(order => order.id)
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
        setSelectedOrderIds(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleAllVisibleSelection = () => {
        const visibleIds = queueOrders
            .filter(order => !order.id.startsWith(SERVICE_REQUEST_ROW_PREFIX))
            .map(order => order.id);
        const allVisibleSelected = visibleIds.every(id => selectedOrderIds.includes(id));
        if (allVisibleSelected) {
            setSelectedOrderIds(prev => prev.filter(id => !visibleIds.includes(id)));
            return;
        }
        setSelectedOrderIds(prev => Array.from(new Set([...prev, ...visibleIds])));
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
            setActionInfo(
                `Updated ${payload?.data?.updated_count ?? selectedOrderIds.length} orders to ${bulkStatus}.`
            );
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
                selectedOrderIds.map(async orderId => {
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
            <div className="min-h-screen space-y-8 pb-20">
                {/* Header — mirrors the real header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-36 rounded-xl" />
                        <Skeleton className="h-4 w-64 rounded-lg" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-64 rounded-xl" />
                        <Skeleton className="h-12 w-24 rounded-xl" />
                        <Skeleton className="h-12 w-40 rounded-xl" />
                    </div>
                </div>

                {/* Filter pills — mirrors the real tabs */}
                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                    {[120, 90, 110, 100].map((w, i) => (
                        <Skeleton
                            key={i}
                            className="h-10 flex-shrink-0 rounded-xl"
                            style={{ width: w }}
                        />
                    ))}
                </div>

                {/* Queue table skeleton — mirrors the real table exactly */}
                <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                    {/* Table header */}
                    <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                        <Skeleton className="ml-8 h-3 w-16 rounded" />
                        <Skeleton className="ml-8 h-3 w-12 rounded" />
                        <Skeleton className="ml-8 h-3 w-12 rounded" />
                        <Skeleton className="ml-auto h-3 w-16 rounded" />
                    </div>
                    {/* Table rows */}
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div
                            key={i}
                            className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0"
                        >
                            {/* Checkbox */}
                            <Skeleton className="h-4 w-4 flex-shrink-0 rounded" />
                            {/* Table number */}
                            <Skeleton className="h-8 w-8 flex-shrink-0 rounded-xl" />
                            {/* Status pill */}
                            <Skeleton className="ml-4 h-6 w-24 flex-shrink-0 rounded-full" />
                            {/* Time */}
                            <Skeleton className="ml-4 h-4 w-20 flex-shrink-0 rounded" />
                            {/* Total */}
                            <Skeleton className="ml-4 h-4 w-16 flex-shrink-0 rounded" />
                            {/* Actions */}
                            <div className="ml-auto flex gap-2">
                                <Skeleton className="h-9 w-20 rounded-xl" />
                                <Skeleton className="h-9 w-24 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Orders</h1>
                    <p className="font-medium text-gray-500">
                        Manage and track your restaurant orders.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="group relative">
                        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-gray-600" />
                        <input
                            id="orders-search-input"
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            className="h-12 w-64 rounded-xl border border-gray-200 bg-gray-50 pr-4 pl-11 text-sm font-medium transition-all outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
                        />
                    </div>
                    <button className="flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-800 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'h-9 rounded-lg px-4 text-xs font-bold transition-all duration-200',
                                viewMode === 'table'
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Queue
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                'h-9 rounded-lg px-4 text-xs font-bold transition-all duration-200',
                                viewMode === 'kanban'
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn(
                                'h-9 rounded-lg px-4 text-xs font-bold transition-all duration-200',
                                viewMode === 'cards'
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Filters (Matches Skeleton) */}
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={cn(
                            'h-10 rounded-xl px-5 text-sm font-bold whitespace-nowrap transition-all duration-200',
                            activeFilter === tab.id
                                ? 'bg-black text-white shadow-sm'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {queueOrders.length === 0 ? (
                <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] bg-white p-12 text-center shadow-sm">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gray-50 shadow-sm">
                        <Utensils className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-900">No orders found</h3>
                    <p className="text-lg font-medium text-gray-500">
                        Try changing the filter or search term.
                    </p>
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {queueOrders.length === 0 ? (
                        <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] bg-white p-12 text-center shadow-sm">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gray-50 shadow-sm">
                                <Utensils className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">
                                No orders found
                            </h3>
                            <p className="text-lg font-medium text-gray-500">
                                Try changing the filter or search term.
                            </p>
                        </div>
                    ) : (
                        queueOrders.map(order => {
                            const isServiceRequest = order.id.startsWith(
                                SERVICE_REQUEST_ROW_PREFIX
                            );
                            let statusColor = 'bg-blue-50 text-blue-700 ring-blue-200/60';
                            if (
                                order.status === 'completed' ||
                                order.status === 'service_completed'
                            )
                                statusColor = 'bg-emerald-50 text-emerald-700 ring-emerald-200/60';
                            else if (
                                order.status === 'pending' ||
                                order.status === 'service_pending'
                            )
                                statusColor = 'bg-amber-50 text-amber-700 ring-amber-200/60';
                            else if (order.status === 'cancelled')
                                statusColor = 'bg-red-50 text-red-700 ring-red-200/60';
                            else if (order.status === 'ready')
                                statusColor = 'bg-green-50 text-green-700 ring-green-200/60';
                            else if (
                                order.status === 'preparing' ||
                                order.status === 'acknowledged' ||
                                order.status === 'service_in_progress'
                            )
                                statusColor = 'bg-orange-50 text-orange-700 ring-orange-200/60';

                            const nextStatus = getNextStatus(order.status);
                            const isUpdating = updatingOrderId === order.id;
                            const isSelected =
                                !isServiceRequest && selectedOrderIds.includes(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        'group relative flex min-h-72 flex-col gap-4 overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg',
                                        isSelected ? 'ring-2 ring-black/10' : 'ring-1 ring-gray-100'
                                    )}
                                >
                                    {/* Top image-like area — status badge overlay, like Menu cards */}
                                    <div className="relative flex h-36 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-gray-50">
                                        {/* Decorative background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                                        {/* Big table number centered */}
                                        <span className="relative text-6xl font-black tracking-tighter text-gray-200 select-none">
                                            {order.table_number || '?'}
                                        </span>
                                        {/* Status badge top-left like Menu's In Stock badge */}
                                        <div className="absolute top-3 left-3">
                                            <span
                                                className={cn(
                                                    'rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 backdrop-blur-md',
                                                    statusColor
                                                )}
                                            >
                                                {(order.status || '').replace('service_', '')}
                                            </span>
                                        </div>
                                        {/* Service request badge top-right */}
                                        {isServiceRequest ? (
                                            <div className="absolute top-3 right-3">
                                                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase ring-1 ring-blue-200/60">
                                                    SR
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="absolute top-3 right-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleOrderSelection(order.id)}
                                                    className="h-4 w-4 rounded border-gray-300 accent-gray-800"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info — like Menu card name/price row */}
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                    Table
                                                </p>
                                                <h4 className="text-xl leading-tight font-bold text-gray-900">
                                                    {order.table_number || 'N/A'}
                                                </h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                    Total
                                                </p>
                                                <p className="font-bold whitespace-nowrap text-gray-900">
                                                    {isServiceRequest
                                                        ? serviceRequests.find(
                                                              r =>
                                                                  `${SERVICE_REQUEST_ROW_PREFIX}${r.id}` ===
                                                                  order.id
                                                          )?.notes || 'Request'
                                                        : `${order.total_price} ETB`}
                                                </p>
                                            </div>
                                        </div>
                                        <p
                                            className={cn(
                                                'text-xs font-semibold',
                                                (() => {
                                                    const age = order.created_at
                                                        ? Math.max(
                                                              0,
                                                              Math.floor(
                                                                  (Date.now() -
                                                                      new Date(
                                                                          order.created_at
                                                                      ).getTime()) /
                                                                      60000
                                                              )
                                                          )
                                                        : 0;
                                                    if (age >= 30) return 'text-red-500';
                                                    if (age >= 15) return 'text-orange-500';
                                                    return 'text-gray-400';
                                                })()
                                            )}
                                        >
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleTimeString(
                                                      [],
                                                      { hour: '2-digit', minute: '2-digit' }
                                                  )
                                                : 'N/A'}
                                        </p>
                                    </div>

                                    {/* Action Buttons — like Menu card Inline Edit / Advanced */}
                                    <div className="mt-auto flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenDetails(order.id)}
                                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
                                        >
                                            {loadingOrderId === order.id ? 'Loading…' : 'Details'}
                                        </button>
                                        <button
                                            disabled={!nextStatus || isUpdating}
                                            onClick={() =>
                                                handleStatusUpdate(order.id, order.status)
                                            }
                                            className={cn(
                                                'h-9 rounded-xl px-3 text-xs font-semibold transition-all duration-200',
                                                !nextStatus
                                                    ? 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400'
                                                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            )}
                                        >
                                            {isUpdating
                                                ? 'Updating…'
                                                : nextStatus
                                                  ? nextStatus
                                                        .replace('service_', '')
                                                        .replace('_', ' ')
                                                        .replace(/\b\w/g, c => c.toUpperCase())
                                                  : 'Done'}
                                        </button>
                                    </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-gray-100">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Order #
                                    {selectedOrderDetails.order.order_number ||
                                        selectedOrderDetails.order.id.slice(0, 8)}
                                </h3>
                                <p className="mt-0.5 text-sm text-gray-500">
                                    Table {selectedOrderDetails.order.table_number || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrderDetails(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Status</span>
                                <span className="font-bold text-gray-900">
                                    {selectedOrderDetails.order.status || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Total</span>
                                <span className="font-bold text-gray-900">
                                    {selectedOrderDetails.order.total_price} ETB
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Created</span>
                                <span className="font-bold text-gray-900">
                                    {selectedOrderDetails.order.created_at
                                        ? new Date(
                                              selectedOrderDetails.order.created_at
                                          ).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="py-2">
                                <p className="mb-2 font-medium text-gray-500">Notes</p>
                                <p className="rounded-xl bg-gray-50 p-3 text-sm font-medium text-gray-800">
                                    {selectedOrderDetails.order.notes || 'No notes'}
                                </p>
                            </div>
                            <div className="py-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="font-medium text-gray-500">Timeline</p>
                                    {loadingEvents && (
                                        <span className="animate-pulse text-[10px] text-gray-400">
                                            Loading…
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {loadingEvents &&
                                    (selectedOrderDetails.events ?? []).length === 0 ? (
                                        <div className="space-y-2">
                                            <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                                            <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                                        </div>
                                    ) : (selectedOrderDetails.events ?? []).length === 0 ? (
                                        <p className="text-xs text-gray-400">
                                            No timeline events yet.
                                        </p>
                                    ) : (
                                        selectedOrderDetails.events.map(event => (
                                            <div
                                                key={event.id}
                                                className="rounded-xl bg-gray-50 px-3 py-2.5"
                                            >
                                                <p className="text-xs font-bold text-gray-700">
                                                    {event.from_status
                                                        ? `${event.from_status} → `
                                                        : ''}
                                                    {event.to_status ?? event.event_type}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-gray-400">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-gray-100">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Service Request #{selectedServiceRequest.id.slice(0, 8)}
                                </h3>
                                <p className="mt-0.5 text-sm text-gray-500">
                                    Table {selectedServiceRequest.table_number || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedServiceRequest(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Request Type</span>
                                <span className="font-bold text-gray-900 capitalize">
                                    {selectedServiceRequest.request_type}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Status</span>
                                <span className="font-bold text-gray-900">
                                    {selectedServiceRequest.status || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 py-2">
                                <span className="font-medium text-gray-500">Created</span>
                                <span className="font-bold text-gray-900">
                                    {selectedServiceRequest.created_at
                                        ? new Date(
                                              selectedServiceRequest.created_at
                                          ).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="py-2">
                                <p className="mb-2 font-medium text-gray-500">Notes</p>
                                <p className="rounded-xl bg-gray-50 p-3 text-sm font-medium text-gray-800">
                                    {selectedServiceRequest.notes || 'No notes'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailsError && !selectedOrderDetails && !selectedServiceRequest && (
                <div className="fixed right-6 bottom-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 shadow-lg">
                    {detailsError}
                </div>
            )}
            {actionError && (
                <div className="fixed bottom-6 left-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700 shadow-lg">
                    {actionError}
                </div>
            )}
            {actionInfo && (
                <div className="fixed right-6 bottom-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 shadow-lg">
                    {actionInfo}
                </div>
            )}
        </div>
    );
}
