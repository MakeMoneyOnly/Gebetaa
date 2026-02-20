'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { 
    ChefHat, 
    Maximize2, 
    Filter
} from 'lucide-react';
import { TicketCard } from '@/features/kds/components/TicketCard';
import { Order } from '@/types/database';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

// --- Types ---
type OrderItemPayload = {
    id: string;
    quantity: number;
    name: string;
    modifiers?: any[];
    notes?: string;
};

type Ticket = {
    id: string;
    ticketNumber: string;
    tableNumber: string;
    createdAt: Date;
    status: 'new' | 'active' | 'completed';
    rawStatus: string;
    items: {
        id: string;
        quantity: number;
        name: string;
        modifiers?: any[];
        notes?: string;
        status: 'pending' | 'cooking' | 'ready';
    }[];
};

function mapOrderToTicket(order: Order): Ticket {
    const parsedItems = Array.isArray(order.items) ? (order.items as OrderItemPayload[]) : [];
    
    // In a real implementation we would filter for Kitchen items here if needed
    // For now we show all, or assume non-drink items are kitchen
    
    const itemStatus: 'pending' | 'cooking' | 'ready' =
        order.kitchen_status === 'ready' ? 'ready' : order.kitchen_status === 'preparing' ? 'cooking' : 'pending';
        
    const normalizedItems = parsedItems.map((item, index) => ({
        id: item.id ?? `${order.id}-${index}`,
        quantity: item.quantity ?? 1,
        name: item.name ?? 'Unnamed item',
        modifiers: item.modifiers,
        notes: item.notes,
        status: itemStatus,
    }));

    // Use kitchen_status if available, fallback to status
    const effectiveStatus = order.kitchen_status || order.status;

    const normalizedStatus: Ticket['status'] =
        effectiveStatus === 'pending' || !effectiveStatus
            ? 'new'
            : effectiveStatus === 'acknowledged' || effectiveStatus === 'preparing'
              ? 'active'
              : 'completed';

    return {
        id: order.id,
        ticketNumber: order.order_number,
        tableNumber: `T-${order.table_number}`,
        createdAt: new Date(order.created_at ?? new Date().toISOString()),
        status: normalizedStatus,
        rawStatus: effectiveStatus,
        items: normalizedItems,
    };
}

export default function KDSPage() {
    const { restaurantId, loading: roleLoading } = useRole(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const supabase = useMemo(() => createClient(), []);

    // Update clock every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!restaurantId) {
            setTickets([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .in('status', ['pending', 'acknowledged', 'preparing', 'ready']) // Fetch all active
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to fetch KDS orders:', error);
                return;
            }

            const mapped = (data ?? [])
                .map(mapOrderToTicket)
                // Filter out completed kitchen tickets locally
                .filter(t => t.status !== 'completed');
                
            setTickets(mapped);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, supabase]);

    useEffect(() => {
        if (!roleLoading) {
            void fetchOrders();
        }
    }, [fetchOrders, roleLoading]);

    useEffect(() => {
        if (!restaurantId) return;

        const channel = supabase
            .channel(`kds-orders-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                () => {
                    void fetchOrders();
                }
            )
            .subscribe(status => {
                setConnected(status === 'SUBSCRIBED');
            });

        return () => {
            setConnected(false);
            supabase.removeChannel(channel);
        };
    }, [fetchOrders, restaurantId, supabase]);

    const handleTicketStatusChange = useCallback(
        async (ticket: Ticket, nextStatus: 'new' | 'active' | 'completed') => {
            const targetStatus =
                nextStatus === 'active'
                    ? 'acknowledged'
                    : nextStatus === 'completed'
                      ? 'ready'
                      : 'pending';

            // Try to update kitchen_status specifically
            const response = await fetch(`/api/orders/${ticket.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus, type: 'kitchen' }), 
            });

            if (!response.ok) {
                console.error('Failed to update status');
            }

            // Optimistic Update
            setTickets(prev => {
                if (nextStatus === 'completed') {
                    // Remove from view immediately
                    return prev.filter(t => t.id !== ticket.id);
                }
                const updated = prev.map(t => 
                    t.id === ticket.id ? { ...t, status: nextStatus } : t
                );
                return updated;
            });
            
            // Re-fetch to be safe
            void fetchOrders();
        },
        [fetchOrders]
    );

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (loading || roleLoading) {
        return (
            <div className="space-y-8 p-10 h-screen bg-gray-50 overflow-hidden">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-64 rounded-2xl" />
                        <Skeleton className="h-5 w-48 rounded-xl" />
                    </div>
                    <Skeleton className="h-12 w-44 rounded-2xl" />
                </div>
                <div className="grid grid-flow-col auto-cols-[340px] gap-6 overflow-hidden h-full pb-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-full max-h-[600px] w-[340px] rounded-[2.5rem]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden font-manrope selection:bg-black selection:text-white">
            {/* Dashboard-style Title Block */}
            <div className="flex-none px-10 py-8 w-full flex items-start justify-between z-10 bg-gray-50/90 backdrop-blur-sm">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">
                        Kitchen Display
                    </h1>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {connected ? "System Live" : "Connecting..."}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{tickets.length} Active Tickets</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-2xl font-bold text-black tabular-nums leading-none tracking-tight">
                            {format(currentTime, 'HH:mm')}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {format(currentTime, 'EEE, MMM d')}
                        </span>
                    </div>

                    <button className="h-12 w-12 bg-white border border-gray-200 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                        <Filter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="h-12 w-12 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                    >
                        <Maximize2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Grid Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-10 pb-10">
                <div className="grid grid-flow-col auto-cols-[340px] gap-6 h-full pb-4">
                    <AnimatePresence mode="popLayout">
                        {tickets.map(ticket => (
                            <motion.div
                                key={ticket.id}
                                className="h-full max-h-[calc(100vh-180px)]"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                layout
                            >
                                <TicketCard
                                    {...ticket}
                                    onStatusChange={status => handleTicketStatusChange(ticket, status)}
                                    variant="light"
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {tickets.length === 0 && (
                        <div className="col-span-full w-[calc(100vw-80px)] h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-white flex items-center justify-center mb-8 shadow-sm border border-gray-100">
                                <ChefHat className="h-14 w-14 text-gray-300" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-300 tracking-tight">All caught up!</h2>
                            <p className="text-gray-400 font-medium mt-2">
                                No active tickets in standard queue.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
