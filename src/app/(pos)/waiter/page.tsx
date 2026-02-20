'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { 
    Bell, 
    ChefHat, 
    LogOut, 
    UtensilsCrossed, 
    Users, 
    RefreshCw, 
    ChevronLeft,
    Search,
    ShoppingBag
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { CategoryWithItems, MenuItem } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';

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

export default function WaiterPosPage() {
    const searchParams = useSearchParams();
    const queryRestaurantId = searchParams.get('restaurantId');
    const { restaurantId: roleRestaurantId, loading: roleLoading } = useRole(queryRestaurantId);
    const restaurantId = queryRestaurantId || roleRestaurantId;
    const router = useRouter();
    
    // Data State
    const [tables, setTables] = useState<PosTable[]>([]);
    const [menu, setMenu] = useState<CategoryWithItems[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tables' | 'kitchen' | 'alerts'>('tables');
    const [selectedTable, setSelectedTable] = useState<PosTable | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'order'>('list');
    
    // Order State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = useMemo(() => createClient(), []);

    // 1. Fetch Tables
    const fetchTables = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const response = await fetch('/api/tables');
            const payload = await response.json();
            
            if (!response.ok) throw new Error(payload.error || 'Failed to load tables');
            
            const fetchedTables = (payload.data?.tables || []).map((t: any) => ({
                id: t.id,
                table_number: t.table_number,
                status: t.status,
                active_order_id: t.active_order_id,
                capacity: t.capacity,
                zone: t.zone
            }));
            
            setTables(fetchedTables);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update tables');
        }
    }, [restaurantId]);

    // 2. Fetch Menu
    const fetchMenu = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*, items:menu_items(*)')
                .eq('restaurant_id', restaurantId)
                .order('order_index');

            if (error) throw error;
            setMenu(data as CategoryWithItems[]);
        } catch (err) {
            console.error('Error fetching menu:', err);
            toast.error('Failed to load menu');
        }
    }, [restaurantId, supabase]);

    // Initial Load & Realtime
    useEffect(() => {
        if (!roleLoading && restaurantId) {
            setLoading(true);
            Promise.all([fetchTables(), fetchMenu()]).finally(() => setLoading(false));

            const channel = supabase
                .channel(`pos-tables-${restaurantId}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurantId}` },
                    () => void fetchTables()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [roleLoading, restaurantId, supabase, fetchTables, fetchMenu]);

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
        setCart([]); // Reset cart when entering new table
    };

    const handleBackToTables = () => {
        if (cart.length > 0) {
            if (!confirm('Discard current order?')) return;
        }
        setSelectedTable(null);
        setViewMode('list');
        setCart([]);
    };

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, cartId: Math.random().toString(36), quantity: 1 }];
        });
        toast.success(`Added ${item.name}`, { icon: '🛒', position: 'bottom-center' });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Submit Order
    const handleSubmitOrder = async () => {
        if (!selectedTable || cart.length === 0) return;
        
        setIsSubmitting(true);
        try {
            const orderPayload = {
                restaurant_id: restaurantId,
                table_number: selectedTable.table_number, // The API expects number
                status: 'pending',
                payment_status: 'pending',
                total_amount: cartTotal,
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes
                }))
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });
            
            if (!response.ok) throw new Error('Failed to submit order');
            
            toast.success('Order sent to kitchen!', { duration: 3000 });
            handleBackToTables(); // Return to table list
            void fetchTables(); // Refresh status
            
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit order');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived State for Menu
    const filteredCategories = useMemo(() => {
        return menu.map(cat => ({
            ...cat,
            items: cat.items.filter(item => 
                item.is_available && 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.items.length > 0);
    }, [menu, searchQuery]);

    if (roleLoading || loading) {
         return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-manrope p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                        <Skeleton className="h-4 w-32 rounded-lg" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-[2rem]" />
                    ))}
                </div>
            </div>
        );
    }

    // --- RENDER: ORDER MODE ---
    if (viewMode === 'order' && selectedTable) {
        return (
            <div className="h-screen bg-gray-50 text-gray-900 flex flex-col font-manrope">
                {/* Dashboard-style Order Title */}
                <div className="px-6 pt-6 pb-4 flex items-start justify-between bg-gray-50 z-20">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleBackToTables} 
                                className="h-8 w-8 -ml-2 rounded-xl text-gray-400 hover:bg-gray-200 hover:text-black transition-colors"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <h1 className="text-3xl font-bold text-black tracking-tight">Table {selectedTable.table_number}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedTable.status === 'occupied' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {selectedTable.status === 'occupied' ? 'Occupied' : 'Available'}
                            </span>
                            <span className="text-gray-400 text-sm font-medium">New Order</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Total</span>
                         <span className="text-2xl font-black text-black tracking-tight">{cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto gap-2 px-6 pb-4 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
                    >
                        All
                    </button>
                    {menu.map(cat => (
                         <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat.id ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search menu..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-200 placeholder:text-gray-400 shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto px-6 pb-32">
                    {filteredCategories
                        .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
                        .map(category => (
                        <div key={category.id} className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-1">{category.name}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {category.items.map(item => {
                                    const inCart = cart.find(i => i.id === item.id);
                                    return (
                                        <button 
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className={`p-4 rounded-2xl flex flex-col text-left transition-all active:scale-95 relative overflow-hidden group shadow-sm ${
                                                inCart 
                                                ? 'bg-white ring-2 ring-black' 
                                                : 'bg-white border border-gray-100'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start w-full mb-2">
                                                <span className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">{item.name}</span>
                                                {inCart && (
                                                    <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                                        {inCart.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium mt-auto">{item.price} br</span>
                                            
                                            {/* Pressed State */}
                                            <div className="absolute inset-0 bg-black/0 group-active:bg-black/5 transition-colors origin-center" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                     {filteredCategories.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <UtensilsCrossed className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-gray-400">No items found</p>
                        </div>
                    )}
                </div>

                {/* Cart Float */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-30 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-black h-10 w-10 rounded-full flex items-center justify-center shadow-lg shadow-black/20">
                                    <ShoppingBag className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-gray-900">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
                                    <span className="text-xs text-gray-400">Ready to send</span>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">{cartTotal.toFixed(2)}</span>
                        </div>
                        <Button 
                            className="w-full bg-black text-white hover:bg-gray-800 font-bold h-14 text-lg rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-black/10"
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>Sending...</>
                            ) : (
                                `Send Order`
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: TABLE LIST MODE ---
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-manrope p-6">
            {/* Dashboard-style Main Title */}
            <div className="px-2 pt-2 pb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">
                        Waiter Display
                    </h1>
                     <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                             <span className="w-2 h-2 rounded-full bg-emerald-500" />
                             System Live
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{tables.filter(t => t.status === 'occupied').length} Active Tables</span>
                    </div>
                </div>
                <div className="flex gap-3">
                     <button 
                        onClick={() => void fetchTables()} 
                        className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-500 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center text-white hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
                {activeTab === 'tables' && (
                    <>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-lg font-bold text-gray-900">Live Status</h2>
                            <div className="flex gap-2 text-xs font-bold">
                                <span className="px-2 py-1 rounded-md bg-white border border-gray-100 text-gray-600 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Free
                                </span>
                                <span className="px-2 py-1 rounded-md bg-white border border-gray-100 text-gray-600 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"/> Busy
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {tables.map(table => (
                                <button 
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`p-5 rounded-[1.25rem] flex flex-col gap-3 transition-all active:scale-95 text-left relative overflow-hidden group shadow-sm hover:shadow-md ${
                                        table.status === 'occupied' 
                                        ? 'bg-white ring-1 ring-red-100' // Occupied
                                        : 'bg-white border border-gray-100' // Free
                                    }`}
                                >
                                    <div className="flex justify-between items-start z-10 relative">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Table</span>
                                            <span className="text-3xl font-black text-gray-900 leading-none">{table.table_number}</span>
                                        </div>
                                        {table.status === 'occupied' && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse" />
                                        )}
                                    </div>
                                    
                                    <div className="mt-auto z-10 relative">
                                        {table.status === 'occupied' ? (
                                            <div className="inline-flex px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">
                                                Occupied
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 opacity-40">
                                                <Users className="h-4 w-4" />
                                                <span className="text-xs font-bold">{table.capacity} Seats</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        {!loading && tables.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>No tables found.</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'kitchen' && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ChefHat className="h-12 w-12 mb-4 opacity-50" />
                        <p>Kitchen Status View</p>
                        <p className="text-xs mt-1">Coming Soon</p>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-gray-200 flex items-center justify-around px-2 pb-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <button 
                    onClick={() => setActiveTab('tables')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'tables' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <UtensilsCrossed className="h-6 w-6" />
                    <span className="text-xs font-bold">Tables</span>
                </button>
                <button 
                    onClick={() => setActiveTab('kitchen')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'kitchen' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ChefHat className="h-6 w-6" />
                    <span className="text-xs font-bold">Kitchen</span>
                </button>
                <button 
                    onClick={() => setActiveTab('alerts')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl w-20 transition-all ${activeTab === 'alerts' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Bell className="h-6 w-6" />
                    <span className="text-xs font-bold">Alerts</span>
                </button>
            </nav>
        </div>
    );
}
