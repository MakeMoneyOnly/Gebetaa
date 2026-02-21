'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { CategoryWithItems, MenuItem, Order } from '@/types/database';
import { format } from 'date-fns';

interface PosTable {
    id: string;
    table_number: string;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
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

export default function WaiterPosPage() {
    const searchParams = useSearchParams();
    const queryRestaurantId = searchParams.get('restaurantId');
    const { restaurantId: roleRestaurantId, loading: roleLoading } = useRole(queryRestaurantId);
    const router = useRouter();

    // Staff Context State
    const [staffContext, setStaffContext] = useState<any>(null);

    // Resolve restaurantId: prefer query param > localStorage device info > role hook
    // (Waiter POS devices have no Supabase auth session — they use a device token)
    const [deviceRestaurantId, setDeviceRestaurantId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('gebata_device_info');
            if (raw) {
                const info = JSON.parse(raw);
                if (info?.restaurant_id) setDeviceRestaurantId(info.restaurant_id);
                if (info) setStaffContext(info);
            }
            // Also load staff login context if present
            const ctx = localStorage.getItem('gebata_waiter_context');
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
    const [connected, setConnected] = useState(false);

    const supabase = useMemo(() => getSupabaseClient(), []);

    // Device token for authenticated API calls (set after pairing, no auth session needed)
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    useEffect(() => {
        const token = localStorage.getItem('gebata_device_token');
        if (token) setDeviceToken(token);
    }, []);

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

            const fetchedTables = (payload.data?.tables || []).map((t: any) => ({
                id: t.id,
                table_number: t.table_number,
                status: t.status,
                active_order_id: t.active_order_id,
                capacity: t.capacity,
                zone: t.zone,
            }));

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
                    if (!response.ok) throw new Error(payload.error || 'Failed to load table orders');
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
                const response = await fetch('/api/device/service-requests', { headers: deviceHeaders() });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Failed to load service requests');
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
    const isDeviceMode = !!deviceRestaurantId;
    const readyToLoad = restaurantId && (isDeviceMode || !roleLoading);

    useEffect(() => {
        if (!readyToLoad) return;

        setLoading(true);
        Promise.all([
            fetchTables(),
            fetchMenu(),
            fetchActiveOrders(),
            fetchServiceRequests(),
        ]).finally(() => setLoading(false));

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
            .subscribe((status, err) => {
                console.log('Waiter Realtime status:', status, err);
                setConnected(status === 'SUBSCRIBED');
            });

        return () => {
            setConnected(false);
            supabase.removeChannel(channel);
        };
    }, [
        readyToLoad,
        restaurantId,
        supabase,
        fetchTables,
        fetchMenu,
        fetchActiveOrders,
        fetchServiceRequests,
    ]);


    const handleLogout = async () => {
        const supabaseBrowser = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        );
        await supabaseBrowser.auth.signOut();
        router.push('/auth/login');
    };

    // Navigation Logic
    const handleTableClick = (table: PosTable) => {
        setSelectedTable(table);
        setViewMode('order');
        setOrderSubTab(table.status === 'occupied' ? 'orders' : 'new'); // Open orders tab for occupied tables
        setCart([]); // Reset cart when entering new table
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

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Running total from all active orders on table + current cart
    const tableRunningTotal = tableOrders.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
    const grandTotal = tableRunningTotal + cartTotal;

    // Submit Order
    const handleSubmitOrder = async () => {
        if (!selectedTable || cart.length === 0 || !restaurantId) return;

        setIsSubmitting(true);
        try {
            const payload = {
                table_number: selectedTable.table_number,
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
                headers: deviceHeaders(),
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit order');
            }

            toast.success('Order sent to kitchen!', { duration: 3000 });
            setCart([]);
            setOrderSubTab('orders'); // Switch to orders view after sending
            void fetchTableOrders(selectedTable.table_number); // Refresh table orders
            void fetchTables(); // Refresh status
            void fetchActiveOrders(); // Update kitchen tab
        } catch (err: any) {
            console.error('Submit order error:', err);
            toast.error(err.message || 'Failed to submit order');
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
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${selectedTable.status === 'occupied' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                            >
                                {selectedTable.status === 'occupied' ? 'Occupied' : 'Available'}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                            Table Total
                        </span>
                        <span className="text-2xl font-black tracking-tight text-black">
                            {grandTotal.toFixed(2)} br
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
                                    className="w-full rounded-2xl border border-gray-100 bg-white py-3.5 pr-4 pl-10 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none"
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
                                                        className={`group relative flex flex-col overflow-hidden rounded-2xl p-4 text-left shadow-sm transition-all active:scale-95 ${
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
                                                                <span className="bg-brand-crimson min-w-[20px] rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                                                                    {inCart.quantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="mt-auto text-xs font-medium text-gray-500">
                                                            {item.price} br
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
                                        {cartTotal.toFixed(2)} br
                                    </span>
                                </div>
                                <Button
                                    className="bg-brand-crimson h-14 w-full rounded-2xl text-lg font-bold text-white shadow-xl shadow-black/10 transition-all hover:bg-[#a0151e] active:scale-[0.98]"
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
                                    className="bg-brand-crimson mt-4 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg"
                                >
                                    + Add Order
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Running total banner */}
                                <div className="bg-brand-crimson flex items-center justify-between rounded-2xl p-4 text-white">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                            Table Running Total
                                        </p>
                                        <p className="text-2xl font-black">
                                            {tableRunningTotal.toFixed(2)} br
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

                                {tableOrders.map((order, oi) => (
                                    <div
                                        key={order.id}
                                        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
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
                                                ? (order.items as any[])
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
                                                {(order.total_price ?? 0).toFixed(2)} br
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
                            {filteredTables.filter(t => t.status === 'occupied').length} Active
                            Tables
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            void fetchTables();
                            void fetchServiceRequests();
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
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
                        className="bg-brand-crimson flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#a0151e]"
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
                                        table.status === 'occupied'
                                            ? 'bg-white ring-1 ring-red-100' // Occupied
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
                                        {table.status === 'occupied' && (
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
                                                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        {table.status === 'occupied' ? (
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
                                        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
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
                                                ? (order.items as any[])
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
                                                        {item.status || 'pending'}
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
                                        className="rounded-2xl border-l-4 border-l-red-500 bg-white p-5 shadow-sm"
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
