'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Filter, Utensils, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Order, ServiceRequest } from '@/types/database';
import { OrderCard } from '@/components/merchant/OrderCard';
import { BulkActionBar } from '@/components/merchant/BulkActionBar';
import { isAbortError, isLockError } from '@/hooks/useSafeFetch';
import { formatCurrencyCompact } from '@/lib/utils/monetary';

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
            const savedFilter =
                (typeof window !== 'undefined'
                    ? localStorage.getItem('orders.activeFilter')
                    : null) ?? 'all';
            const cached = sessionStorage.getItem(`orders.cache.${savedFilter}.1`);
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const savedFilter =
                (typeof window !== 'undefined'
                    ? localStorage.getItem('orders.activeFilter')
                    : null) ?? 'all';
            const cached = sessionStorage.getItem(`orders.srCache.${savedFilter}.1`);
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
    const [page, setPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalSRs, setTotalSRs] = useState(0);
    const PAGE_SIZE = 24;

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
                params.set('limit', PAGE_SIZE.toString());
                params.set('offset', ((page - 1) * PAGE_SIZE).toString());

                const response = await fetch(`/api/orders?${params.toString()}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    // Don't throw on 401 - user may be in an intermediate auth state
                    // Keep showing stale data instead of flashing empty
                    if (response.status === 401) {
                        console.warn('[OrdersPage] Auth state uncertain (401), keeping stale data');
                        return;
                    }
                    throw new Error(`Failed to fetch orders (${response.status})`);
                }

                const payload = await response.json();
                // Only replace state when real data arrives — never flash empty
                const fresh = payload?.data?.orders ?? [];
                setOrders(fresh);
                setTotalOrders(payload?.data?.total ?? 0);
                // Write-through cache keyed by filter+search
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
            } catch (error) {
                if (isAbortError(error)) return; // stale request — ignore
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
            const cacheKey = `orders.srCache.${status}.${search.trim()}.${page}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) setServiceRequests(JSON.parse(cached));
            } catch {
                // Ignore cache read errors (e.g., IndexedDB lock issues)
            }

            try {
                const params = new URLSearchParams();
                if (status !== 'all') {
                    params.set('status', status);
                }
                if (search.trim().length > 0) {
                    params.set('search', search.trim());
                }
                params.set('limit', PAGE_SIZE.toString());
                params.set('offset', ((page - 1) * PAGE_SIZE).toString());

                const response = await fetch(`/api/service-requests?${params.toString()}`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    // Don't throw on 401 - user may be in an intermediate auth state
                    // Keep showing stale data instead of flashing empty
                    if (response.status === 401) {
                        console.warn(
                            '[OrdersPage] Auth state uncertain (401), keeping stale service requests'
                        );
                        return;
                    }
                    throw new Error(`Failed to fetch service requests (${response.status})`);
                }
                const payload = await response.json();
                // Only replace state when real data arrives — never flash empty
                const fresh = payload?.data?.requests ?? [];
                setServiceRequests(fresh);
                setTotalSRs(payload?.data?.total ?? 0);
                // Write-through cache keyed by filter+search
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
            } catch (error) {
                if (isAbortError(error)) return; // stale request — ignore
                if (isLockError(error)) {
                    console.warn('[OrdersPage] IndexedDB lock contention, keeping stale data');
                    return;
                }
                console.error('Error fetching orders from API:', error);
                // Do NOT clear orders on error — keep showing stale data
            }
        },
        [user, page]
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
        const storedSortKey = window.localStorage.getItem('orders.sortKey');
        const storedSortDirection = window.localStorage.getItem('orders.sortDirection');
        if (storedSearch) {
            setSearchTerm(storedSearch);
            setDebouncedSearchTerm(storedSearch);
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
            if (event.key === 'ArrowRight') setPage(p => p + 1);
            if (event.key === 'ArrowLeft') setPage(p => Math.max(1, p - 1));
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset to first page on search
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
        page,
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

    const _handleSortChange = (key: 'created_at' | 'table_number' | 'status' | 'total_price') => {
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

    const _toggleAllVisibleSelection = () => {
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
                <div className="overflow-hidden rounded-4xl bg-white shadow-sm ring-1 ring-gray-100">
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
                </div>
            </div>

            {/* Status Filters (Matches Skeleton) */}
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveFilter(tab.id);
                            setPage(1);
                        }}
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
            <div className="space-y-6">
                {queueOrders.length === 0 ? (
                    <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-4xl bg-white p-12 text-center shadow-sm">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-4xl bg-gray-50 shadow-sm">
                            <Utensils className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900">No orders found</h3>
                        <p className="text-lg font-medium text-gray-500">
                            Try changing the filter or search term.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {queueOrders.map(order => {
                            const isServiceRequest = order.id.startsWith(
                                SERVICE_REQUEST_ROW_PREFIX
                            );
                            const nextStatus = getNextStatus(order.status);
                            const isSelected =
                                !isServiceRequest && selectedOrderIds.includes(order.id);

                            return (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    isServiceRequest={isServiceRequest}
                                    nextStatus={nextStatus}
                                    isUpdating={updatingOrderId === order.id}
                                    isSelected={isSelected}
                                    loadingOrderId={loadingOrderId}
                                    onOpenDetails={handleOpenDetails}
                                    onStatusUpdate={handleStatusUpdate}
                                    onToggleOrder={toggleOrderSelection}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Pagination UI */}
                {(totalOrders > PAGE_SIZE || totalSRs > PAGE_SIZE) && (
                    <div className="border-brand-neutral-soft/5 mt-8 flex items-center justify-between border-t pt-6">
                        <p className="text-body-sm text-brand-neutral font-medium">
                            Showing{' '}
                            <span className="text-brand-ink font-bold">
                                {(page - 1) * PAGE_SIZE + 1}
                            </span>{' '}
                            to{' '}
                            <span className="text-brand-ink font-bold">
                                {Math.min(page * PAGE_SIZE, Math.max(totalOrders, totalSRs))}
                            </span>{' '}
                            of{' '}
                            <span className="text-brand-ink font-bold">
                                {Math.max(totalOrders, totalSRs)}
                            </span>{' '}
                            orders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="border-brand-neutral-soft/10 text-brand-ink hover:bg-brand-canvas-alt inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * PAGE_SIZE >= Math.max(totalOrders, totalSRs)}
                                className="border-brand-neutral-soft/10 text-brand-ink hover:bg-brand-canvas-alt inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
                <div className="bg-brand-ink/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="shadow-strong ring-brand-neutral-soft/10 w-full max-w-lg rounded-4xl bg-white p-8 ring-1">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h3 className="text-brand-ink text-2xl font-bold tracking-tight">
                                    Order #
                                    {selectedOrderDetails?.order?.order_number ||
                                        selectedOrderDetails?.order?.id.slice(0, 8)}
                                </h3>
                                <p className="text-body-sm text-brand-neutral mt-1 font-medium">
                                    Table {selectedOrderDetails?.order?.table_number || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrderDetails(null)}
                                className="bg-brand-canvas-alt text-brand-neutral hover:bg-brand-canvas-alt hover:text-brand-ink flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-body-sm space-y-4">
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Status
                                </span>
                                <span className="text-brand-ink font-bold">
                                    {selectedOrderDetails?.order?.status || 'N/A'}
                                </span>
                            </div>
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Total
                                </span>
                                <span className="text-brand-ink font-bold">
                                    {selectedOrderDetails?.order &&
                                        formatCurrencyCompact(
                                            selectedOrderDetails.order.total_price
                                        )}{' '}
                                    ETB
                                </span>
                            </div>
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Created
                                </span>
                                <span className="text-brand-ink font-bold">
                                    {selectedOrderDetails?.order?.created_at
                                        ? new Date(
                                              selectedOrderDetails.order.created_at
                                          ).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="py-2">
                                <p className="text-brand-neutral text-micro mb-2 font-bold tracking-wider uppercase">
                                    Notes
                                </p>
                                <p className="bg-brand-canvas-alt text-body text-brand-ink rounded-2xl p-4 font-medium">
                                    {selectedOrderDetails?.order?.notes || 'No notes'}
                                </p>
                            </div>
                            <div className="py-2">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                        Timeline
                                    </p>
                                    {loadingEvents && (
                                        <span className="text-micro text-brand-accent animate-pulse font-bold uppercase">
                                            Syncing…
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                                    {loadingEvents &&
                                    (selectedOrderDetails.events ?? []).length === 0 ? (
                                        <div className="space-y-3">
                                            <div className="bg-brand-canvas-alt h-12 animate-pulse rounded-2xl" />
                                            <div className="bg-brand-canvas-alt h-12 animate-pulse rounded-2xl" />
                                        </div>
                                    ) : (selectedOrderDetails.events ?? []).length === 0 ? (
                                        <p className="text-body-sm text-brand-neutral">
                                            No timeline events yet.
                                        </p>
                                    ) : (
                                        selectedOrderDetails.events.map(event => (
                                            <div
                                                key={event.id}
                                                className="bg-brand-canvas-alt rounded-2xl px-4 py-3"
                                            >
                                                <p className="text-body-sm text-brand-ink font-bold">
                                                    {event.from_status
                                                        ? `${event.from_status} → `
                                                        : ''}
                                                    {event.to_status ?? event.event_type}
                                                </p>
                                                <p className="text-micro text-brand-neutral mt-1 font-medium">
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
                <div className="bg-brand-ink/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="shadow-strong ring-brand-neutral-soft/10 w-full max-w-lg rounded-4xl bg-white p-8 ring-1">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h3 className="text-brand-ink text-2xl font-bold tracking-tight">
                                    Service Request #{selectedServiceRequest.id.slice(0, 8)}
                                </h3>
                                <p className="text-body-sm text-brand-neutral mt-1 font-medium">
                                    Table {selectedServiceRequest.table_number || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedServiceRequest(null)}
                                className="bg-brand-canvas-alt text-brand-neutral hover:bg-brand-canvas-alt hover:text-brand-ink flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-body-sm space-y-4">
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Request Type
                                </span>
                                <span className="text-brand-ink font-bold capitalize">
                                    {selectedServiceRequest.request_type}
                                </span>
                            </div>
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Status
                                </span>
                                <span className="text-brand-ink font-bold">
                                    {selectedServiceRequest.status || 'N/A'}
                                </span>
                            </div>
                            <div className="border-brand-neutral-soft/5 flex justify-between border-b py-2">
                                <span className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                    Created
                                </span>
                                <span className="text-brand-ink font-bold">
                                    {selectedServiceRequest.created_at
                                        ? new Date(
                                              selectedServiceRequest.created_at
                                          ).toLocaleString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="py-2">
                                <p className="text-brand-neutral text-micro mb-2 font-bold tracking-wider uppercase">
                                    Notes
                                </p>
                                <p className="bg-brand-canvas-alt text-body text-brand-ink rounded-2xl p-4 font-medium">
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
