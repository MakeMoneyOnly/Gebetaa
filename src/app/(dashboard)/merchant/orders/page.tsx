'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';
import { Loader2, Search, Filter, ChevronRight, Clock, MapPin, DollarSign, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Order } from '@/types/database';

// Mock Data
const mockOrders: any[] = [
    {
        id: 'mock-1',
        restaurant_id: 'mock-rest-1',
        table_id: 'mock-table-1',
        table_number: 'A4',
        status: 'pending',
        total_amount: 850,
        currency: 'ETB',
        created_at: new Date().toISOString(),
        order_number: 124,
        notes: 'Extra spicy'
    },
    {
        id: 'mock-2',
        restaurant_id: 'mock-rest-1',
        table_id: 'mock-table-2',
        table_number: 'B2',
        status: 'completed',
        total_amount: 1250,
        currency: 'ETB',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        order_number: 123,
        notes: null
    },
    {
        id: 'mock-3',
        restaurant_id: 'mock-rest-1',
        table_id: 'mock-table-3',
        table_number: 'C1',
        status: 'cancelled',
        total_amount: 450,
        currency: 'ETB',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        order_number: 122,
        notes: 'Guest left'
    }
];

// Static filter tabs
const filterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const { user } = useRole(null);
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        // Simulate loading delay for skeleton showcase
        setLoading(true);
        if (!user) {
            setTimeout(() => {
                setOrders(mockOrders as any);
                setLoading(false);
            }, 1500);
            return;
        }

        try {
            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) {
                setOrders(mockOrders as any);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', staff.restaurant_id)
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setOrders(data);
            } else {
                setOrders(mockOrders as any);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders(mockOrders as any);
        } finally {
            setTimeout(() => setLoading(false), 1000);
        }
    }, [supabase, user]);

    useEffect(() => {
        if (user) fetchOrders();
    }, [fetchOrders, user]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    // Re-fetch to get full sorting/filtering correctly
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchOrders, supabase]);

    // Filter logic
    const filteredOrders = orders.filter(order => {
        if (activeFilter === 'all') return true;
        return order.status === activeFilter;
    });

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
                            type="text"
                            placeholder="Search orders..."
                            className="pl-11 pr-4 h-12 w-64 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        />
                    </div>
                    <button className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-[2rem] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                            <Utensils className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-500 font-medium text-lg">Try changing the filter or search term.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        let statusColor = "bg-blue-50 text-blue-600";
                        if (order.status === 'completed') statusColor = "bg-green-50 text-green-600";
                        else if (order.status === 'pending') statusColor = "bg-yellow-50 text-yellow-600";
                        else if (order.status === 'cancelled') statusColor = "bg-red-50 text-red-600";

                        return (
                            <div key={order.id} className="group p-6 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[320px] relative overflow-hidden">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative z-10">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Table</span>
                                        <h4 className="text-4xl font-extrabold text-gray-900 tracking-tighter">
                                            {order.table_number || 'N/A'}
                                        </h4>
                                    </div>
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm",
                                        statusColor
                                    )}>
                                        {order.status}
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
                                            <p className="text-sm font-bold text-gray-900">
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
                                            <p className="text-sm font-bold text-gray-900">{order.total_price} ETB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons - Overlay Style */}
                                <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                                    <button className="h-12 rounded-2xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:scale-[1.02]">
                                        Details
                                    </button>
                                    <button className="h-12 rounded-2xl bg-gray-100 text-gray-900 text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center hover:scale-[1.02]">
                                        Update
                                    </button>
                                </div>

                                {/* Decorative Gradient on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
