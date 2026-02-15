'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Search, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Order } from '@/types/database';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useRole(null);
    const supabase = createClient();

    useEffect(() => {
        if (user) fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', staff.restaurant_id)
                .order('created_at', { ascending: false });

            if (data) {
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    // Re-fetch to get full sorting/filtering correctly
                    // In a larger app, we would splice the new order into the state array
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-crimson" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
                    <p className="text-text-secondary">View and manage all restaurant orders</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-9 pr-4 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:border-brand-crimson"
                        />
                    </div>
                    <Button variant="secondary">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                </div>
            </div>

            <div className="bg-surface-0 rounded-xl border border-surface-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-50 border-b border-surface-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-text-secondary">Order ID & Time</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Table</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Status</th>
                            <th className="px-6 py-3 font-medium text-text-secondary">Total</th>
                            <th className="px-6 py-3 font-medium text-text-secondary text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-surface-50/50 transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-text-primary">#{order.order_number}</div>
                                    <div className="text-xs text-text-tertiary">
                                        {new Date(order.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-md bg-surface-100 text-text-secondary font-medium text-xs">
                                        Table {order.table_number}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
                                        order.status === 'completed' ? "bg-green-100 text-green-700" :
                                            order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                                order.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-text-primary">
                                    {order.total_price} ETB
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="sm" variant="ghost">
                                        <ChevronRight className="h-4 w-4 text-text-tertiary" />
                                    </Button>
                                    <Button size="sm" variant="glass" className="h-8 w-8 p-0 bg-white/90">
                                        <Loader2 className="h-4 w-4 text-text-primary" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-12 text-center text-text-tertiary">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
