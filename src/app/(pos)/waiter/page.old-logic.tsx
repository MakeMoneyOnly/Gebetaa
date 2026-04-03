'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/Button';
import {
    Bell,
    ChefHat,
    LogOut,
    UtensilsCrossed,
    Users,
    RefreshCw,
    ChevronLeft,
    Search,
    ShoppingBag,
    X,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { CategoryWithItems, MenuItem, Order } from '@/types/database';
import { format } from 'date-fns';
import { calculateDiscount } from '@/lib/discounts/calculator';
import type { DiscountRecord } from '@/lib/discounts/types';
import { useDeviceHeartbeat } from '@/hooks/useDeviceHeartbeat';
import { formatCurrencyCompact } from '@/lib/utils/monetary';

interface PosTable {
    id: string;
    table_number: string;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'bill_requested';
    active_order_id?: string | null;
    capacity: number;
    zone?: string | null;
}

interface CartItem extends MenuItem {
    cartId: string;
    quantity: number;
    notes?: string;
}

interface ServiceRequest {
    id: string;
    restaurant_id: string;
    table_number: string;
    request_type: 'waiter' | 'bill' | 'cutlery' | string;
    status: 'pending' | 'acknowledged' | 'completed';
    notes?: string | null;
    created_at: string;
}

type DiningOption = 'dine_in' | 'pickup' | 'delivery' | 'online';
type SplitMethod = 'even' | 'items' | 'custom';
type SplitPaymentMethod = 'cash' | 'card' | 'chapa' | 'other';

interface SettlementSplit {
    id: string;
    split_index: number;
    split_label?: string | null;
    computed_amount: number;
    requested_amount?: number | null;
    status: string;
}

interface SettlementPayment {
    id: string;
    split_id?: string | null;
    amount: number;
    tip_amount: number;
    method: string;
    status: string;
}

interface SettlementSplitPayload {
    order: { id: string; total_price: number; status: string };
    method?: SplitMethod;
    order_items?: Array<{
        id: string;
        name: string;
        quantity: number | null;
        price: number;
        notes?: string | null;
    }>;
    splits: SettlementSplit[];
    split_items: Array<Record<string, unknown>>;
    split_payments: SettlementPayment[];
}

function WaiterPosContent() {
    const searchParams = useSearchParams();
    const queryRestaurantId = searchParams.get('restaurantId');
    const { restaurantId: roleRestaurantId, loading: roleLoading } = useRole(queryRestaurantId);
    const router = useRouter();

    // Staff Context State
    const [staffContext, setStaffContext] = useState<Record<string, unknown> | null>(null);

    // Resolve restaurantId: prefer query param > localStorage device info > role hook
    // (Waiter POS devices have no Supabase auth session — they use a device token)
    const [deviceRestaurantId, setDeviceRestaurantId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('gebata_device_info');
            if (raw) {
                const info = JSON.parse(raw);
                if (info?.restaurant_id) setDeviceRestaurantId(info.restaurant_id);
                if (info) setStaffContext(info);
            }
            // Also load staff login context if present
            const ctx = sessionStorage.getItem('gebata_waiter_context');
            if (ctx) setStaffContext(JSON.parse(ctx));
        } catch (e) {
            console.error('Failed to parse device/staff context', e);
        }
    }, []);

    const restaurantId = queryRestaurantId || deviceRestaurantId || roleRestaurantId;

    // Data State
    const [tables, setTables] = useState<PosTable[]>([]);
    const [menu, setMenu] = useState<CategoryWithItems[]>([]);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [tableOrders, setTableOrders] = useState<Order[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [availableDiscounts, setAvailableDiscounts] = useState<DiscountRecord[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tables' | 'kitchen' | 'alerts'>('tables');
    const [orderSubTab, setOrderSubTab] = useState<'new' | 'orders'>('new');
    const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'order'>('list');

    // Order State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClosingTable, setIsClosingTable] = useState(false);
    const [isRequestingBill, setIsRequestingBill] = useState(false);
    const [chapaTxRef, setChapaTxRef] = useState('');
    const [settlementPaymentMethod, setSettlementPaymentMethod] =
        useState<SplitPaymentMethod>('cash');
    const [selectedSettlementOrderId, setSelectedSettlementOrderId] = useState<string | null>(null);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>('even');
    const [splitGuestCount, setSplitGuestCount] = useState(2);
    const [splitCustomAmounts, setSplitCustomAmounts] = useState<string[]>(['', '']);
    const [splitPaymentMethod, setSplitPaymentMethod] = useState<SplitPaymentMethod>('cash');
    const [splitPayload, setSplitPayload] = useState<SettlementSplitPayload | null>(null);
    const [splitPaymentAmounts, setSplitPaymentAmounts] = useState<Record<string, string>>({});
    const [splitItemAssignments, setSplitItemAssignments] = useState<Record<string, number>>({});
    const [isSavingSplitConfig, setIsSavingSplitConfig] = useState(false);
    const [isLoadingSplitConfig, setIsLoadingSplitConfig] = useState(false);
    const [capturingSplitId, setCapturingSplitId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [diningOption, setDiningOption] = useState<DiningOption>('dine_in');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [selectedDiscountId, setSelectedDiscountId] = useState('');
    const [managerPin, setManagerPin] = useState('');
    const [dismissedReadyOrderIds, setDismissedReadyOrderIds] = useState<string[]>([]);

    const supabase = useMemo(() => getSupabaseClient(), []);

    // Device token for authenticated API calls (set after pairing, no auth session needed)
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    useEffect(() => {
        const token = sessionStorage.getItem('gebata_device_token');
        if (token) setDeviceToken(token);
    }, []);

    useDeviceHeartbeat({
        deviceToken,
        route: '/waiter',
        enabled: Boolean(deviceToken),
    });

    /** Build headers for device-authenticated API calls */
    const deviceHeaders = useCallback(
        (): Record<string, string> =>
            deviceToken
                ? { 'Content-Type': 'application/json', 'x-device-token': deviceToken }
                : { 'Content-Type': 'application/json' },
        [deviceToken]
    );

    // 1. Fetch Tables
    const fetchTables = useCallback(async () => {
        if (!restaurantId) return;
        try {
            // Use device-auth endpoint when running on a paired device
            const endpoint = deviceToken ? '/api/device/tables' : '/api/tables';
            const response = await fetch(endpoint, { headers: deviceHeaders() });
            const payload = await response.json();

            if (!response.ok) throw new Error(payload.error || 'Failed to load tables');

            const fetchedTables = (payload.data?.tables || []).map(
                (t: Record<string, unknown>) => ({
                    id: t.id,
                    table_number: t.table_number,
                    status: t.status,
                    active_order_id: t.active_order_id,
                    capacity: t.capacity,
                    zone: t.zone,
                })
            );

            setTables(fetchedTables);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update tables');
        }
    }, [restaurantId, deviceToken, deviceHeaders]);

    // 2. Fetch Menu (device-auth route to avoid RLS issues without a user session)
    const fetchMenu = useCallback(async () => {
        if (!restaurantId) return;
        try {
            if (deviceToken) {
                const response = await fetch('/api/device/menu', { headers: deviceHeaders() });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Failed to load menu');
                setMenu((payload.data?.categories ?? []) as CategoryWithItems[]);
            } else {
                // Fallback: merchant preview via authenticated Supabase client
                const { data, error } = await supabase
                    .from('categories')
                    .select('*, items:menu_items(*)')
                    .eq('restaurant_id', restaurantId)
                    .order('order_index');
                if (error) throw error;
                setMenu(data as CategoryWithItems[]);
            }
        } catch (err) {
            console.error('Error fetching menu:', err);
            toast.error('Failed to load menu');
        }
    }, [restaurantId, deviceToken, deviceHeaders, supabase]);

    const fetchDiscounts = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const endpoint = deviceToken ? '/api/device/discounts' : '/api/discounts';
            const response = await fetch(endpoint, {
                headers: deviceToken ? deviceHeaders() : undefined,
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to load discounts');
            }
            setAvailableDiscounts((payload.data?.discounts ?? []) as DiscountRecord[]);
        } catch (error) {
            console.error('Error fetching discounts:', error);
            setAvailableDiscounts([]);
        }
    }, [restaurantId, deviceToken, deviceHeaders]);

    // 3. Fetch Active Orders (for Kitchen tab)
    const fetchActiveOrders = useCallback(async () => {
        if (!restaurantId) return;
        try {
            if (deviceToken) {
                const response = await fetch('/api/device/orders', { headers: deviceHeaders() });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Failed to load orders');
                setActiveOrders((payload.data?.orders ?? []) as Order[]);
            } else {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .in('status', ['pending', 'acknowledged', 'preparing', 'ready', 'served'])
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setActiveOrders((data as Order[]) || []);
            }
        } catch (err) {
            console.error('Error fetching active orders:', err);
        }
    }, [restaurantId, deviceToken, deviceHeaders, supabase]);

    // 4. Fetch orders for a specific table
    const fetchTableOrders = useCallback(
        async (tableNumber: string) => {
            if (!restaurantId) return;
            try {
                if (deviceToken) {
                    const response = await fetch(
                        `/api/device/orders?table_number=${encodeURIComponent(tableNumber)}`,
                        { headers: deviceHeaders() }
                    );
                    const payload = await response.json();
                    if (!response.ok)
                        throw new Error(payload.error || 'Failed to load table orders');
                    setTableOrders((payload.data?.orders ?? []) as Order[]);
                } else {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('restaurant_id', restaurantId)
                        .eq('table_number', tableNumber)
                        .in('status', ['pending', 'acknowledged', 'preparing', 'ready', 'served'])
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    setTableOrders((data as Order[]) || []);
                }
            } catch (err) {
                console.error('Error fetching table orders:', err);
            }
        },
        [restaurantId, deviceToken, deviceHeaders, supabase]
    );

    // 5. Fetch Active Service Requests
    const fetchServiceRequests = useCallback(async () => {
        if (!restaurantId) return;
        try {
            if (deviceToken) {
                const response = await fetch('/api/device/service-requests', {
                    headers: deviceHeaders(),
                });
                const payload = await response.json();
                if (!response.ok)
                    throw new Error(payload.error || 'Failed to load service requests');
                setServiceRequests((payload.data?.service_requests ?? []) as ServiceRequest[]);
            } else {
                const { data, error } = await supabase
                    .from('service_requests')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .in('status', ['pending', 'acknowledged'])
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setServiceRequests((data as ServiceRequest[]) || []);
            }
        } catch (err) {
            console.error('Error fetching service requests:', err);
        }
    }, [restaurantId, deviceToken, deviceHeaders, supabase]);

    // Initial Load & Realtime
    // For device-mode: restaurantId comes from localStorage immediately (no auth session).
    // We wait for roleLoading only when we have no device context (merchant preview mode).
    const isDeviceMode = Boolean(deviceRestaurantId || deviceToken);
    const readyToLoad = !!restaurantId && (isDeviceMode ? Boolean(deviceToken) : !roleLoading);

    useEffect(() => {
        if (!readyToLoad) return;

        setLoading(true);
        Promise.all([
            fetchTables(),
            fetchMenu(),
            fetchActiveOrders(),
            fetchServiceRequests(),
            fetchDiscounts(),
        ]).finally(() => {
            setLoading(false);
            if (isDeviceMode) setConnected(true);
        });

        if (isDeviceMode) {
            const pollingHandle = window.setInterval(() => {
                void fetchTables();
                void fetchActiveOrders();
                void fetchServiceRequests();
                setConnected(true);
            }, 10_000);

            return () => {
                window.clearInterval(pollingHandle);
            };
        }

        const channelName = `pos-tables-${restaurantId}-${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tables',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                () => void fetchTables()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                () => {
                    void fetchTables();
                    void fetchActiveOrders();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_requests',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                () => {
                    void fetchServiceRequests();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                payload => {
                    const oldOrder = payload.old as Order;
                    const newOrder = payload.new as Order;
                    if (newOrder.status === 'ready' && oldOrder.status !== 'ready') {
                        toast.success(`Table ${newOrder.table_number || '?'}: Order is READY! 🍳`, {
                            duration: 8000,
                            position: 'top-right',
                            style: {
                                background: '#10B981',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '16px',
                            },
                        });
                        // Trigger haptic if supported
                        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                    }
                }
            )
            .subscribe((status, err) => {
                console.warn('Waiter Realtime status:', status, err);
                setConnected(status === 'SUBSCRIBED');
            });

        return () => {
            setConnected(false);
            supabase.removeChannel(channel);
        };
    }, [
        readyToLoad,
        isDeviceMode,
        restaurantId,
        supabase,
        fetchTables,
        fetchMenu,
        fetchActiveOrders,
        fetchServiceRequests,
        fetchDiscounts,
    ]);

    const handleLogout = async () => {
        const supabaseBrowser = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        );
        await supabaseBrowser.auth.signOut();
        router.push('/auth/login');
    };

    useEffect(() => {
        if (!selectedTable) return;
        const latest = tables.find(table => table.id === selectedTable.id);
        if (!latest) return;

        if (
            latest.status !== selectedTable.status ||
            latest.active_order_id !== selectedTable.active_order_id
        ) {
            setSelectedTable(prev =>
                prev
                    ? {
                          ...prev,
                          status: latest.status,
                          active_order_id: latest.active_order_id,
                      }
                    : prev
            );
        }
    }, [tables, selectedTable]);

    // Navigation Logic
    const handleTableClick = (table: PosTable) => {
        setSelectedTable(table);
        setViewMode('order');
        setOrderSubTab(table.status === 'available' ? 'new' : 'orders');
        setCart([]); // Reset cart when entering new table
        setDiningOption('dine_in');
        setGuestName('');
        setGuestPhone('');
        setDeliveryAddress('');
        void fetchTableOrders(table.table_number); // Fetch existing orders for this table
    };

    const handleBackToTables = () => {
        if (cart.length > 0) {
            if (!confirm('Discard current order?')) return;
        }
        setSelectedTable(null);
        setViewMode('list');
        setCart([]);
        setTableOrders([]);
        setDiningOption('dine_in');
        setGuestName('');
        setGuestPhone('');
        setDeliveryAddress('');
        setSelectedDiscountId('');
        setManagerPin('');
    };

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
            }
            return [...prev, { ...item, cartId: Math.random().toString(36), quantity: 1 }];
        });
        toast.success(`Added ${item.name}`, { icon: '🛒', position: 'bottom-center' });
    };

    const selectedDiscount = useMemo(
        () => availableDiscounts.find(discount => discount.id === selectedDiscountId) ?? null,
        [availableDiscounts, selectedDiscountId]
    );
    const cartDiscountPreview = useMemo(
        () =>
            calculateDiscount(
                cart.map(item => ({
                    id: item.id,
                    category_id:
                        (item as MenuItem & { category_id?: string | null }).category_id ?? null,
                    price: item.price,
                    quantity: item.quantity,
                })),
                selectedDiscount
            ),
        [cart, selectedDiscount]
    );
    // Running total from all active orders on table + current cart
    const tableRunningTotal = tableOrders.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
    const grandTotal = tableRunningTotal + cartDiscountPreview.total;
    const readyOrders = useMemo(
        () => activeOrders.filter(order => order.status === 'ready'),
        [activeOrders]
    );
    const stickyReadyOrders = useMemo(
        () => readyOrders.filter(order => !dismissedReadyOrderIds.includes(order.id)),
        [dismissedReadyOrderIds, readyOrders]
    );

    useEffect(() => {
        const readyOrderIds = new Set(readyOrders.map(order => order.id));
        setDismissedReadyOrderIds(prev => prev.filter(id => readyOrderIds.has(id)));
    }, [readyOrders]);

    useEffect(() => {
        if (tableOrders.length === 0) {
            setSelectedSettlementOrderId(null);
            setSplitPayload(null);
            return;
        }

        setSelectedSettlementOrderId(prev => {
            if (prev && tableOrders.some(order => order.id === prev)) return prev;
            return tableOrders[0].id;
        });
    }, [tableOrders]);

    useEffect(() => {
        setSplitCustomAmounts(prev => {
            const next = [...prev];
            while (next.length < splitGuestCount) next.push('');
            return next.slice(0, splitGuestCount);
        });
    }, [splitGuestCount]);

    const splitOrderItems = useMemo(
        () =>
            (splitPayload?.order_items ?? []).map(item => ({
                id: String(item.id),
                name: String(item.name ?? 'Item'),
                quantity: Number(item.quantity ?? 1),
                price: Number(item.price ?? 0),
                notes: item.notes ?? null,
            })),
        [splitPayload?.order_items]
    );

    useEffect(() => {
        setSplitItemAssignments(prev => {
            const next: Record<string, number> = {};
            for (const [orderItemId, guestIndex] of Object.entries(prev)) {
                if (
                    splitOrderItems.some(item => item.id === orderItemId) &&
                    guestIndex < splitGuestCount
                ) {
                    next[orderItemId] = Math.max(0, guestIndex);
                }
            }
            return next;
        });
    }, [splitGuestCount, splitOrderItems]);

    const fetchSplitPayload = useCallback(
        async (orderId: string) => {
            setIsLoadingSplitConfig(true);
            try {
                const response = await fetch(`/api/orders/${orderId}/split`, {
                    method: 'GET',
                    headers: deviceHeaders(),
                });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error ?? 'Failed to load split configuration');
                }
                const data = (payload?.data ?? null) as SettlementSplitPayload | null;
                setSplitPayload(data);

                if (data?.splits && data.splits.length >= 2) {
                    setSplitGuestCount(Math.max(2, Math.min(12, data.splits.length)));
                }
                if (data?.method) {
                    setSplitMethod(data.method);
                }

                const splitIdToGuestIndex = new Map<string, number>();
                for (const split of data?.splits ?? []) {
                    splitIdToGuestIndex.set(split.id, Number(split.split_index ?? 0));
                }
                const assignments: Record<string, number> = {};
                for (const splitItem of data?.split_items ?? []) {
                    const splitId = String(splitItem.split_id ?? '');
                    const orderItemId = String(splitItem.order_item_id ?? '');
                    if (!splitId || !orderItemId) continue;
                    const guestIndex = splitIdToGuestIndex.get(splitId);
                    if (typeof guestIndex === 'number' && Number.isFinite(guestIndex)) {
                        assignments[orderItemId] = guestIndex;
                    }
                }
                setSplitItemAssignments(assignments);
            } catch (err: unknown) {
                console.error('Split config load error:', err);
                toast.error(
                    err instanceof Error ? err.message : 'Failed to load split configuration'
                );
            } finally {
                setIsLoadingSplitConfig(false);
            }
        },
        [deviceHeaders]
    );

    useEffect(() => {
        if (!selectedSettlementOrderId) return;
        if (selectedTable?.status !== 'bill_requested') return;
        void fetchSplitPayload(selectedSettlementOrderId);
    }, [selectedSettlementOrderId, selectedTable?.status, fetchSplitPayload]);

    const splitPaidById = useMemo(() => {
        const map = new Map<string, number>();
        const payments = splitPayload?.split_payments ?? [];
        for (const payment of payments) {
            if (!payment?.split_id) continue;
            if (!['captured', 'authorized', 'pending'].includes(payment.status)) continue;
            const current = map.get(payment.split_id) ?? 0;
            map.set(payment.split_id, current + Number(payment.amount ?? 0));
        }
        return map;
    }, [splitPayload]);

    const splitItemUnassignedCount = useMemo(
        () =>
            splitOrderItems.filter(item => {
                const guestIndex = splitItemAssignments[item.id];
                return (
                    typeof guestIndex !== 'number' ||
                    guestIndex < 0 ||
                    guestIndex >= splitGuestCount
                );
            }).length,
        [splitGuestCount, splitItemAssignments, splitOrderItems]
    );

    const splitItemTotalsByGuest = useMemo(
        () =>
            Array.from({ length: splitGuestCount }, (_, guestIndex) =>
                splitOrderItems
                    .filter(item => splitItemAssignments[item.id] === guestIndex)
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
            ),
        [splitGuestCount, splitItemAssignments, splitOrderItems]
    );

    const handleSaveSplitConfig = async () => {
        if (!selectedSettlementOrderId) {
            toast.error('Select an order first');
            return;
        }

        let splits: Array<{ guest_name: string; amount?: number; item_ids?: string[] }> = [];
        if (splitMethod === 'even') {
            splits = Array.from({ length: splitGuestCount }, (_, idx) => ({
                guest_name: `Guest ${idx + 1}`,
            }));
        } else if (splitMethod === 'custom') {
            splits = splitCustomAmounts.map((amount, idx) => ({
                guest_name: `Guest ${idx + 1}`,
                amount: Number(amount),
            }));
        } else {
            if (splitOrderItems.length === 0) {
                toast.error('No order items available for item split');
                return;
            }

            const missingCount = splitOrderItems.filter(item => {
                const guestIndex = splitItemAssignments[item.id];
                return (
                    typeof guestIndex !== 'number' ||
                    guestIndex < 0 ||
                    guestIndex >= splitGuestCount
                );
            }).length;
            if (missingCount > 0) {
                toast.error('Assign every item to a guest');
                return;
            }

            splits = Array.from({ length: splitGuestCount }, (_, idx) => ({
                guest_name: `Guest ${idx + 1}`,
                item_ids: splitOrderItems
                    .filter(item => splitItemAssignments[item.id] === idx)
                    .map(item => item.id),
            }));
        }

        if (
            splitMethod === 'custom' &&
            splits.some(entry => typeof entry.amount !== 'number' || !Number.isFinite(entry.amount))
        ) {
            toast.error('Enter valid custom amounts for all guests');
            return;
        }

        setIsSavingSplitConfig(true);
        try {
            const response = await fetch(`/api/orders/${selectedSettlementOrderId}/split`, {
                method: 'POST',
                headers: deviceHeaders(),
                body: JSON.stringify({
                    method: splitMethod,
                    splits,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to save split configuration');
            }
            toast.success('Split configuration saved');
            await fetchSplitPayload(selectedSettlementOrderId);
        } catch (err: unknown) {
            console.error('Split config save error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to save split configuration');
        } finally {
            setIsSavingSplitConfig(false);
        }
    };

    const captureSplitPayment = async (splitId: string, remainingAmount: number) => {
        if (!selectedSettlementOrderId) return;
        if (remainingAmount <= 0) {
            toast('This split is already fully paid');
            return;
        }

        const requested = Number(splitPaymentAmounts[splitId] ?? remainingAmount);
        if (!Number.isFinite(requested) || requested <= 0) {
            toast.error('Enter a valid payment amount');
            return;
        }

        setCapturingSplitId(splitId);
        try {
            const response = await fetch('/api/finance/payments', {
                method: 'POST',
                headers: deviceHeaders(),
                body: JSON.stringify({
                    order_id: selectedSettlementOrderId,
                    split_id: splitId,
                    method: splitPaymentMethod,
                    provider: splitPaymentMethod === 'chapa' ? 'chapa' : 'internal',
                    amount: Number(requested.toFixed(2)),
                    status: 'captured',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to capture split payment');
            }
            toast.success('Split payment captured');
            await fetchSplitPayload(selectedSettlementOrderId);
        } catch (err: unknown) {
            console.error('Split payment capture error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to capture split payment');
        } finally {
            setCapturingSplitId(null);
        }
    };

    // Submit Order
    const handleSubmitOrder = async () => {
        if (!selectedTable || cart.length === 0 || !restaurantId) return;
        if (diningOption === 'delivery' && deliveryAddress.trim().length === 0) {
            toast.error('Delivery address is required for delivery orders');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                table_number: selectedTable.table_number,
                order_type: diningOption,
                customer_name: guestName.trim() || null,
                customer_phone: guestPhone.trim() || null,
                delivery_address: diningOption === 'delivery' ? deliveryAddress.trim() : null,
                discount_id: selectedDiscount?.id ?? null,
                manager_pin: managerPin.trim() || null,
                staff_name: staffContext?.name || 'Waiter',
                notes: null,
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    notes: item.notes || null,
                })),
            };

            const response = await fetch('/api/device/orders', {
                method: 'POST',
                headers: {
                    ...deviceHeaders(),
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit order');
            }

            toast.success('Order sent to kitchen!', { duration: 3000 });
            setCart([]);
            setGuestName('');
            setGuestPhone('');
            setDeliveryAddress('');
            setSelectedDiscountId('');
            setManagerPin('');
            setDiningOption('dine_in');
            setOrderSubTab('orders'); // Switch to orders view after sending
            void fetchTableOrders(selectedTable.table_number); // Refresh table orders
            void fetchTables(); // Refresh status
            void fetchActiveOrders(); // Update kitchen tab
        } catch (err: unknown) {
            console.error('Submit order error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to submit order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveServiceRequest = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_requests')
                .update({ status: 'completed' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Request resolved!');
            void fetchServiceRequests();
        } catch (err) {
            console.error('Failed to resolve request:', err);
            toast.error('Failed to update request');
        }
    };

    const handleSettleAndCloseTable = async () => {
        if (!selectedTable || !deviceToken) {
            toast.error('Device authentication is required');
            return;
        }
        if (tableOrders.length === 0) {
            toast.error('No active orders to settle');
            return;
        }
        if (selectedTable.status !== 'bill_requested') {
            toast.error('Request bill before settlement');
            return;
        }

        setIsClosingTable(true);
        try {
            const closePayload = {
                table_id: selectedTable.id,
                table_number: selectedTable.table_number,
                payment: {
                    provider:
                        settlementPaymentMethod === 'cash'
                            ? settlementPaymentMethod
                            : settlementPaymentMethod === 'chapa'
                              ? 'chapa'
                              : 'other',
                    tx_ref: chapaTxRef.trim() || undefined,
                    amount: Number(tableRunningTotal.toFixed(2)),
                },
                notes: `Closed by waiter POS (${staffContext?.name ?? 'Waiter'})`,
            };

            let response = await fetch('/api/device/tables/close', {
                method: 'POST',
                headers: deviceHeaders(),
                body: JSON.stringify(closePayload),
            });
            let payload = await response.json();

            if (!response.ok && payload?.code === 'TABLE_SESSION_NOT_OPEN') {
                const ensureResponse = await fetch('/api/device/tables/ensure-open-session', {
                    method: 'POST',
                    headers: deviceHeaders(),
                    body: JSON.stringify({
                        table_id: selectedTable.id,
                        table_number: selectedTable.table_number,
                        notes: `Ensured by waiter close retry (${staffContext?.name ?? 'Waiter'})`,
                    }),
                });
                const ensurePayload = await ensureResponse.json();
                if (!ensureResponse.ok) {
                    throw new Error(
                        ensurePayload?.error ??
                            'Failed to recover open table session for settlement'
                    );
                }

                response = await fetch('/api/device/tables/close', {
                    method: 'POST',
                    headers: deviceHeaders(),
                    body: JSON.stringify(closePayload),
                });
                payload = await response.json();
            }

            if (!response.ok) {
                throw new Error(
                    payload?.error ??
                        payload?.details?.message ??
                        'Failed to settle and close table'
                );
            }

            toast.success('Table settled and closed');
            setChapaTxRef('');
            setSettlementPaymentMethod('cash');
            setCart([]);
            setTableOrders([]);
            setSelectedTable(null);
            setViewMode('list');
            setOrderSubTab('new');
            await Promise.all([fetchTables(), fetchActiveOrders(), fetchServiceRequests()]);
        } catch (err: unknown) {
            console.error('Close table error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to close table');
        } finally {
            setIsClosingTable(false);
        }
    };

    const handleRequestBill = async () => {
        if (!selectedTable || !deviceToken) {
            toast.error('Device authentication is required');
            return;
        }
        if (selectedTable.status === 'bill_requested') {
            return;
        }

        setIsRequestingBill(true);
        try {
            const response = await fetch('/api/device/tables/bill-request', {
                method: 'POST',
                headers: deviceHeaders(),
                body: JSON.stringify({
                    table_id: selectedTable.id,
                    table_number: selectedTable.table_number,
                    notes: `Bill requested by waiter ${staffContext?.name ?? 'Waiter'}`,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to request bill');
            }

            toast.success('Bill requested. Settlement is now enabled.');
            await Promise.all([fetchTables(), fetchServiceRequests()]);
            setSelectedTable(prev =>
                prev
                    ? {
                          ...prev,
                          status: 'bill_requested',
                      }
                    : prev
            );
        } catch (err: unknown) {
            console.error('Request bill error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to request bill');
        } finally {
            setIsRequestingBill(false);
        }
    };

    // Derived State for Menu
    const filteredCategories = useMemo(() => {
        return menu
            .map(cat => ({
                ...cat,
                items: cat.items.filter(
                    item =>
                        item.is_available &&
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())
                ),
            }))
            .filter(cat => cat.items.length > 0);
    }, [menu, searchQuery]);

    if (loading) {
        return (
            <div className="font-manrope flex h-screen flex-col bg-gray-50 p-6">
                <div className="flex items-start justify-between px-2 pt-2 pb-6">
                    <div>
                        <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                            Waiter Display
                        </h1>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                            <span className="flex animate-pulse items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-transparent">
                                System Live
                            </span>
                            <span className="animate-pulse rounded bg-gray-200 text-transparent">
                                |
                            </span>
                            <span className="animate-pulse rounded bg-gray-200 text-transparent">
                                0 Active Tables
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: ORDER MODE ---
    if (viewMode === 'order' && selectedTable) {
        return (
            <div className="font-manrope flex h-screen flex-col bg-gray-50 text-gray-900">
                {/* Header */}
                <div className="z-20 flex items-start justify-between bg-gray-50 px-6 pt-6 pb-4">
                    <div className="flex flex-col">
                        <div className="mb-1 flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToTables}
                                className="-ml-2 h-8 w-8 rounded-xl text-gray-400 transition-colors hover:bg-gray-200 hover:text-black"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <h1 className="text-3xl font-bold tracking-tight text-black">
                                Table {selectedTable.table_number}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                    selectedTable.status === 'bill_requested'
                                        ? 'bg-amber-100 text-amber-700'
                                        : selectedTable.status === 'occupied'
                                          ? 'bg-rose-100 text-rose-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                }`}
                            >
                                {selectedTable.status === 'bill_requested'
                                    ? 'Bill Requested'
                                    : selectedTable.status === 'occupied'
                                      ? 'Occupied'
                                      : 'Available'}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                            Table Total
                        </span>
                        <span className="text-2xl font-black tracking-tight text-black">
                            {formatCurrencyCompact(grandTotal)} br
                        </span>
                        {tableOrders.length > 0 && (
                            <span className="text-xs text-gray-400">
                                {tableOrders.length} order{tableOrders.length > 1 ? 's' : ''} active
                            </span>
                        )}
                    </div>
                </div>

                {/* Sub-Tab Switcher */}
                <div className="flex gap-2 px-6 pb-3">
                    <button
                        onClick={() => setOrderSubTab('new')}
                        className={`rounded-xl px-5 py-2 text-sm font-bold shadow-sm transition-all ${orderSubTab === 'new' ? 'bg-black text-white' : 'border border-gray-100 bg-white text-gray-600'}`}
                    >
                        + New Order
                    </button>
                    <button
                        onClick={() => setOrderSubTab('orders')}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold shadow-sm transition-all ${orderSubTab === 'orders' ? 'bg-black text-white' : 'border border-gray-100 bg-white text-gray-600'}`}
                    >
                        Table Orders
                        {tableOrders.length > 0 && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${orderSubTab === 'orders' ? 'bg-white/20' : 'bg-black text-white'}`}
                            >
                                {tableOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => void fetchTableOrders(selectedTable.table_number)}
                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                {/* NEW ORDER TAB */}
                {orderSubTab === 'new' && (
                    <>
                        <div className="px-6 pb-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                                    Dining Option
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        [
                                            { value: 'dine_in', label: 'Dine In' },
                                            { value: 'pickup', label: 'Pickup' },
                                            { value: 'delivery', label: 'Delivery' },
                                            { value: 'online', label: 'Online' },
                                        ] as const
                                    ).map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setDiningOption(option.value)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                                diningOption === option.value
                                                    ? 'bg-black text-white'
                                                    : 'border border-gray-200 bg-white text-gray-600'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                {diningOption !== 'dine_in' && (
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={e => setGuestName(e.target.value)}
                                            placeholder="Guest name (optional)"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={guestPhone}
                                            onChange={e => setGuestPhone(e.target.value)}
                                            placeholder="Guest phone (optional)"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
                                        />
                                        {diningOption === 'delivery' && (
                                            <input
                                                type="text"
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                                placeholder="Delivery address (required)"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none md:col-span-2"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 pb-4">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`rounded-xl px-5 py-2 text-sm font-bold whitespace-nowrap shadow-sm transition-all ${selectedCategory === 'all' ? 'bg-black text-white' : 'border border-gray-100 bg-white text-gray-600'}`}
                            >
                                All
                            </button>
                            {menu.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`rounded-xl px-5 py-2 text-sm font-bold whitespace-nowrap shadow-sm transition-all ${selectedCategory === cat.id ? 'bg-black text-white' : 'border border-gray-100 bg-white text-gray-600'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="px-6 pb-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-gray-100 bg-white py-3.5 pr-4 pl-10 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 overflow-y-auto px-6 pb-32">
                            {filteredCategories
                                .filter(
                                    cat => selectedCategory === 'all' || cat.id === selectedCategory
                                )
                                .map(category => (
                                    <div key={category.id} className="mb-6">
                                        <h3 className="mb-3 ml-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                            {category.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {category.items.map(item => {
                                                const inCart = cart.find(i => i.id === item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addToCart(item)}
                                                        className={`group relative flex flex-col overflow-hidden rounded-xl p-4 text-left shadow-sm transition-all active:scale-95 ${
                                                            inCart
                                                                ? 'bg-white ring-2 ring-black'
                                                                : 'border border-gray-100 bg-white'
                                                        }`}
                                                    >
                                                        <div className="mb-2 flex w-full items-start justify-between">
                                                            <span className="line-clamp-2 text-sm leading-tight font-bold text-gray-900">
                                                                {item.name}
                                                            </span>
                                                            {inCart && (
                                                                <span className="bg-brand-accent min-w-[20px] rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold text-black">
                                                                    {inCart.quantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="mt-auto text-xs font-medium text-gray-500">
                                                            {formatCurrencyCompact(item.price)} br
                                                        </span>
                                                        <div className="absolute inset-0 origin-center bg-black/0 transition-colors group-active:bg-black/5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            {filteredCategories.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <UtensilsCrossed className="mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-gray-400">No items found</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Float */}
                        {cart.length > 0 && (
                            <div className="animate-in slide-in-from-bottom fixed right-0 bottom-0 left-0 z-30 rounded-t-3xl border-t border-gray-100 bg-white p-4 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] duration-300">
                                <div className="mb-4 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black shadow-lg shadow-black/20">
                                            <ShoppingBag className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">
                                                {cart.reduce((a, b) => a + b.quantity, 0)} Items
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Ready to send
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black tracking-tight text-gray-900">
                                        {formatCurrencyCompact(cartDiscountPreview.total)} br
                                    </span>
                                </div>
                                {availableDiscounts.length > 0 && (
                                    <div className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                Discount
                                            </label>
                                            <select
                                                value={selectedDiscountId}
                                                onChange={event =>
                                                    setSelectedDiscountId(event.target.value)
                                                }
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900"
                                            >
                                                <option value="">No discount</option>
                                                {availableDiscounts.map(discount => (
                                                    <option key={discount.id} value={discount.id}>
                                                        {discount.name_am || discount.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedDiscount?.requires_manager_pin && (
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                placeholder="Manager PIN"
                                                value={managerPin}
                                                onChange={event =>
                                                    setManagerPin(event.target.value)
                                                }
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900"
                                            />
                                        )}
                                        {cartDiscountPreview.discountAmount > 0 && (
                                            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                                                <span className="font-semibold text-gray-500">
                                                    Discount applied
                                                </span>
                                                <span className="font-bold text-emerald-600">
                                                    -
                                                    {formatCurrencyCompact(
                                                        cartDiscountPreview.discountAmount
                                                    )}{' '}
                                                    br
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button
                                    className="bg-brand-accent h-14 w-full rounded-xl text-lg font-bold text-black shadow-xl shadow-black/10 transition-all hover:brightness-105 active:scale-[0.98]"
                                    onClick={handleSubmitOrder}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <>Sending...</> : `Send Order`}
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* TABLE ORDERS TAB */}
                {orderSubTab === 'orders' && (
                    <div className="flex-1 overflow-y-auto px-6 pb-8">
                        {tableOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 opacity-50">
                                <ChefHat className="mb-4 h-12 w-12 text-gray-300" />
                                <p className="font-medium text-gray-400">
                                    No active orders for this table
                                </p>
                                <button
                                    onClick={() => setOrderSubTab('new')}
                                    className="bg-brand-accent mt-4 rounded-xl px-6 py-2.5 text-sm font-bold text-black shadow-lg"
                                >
                                    + Add Order
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Running total banner */}
                                <div className="bg-brand-accent flex items-center justify-between rounded-xl p-4 text-black">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                            Table Running Total
                                        </p>
                                        <p className="text-2xl font-black">
                                            {formatCurrencyCompact(tableRunningTotal)} br
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400">
                                            {tableOrders.length} orders
                                        </p>
                                        <button
                                            onClick={() => setOrderSubTab('new')}
                                            className="mt-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/20"
                                        >
                                            + Add More
                                        </button>
                                    </div>
                                </div>

                                {selectedTable.status !== 'bill_requested' ? (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm">
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-700 uppercase">
                                            Billing
                                        </p>
                                        <p className="mb-3 text-sm text-amber-800">
                                            Request bill before settlement and close-table actions.
                                        </p>
                                        <Button
                                            onClick={handleRequestBill}
                                            disabled={isRequestingBill || tableRunningTotal <= 0}
                                            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isRequestingBill ? 'Requesting...' : 'Request Bill'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                        <p className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                                            Settlement
                                        </p>
                                        <div className="space-y-4">
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                <div className="mb-3 flex flex-wrap items-end gap-2">
                                                    <div className="min-w-[180px] flex-1">
                                                        <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                                            Order
                                                        </label>
                                                        <select
                                                            value={selectedSettlementOrderId ?? ''}
                                                            onChange={e =>
                                                                setSelectedSettlementOrderId(
                                                                    e.target.value || null
                                                                )
                                                            }
                                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                        >
                                                            {tableOrders.map(order => (
                                                                <option
                                                                    key={order.id}
                                                                    value={order.id}
                                                                >
                                                                    #{order.order_number} -{' '}
                                                                    {(
                                                                        order.total_price ?? 0
                                                                    ).toFixed(2)}{' '}
                                                                    ETB
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-[130px]">
                                                        <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                                            Split Mode
                                                        </label>
                                                        <select
                                                            value={splitMethod}
                                                            onChange={e =>
                                                                setSplitMethod(
                                                                    e.target.value as SplitMethod
                                                                )
                                                            }
                                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                        >
                                                            <option value="even">Even</option>
                                                            <option value="items">Items</option>
                                                            <option value="custom">Custom</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-[96px]">
                                                        <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                                            Guests
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={2}
                                                            max={12}
                                                            value={splitGuestCount}
                                                            onChange={e =>
                                                                setSplitGuestCount(
                                                                    Math.max(
                                                                        2,
                                                                        Math.min(
                                                                            12,
                                                                            Number(
                                                                                e.target.value || 2
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            }
                                                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleSaveSplitConfig}
                                                        disabled={
                                                            isSavingSplitConfig ||
                                                            !selectedSettlementOrderId
                                                        }
                                                        className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-60"
                                                    >
                                                        {isSavingSplitConfig
                                                            ? 'Saving...'
                                                            : 'Save Split'}
                                                    </Button>
                                                </div>

                                                {splitMethod === 'custom' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {splitCustomAmounts.map((amount, idx) => (
                                                            <input
                                                                key={`split-custom-${idx}`}
                                                                type="number"
                                                                min={0}
                                                                step={0.01}
                                                                value={amount}
                                                                onChange={e =>
                                                                    setSplitCustomAmounts(prev => {
                                                                        const next = [...prev];
                                                                        next[idx] = e.target.value;
                                                                        return next;
                                                                    })
                                                                }
                                                                placeholder={`Guest ${idx + 1} amount`}
                                                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {splitMethod === 'items' && (
                                                    <div className="space-y-3">
                                                        {splitOrderItems.length === 0 ? (
                                                            <p className="text-xs text-gray-500">
                                                                No order items found for item-based
                                                                split.
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                                                        Assign each item to a guest
                                                                    </p>
                                                                    <span
                                                                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                                                            splitItemUnassignedCount ===
                                                                            0
                                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                                : 'bg-amber-100 text-amber-700'
                                                                        }`}
                                                                    >
                                                                        {splitItemUnassignedCount ===
                                                                        0
                                                                            ? 'All assigned'
                                                                            : `${splitItemUnassignedCount} unassigned`}
                                                                    </span>
                                                                </div>

                                                                <div className="grid gap-2 md:grid-cols-2">
                                                                    {splitOrderItems.map(item => (
                                                                        <div
                                                                            key={item.id}
                                                                            className="rounded-lg border border-gray-200 bg-white p-2"
                                                                        >
                                                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                                        {
                                                                                            item.quantity
                                                                                        }
                                                                                        x{' '}
                                                                                        {item.name}
                                                                                    </p>
                                                                                    <p className="text-[11px] text-gray-500">
                                                                                        {(
                                                                                            item.price *
                                                                                            item.quantity
                                                                                        ).toFixed(
                                                                                            2
                                                                                        )}{' '}
                                                                                        ETB
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {Array.from(
                                                                                    {
                                                                                        length: splitGuestCount,
                                                                                    },
                                                                                    (_, idx) => (
                                                                                        <button
                                                                                            key={`${item.id}-guest-${idx}`}
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                setSplitItemAssignments(
                                                                                                    prev => ({
                                                                                                        ...prev,
                                                                                                        [item.id]:
                                                                                                            idx,
                                                                                                    })
                                                                                                )
                                                                                            }
                                                                                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                                                                                                splitItemAssignments[
                                                                                                    item
                                                                                                        .id
                                                                                                ] ===
                                                                                                idx
                                                                                                    ? 'border-black bg-black text-white'
                                                                                                    : 'border-gray-200 bg-white text-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            Guest{' '}
                                                                                            {idx +
                                                                                                1}
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="rounded-lg border border-gray-200 bg-white p-2">
                                                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                                                        Guest Item Totals
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-700 md:grid-cols-4">
                                                                        {splitItemTotalsByGuest.map(
                                                                            (total, idx) => (
                                                                                <p
                                                                                    key={`split-total-${idx}`}
                                                                                >
                                                                                    Guest {idx + 1}:{' '}
                                                                                    {total.toFixed(
                                                                                        2
                                                                                    )}{' '}
                                                                                    ETB
                                                                                </p>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {isLoadingSplitConfig ? (
                                                <p className="text-sm text-gray-500">
                                                    Loading split settlement...
                                                </p>
                                            ) : (
                                                (splitPayload?.splits ?? []).length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                                                Split Payments
                                                            </p>
                                                            <select
                                                                value={splitPaymentMethod}
                                                                onChange={e =>
                                                                    setSplitPaymentMethod(
                                                                        e.target
                                                                            .value as SplitPaymentMethod
                                                                    )
                                                                }
                                                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                                                            >
                                                                <option value="cash">Cash</option>
                                                                <option value="card">Card</option>
                                                                <option value="chapa">Chapa</option>
                                                                <option value="other">Other</option>
                                                            </select>
                                                        </div>
                                                        {splitPayload!.splits.map(split => {
                                                            const paid =
                                                                splitPaidById.get(split.id) ?? 0;
                                                            const remaining = Math.max(
                                                                0,
                                                                Number(
                                                                    (
                                                                        split.computed_amount - paid
                                                                    ).toFixed(2)
                                                                )
                                                            );
                                                            const draft =
                                                                splitPaymentAmounts[split.id] ??
                                                                remaining.toFixed(2);
                                                            return (
                                                                <div
                                                                    key={split.id}
                                                                    className="rounded-xl border border-gray-100 bg-white p-3"
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <p className="text-sm font-bold text-gray-900">
                                                                            {split.split_label ||
                                                                                `Guest ${split.split_index + 1}`}
                                                                        </p>
                                                                        <p className="text-xs font-semibold text-gray-500">
                                                                            Remaining:{' '}
                                                                            {remaining.toFixed(2)}{' '}
                                                                            ETB
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            step={0.01}
                                                                            value={draft}
                                                                            onChange={e =>
                                                                                setSplitPaymentAmounts(
                                                                                    prev => ({
                                                                                        ...prev,
                                                                                        [split.id]:
                                                                                            e.target
                                                                                                .value,
                                                                                    })
                                                                                )
                                                                            }
                                                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                                                                        />
                                                                        <Button
                                                                            onClick={() =>
                                                                                void captureSplitPayment(
                                                                                    split.id,
                                                                                    remaining
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                capturingSplitId ===
                                                                                    split.id ||
                                                                                remaining <= 0
                                                                            }
                                                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                                        >
                                                                            {capturingSplitId ===
                                                                            split.id
                                                                                ? 'Paying...'
                                                                                : 'Capture'}
                                                                        </Button>
                                                                    </div>
                                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                                        Paid {paid.toFixed(2)} /{' '}
                                                                        {Number(
                                                                            split.computed_amount
                                                                        ).toFixed(2)}{' '}
                                                                        ETB
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )
                                            )}

                                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                                <div className="w-full md:w-48">
                                                    <select
                                                        value={settlementPaymentMethod}
                                                        onChange={e =>
                                                            setSettlementPaymentMethod(
                                                                e.target.value as SplitPaymentMethod
                                                            )
                                                        }
                                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:border-gray-300 focus:outline-none"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="chapa">Chapa</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Choose how the guest settled this bill.
                                                    </p>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={chapaTxRef}
                                                        onChange={e =>
                                                            setChapaTxRef(e.target.value)
                                                        }
                                                        placeholder={
                                                            settlementPaymentMethod === 'cash'
                                                                ? 'Optional: receipt or drawer note'
                                                                : settlementPaymentMethod ===
                                                                    'chapa'
                                                                  ? 'Optional: Chapa tx_ref'
                                                                  : 'Optional: external reference'
                                                        }
                                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {settlementPaymentMethod === 'chapa'
                                                            ? 'Leave blank to auto-settle from already paid Chapa orders.'
                                                            : 'Add a reference only when you need a stronger audit trail.'}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleSettleAndCloseTable}
                                                    disabled={
                                                        isClosingTable || tableRunningTotal <= 0
                                                    }
                                                    className="bg-brand-accent rounded-xl px-5 py-2.5 text-sm font-bold text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isClosingTable
                                                        ? 'Closing...'
                                                        : `Settle ${formatCurrencyCompact(tableRunningTotal)} ETB & Close`}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {tableOrders.map((order, oi) => (
                                    <div
                                        key={order.id}
                                        className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Order #{oi + 1}
                                                </span>
                                                <span className="text-xs text-gray-300">·</span>
                                                <span className="text-xs font-medium text-gray-400">
                                                    {order.created_at
                                                        ? format(
                                                              new Date(order.created_at),
                                                              'HH:mm'
                                                          )
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${
                                                        order.status === 'ready'
                                                            ? 'bg-green-100 text-green-700'
                                                            : order.status === 'preparing'
                                                              ? 'bg-blue-100 text-blue-700'
                                                              : order.status === 'acknowledged'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {order.status === 'acknowledged'
                                                        ? 'In Kitchen'
                                                        : order.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {(Array.isArray(order.items)
                                                ? (order.items as Array<{
                                                      id: string;
                                                      name: string;
                                                      quantity: number;
                                                      price: number;
                                                  }>)
                                                : []
                                            ).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="font-medium text-gray-700">
                                                        <span className="mr-2 font-bold text-black">
                                                            {item.quantity}x
                                                        </span>
                                                        {item.name}
                                                    </span>
                                                    <span className="font-bold text-gray-500">
                                                        {(
                                                            (item.price ?? 0) * item.quantity
                                                        ).toFixed(0)}{' '}
                                                        br
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex justify-end border-t border-gray-50 pt-3">
                                            <span className="text-sm font-black text-gray-900">
                                                {formatCurrencyCompact(order.total_price ?? 0)} br
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // --- APPLY FILTERS BASED ON STAFF ZONES ---
    const assignedZones = Array.isArray(staffContext?.assigned_zones)
        ? staffContext.assigned_zones
        : [];

    const filteredTables =
        assignedZones.length > 0
            ? tables.filter(
                  t => !t.zone || assignedZones.includes(t.zone) || assignedZones.includes('All')
              )
            : tables;

    // Only show service requests for filtered tables
    const visibleTableNumbers = new Set(filteredTables.map(t => t.table_number));
    const filteredServiceRequests = serviceRequests.filter(sr =>
        visibleTableNumbers.has(sr.table_number)
    );

    // --- RENDER: TABLE LIST MODE ---
    const pendingRequestsCount = filteredServiceRequests.filter(
        sr => sr.status === 'pending'
    ).length;

    return (
        <div className="font-manrope flex min-h-screen flex-col bg-gray-50 p-6 text-gray-900">
            {/* Dashboard-style Main Title */}
            <div className="flex items-start justify-between px-2 pt-2 pb-6">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        {staffContext?.name ? `${staffContext.name}'s Tables` : 'Waiter Display'}
                    </h1>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                        <span
                            className={`flex items-center gap-2 rounded-full px-3 py-1 ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            />
                            {connected ? 'System Live' : 'Connecting...'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                            {
                                filteredTables.filter(
                                    t => t.status === 'occupied' || t.status === 'bill_requested'
                                ).length
                            }{' '}
                            Active Tables
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            void fetchTables();
                            void fetchServiceRequests();
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => {
                            // If they have context, taking them back to PIN screen makes sense.
                            // If not, full logout.
                            if (staffContext) {
                                localStorage.removeItem('gebata_waiter_context');
                                router.push(`/waiter/pin?restaurantId=${restaurantId}`);
                            } else {
                                handleLogout();
                            }
                        }}
                        className="bg-brand-accent flex h-12 w-12 items-center justify-center rounded-xl text-black shadow-lg shadow-black/10 transition-colors hover:brightness-105"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="no-scrollbar flex-1 overflow-y-auto pb-24">
                {activeTab === 'tables' && (
                    <>
                        <div className="mb-4 flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-gray-900">Live Status</h2>
                            <div className="flex gap-2 text-xs font-bold">
                                <span className="flex items-center gap-1.5 rounded-md border border-gray-100 bg-white px-2 py-1 text-gray-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Free
                                </span>
                                <span className="flex items-center gap-1.5 rounded-md border border-gray-100 bg-white px-2 py-1 text-gray-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Busy
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {filteredTables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`group relative flex flex-col gap-3 overflow-hidden rounded-[1.25rem] p-5 text-left shadow-sm transition-all hover:shadow-md active:scale-95 ${
                                        table.status === 'bill_requested'
                                            ? 'bg-white ring-1 ring-amber-200'
                                            : table.status === 'occupied'
                                              ? 'bg-white ring-1 ring-red-100'
                                              : 'border border-gray-100 bg-white' // Free
                                    }`}
                                >
                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="mb-0.5 text-xs font-bold tracking-widest text-gray-400 uppercase">
                                                Table
                                            </span>
                                            <span className="text-3xl leading-none font-black text-gray-900">
                                                {table.table_number}
                                            </span>
                                        </div>
                                        {(table.status === 'occupied' ||
                                            table.status === 'bill_requested') && (
                                            <div className="flex items-center gap-2">
                                                {filteredServiceRequests.some(
                                                    sr =>
                                                        sr.table_number === table.table_number &&
                                                        sr.status === 'pending'
                                                ) && (
                                                    <span className="flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-500 text-white shadow-lg">
                                                        <Bell className="h-3 w-3" />
                                                    </span>
                                                )}
                                                <span
                                                    className={`h-2.5 w-2.5 animate-pulse rounded-full ${
                                                        table.status === 'bill_requested'
                                                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                                            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        {table.status === 'bill_requested' ? (
                                            <div className="inline-flex rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                                                Bill Requested
                                            </div>
                                        ) : table.status === 'occupied' ? (
                                            <div className="inline-flex rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                                                Occupied
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 opacity-40">
                                                <Users className="h-4 w-4" />
                                                <span className="text-xs font-bold">
                                                    {table.capacity} Seats
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {!loading && filteredTables.length === 0 && (
                            <div className="py-10 text-center text-gray-400">
                                <p>No tables found.</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'kitchen' && (
                    <div className="flex flex-col space-y-4 px-2">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                            <button
                                onClick={() => void fetchActiveOrders()}
                                className="text-gray-400 transition-colors hover:text-black"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </div>
                        {activeOrders.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                                <ChefHat className="mb-4 h-12 w-12 opacity-50" />
                                <p>No active orders</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {activeOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                    Table
                                                </span>
                                                <span className="text-xl font-black text-gray-900">
                                                    {order.table_number}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="mb-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 capitalize">
                                                    {order.status}
                                                </span>
                                                <span className="text-xs font-medium text-gray-400">
                                                    {order.created_at
                                                        ? format(
                                                              new Date(order.created_at),
                                                              'HH:mm'
                                                          )
                                                        : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {(Array.isArray(order.items)
                                                ? (order.items as Array<{
                                                      id: string;
                                                      name: string;
                                                      quantity: number;
                                                      price: number;
                                                  }>)
                                                : []
                                            ).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="font-medium text-gray-700">
                                                        <span className="mr-2 font-bold text-black">
                                                            {item.quantity}x
                                                        </span>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400 capitalize">
                                                        {'pending'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="flex flex-col space-y-4 px-2">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Service Requests</h2>
                            <button
                                onClick={() => void fetchServiceRequests()}
                                className="text-gray-400 transition-colors hover:text-black"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </div>
                        {filteredServiceRequests.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                                <Bell className="mb-4 h-12 w-12 opacity-50" />
                                <p>No pending requests</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredServiceRequests.map(request => (
                                    <div
                                        key={request.id}
                                        className="rounded-xl border-l-4 border-l-red-500 bg-white p-5 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                    Table
                                                </span>
                                                <span className="text-2xl font-black text-gray-900">
                                                    {request.table_number}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-medium text-gray-400">
                                                    {request.created_at
                                                        ? format(
                                                              new Date(request.created_at),
                                                              'HH:mm'
                                                          )
                                                        : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <span className="text-lg font-bold text-black capitalize">
                                                {request.request_type === 'bill'
                                                    ? '🧾 Requested Bill'
                                                    : `🔔 Call ${request.request_type}`}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleResolveServiceRequest(request.id)
                                                }
                                                className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-900 transition-colors hover:bg-green-100 hover:text-green-700"
                                            >
                                                Mark as Resolved
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {stickyReadyOrders.length > 0 && (
                <div className="fixed right-3 bottom-24 left-3 z-30 rounded-xl border border-emerald-200 bg-emerald-600 p-4 text-white shadow-xl">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-black tracking-wide uppercase">
                            {stickyReadyOrders.length} Ready Order
                            {stickyReadyOrders.length > 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={() =>
                                setDismissedReadyOrderIds(stickyReadyOrders.map(order => order.id))
                            }
                            className="rounded-md bg-white/20 px-2 py-1 text-xs font-bold hover:bg-white/30"
                        >
                            Dismiss all
                        </button>
                    </div>
                    <div className="space-y-2">
                        {stickyReadyOrders.slice(0, 4).map(order => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"
                            >
                                <span className="text-sm font-semibold">
                                    Table {order.table_number || '?'} · Order #{order.order_number}
                                </span>
                                <button
                                    onClick={() =>
                                        setDismissedReadyOrderIds(prev =>
                                            prev.includes(order.id) ? prev : [...prev, order.id]
                                        )
                                    }
                                    className="rounded-md p-1 hover:bg-white/20"
                                    aria-label={`Dismiss ready order ${order.order_number}`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Nav */}
            <nav className="fixed right-0 bottom-0 left-0 z-20 flex h-20 items-center justify-around border-t border-gray-200 bg-white/90 px-2 pb-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-lg">
                <button
                    onClick={() => setActiveTab('tables')}
                    className={`flex w-20 flex-col items-center gap-1 rounded-xl p-2 transition-all ${activeTab === 'tables' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <UtensilsCrossed className="h-6 w-6" />
                    <span className="text-xs font-bold">Tables</span>
                </button>
                <button
                    onClick={() => setActiveTab('kitchen')}
                    className={`flex w-20 flex-col items-center gap-1 rounded-xl p-2 transition-all ${activeTab === 'kitchen' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ChefHat className="h-6 w-6" />
                    <span className="text-xs font-bold">Kitchen</span>
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`relative flex w-20 flex-col items-center gap-1 rounded-xl p-2 transition-all ${activeTab === 'alerts' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="relative">
                        <Bell className="h-6 w-6" />
                        {pendingRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-bold">Alerts</span>
                </button>
            </nav>
        </div>
    );
}

export default function WaiterPosPage() {
    return (
        <Suspense
            fallback={
                <div className="font-manrope flex h-screen flex-col bg-gray-50 p-6">
                    <div className="flex items-start justify-between px-2 pt-2 pb-6">
                        <div>
                            <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                                Waiter Display
                            </h1>
                            <p className="text-sm text-gray-500">Loading POS...</p>
                        </div>
                    </div>
                </div>
            }
        >
            <WaiterPosContent />
        </Suspense>
    );
}
