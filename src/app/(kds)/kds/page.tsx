'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { getSupabaseClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ChefHat, Maximize2, Filter, RefreshCw } from 'lucide-react';
import { TicketCard } from '@/features/kds/components/TicketCard';
import { Order } from '@/types/database';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// --- Types ---
type OrderItemPayload = {
    id: string;
    quantity: number;
    name: string;
    modifiers?: any[];
    notes?: string;
};

type Ticket = {
    id: string; // group id
    orderIds: string[]; // actual db order ids
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
        order.kitchen_status === 'ready'
            ? 'ready'
            : order.kitchen_status === 'preparing'
              ? 'cooking'
              : 'pending';

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
        id: order.id, // Will be overridden in grouping
        orderIds: [order.id],
        ticketNumber: order.order_number,
        tableNumber: `T-${order.table_number}`,
        createdAt: new Date(order.created_at ?? new Date().toISOString()),
        status: normalizedStatus,
        rawStatus: effectiveStatus || 'pending',
        items: normalizedItems,
    };
}

function KDSContent() {
    const searchParams = useSearchParams();
    const queryRestaurantId = searchParams.get('restaurantId');
    const { restaurantId: roleRestaurantId, loading: roleLoading } = useRole(queryRestaurantId);
    const restaurantId = queryRestaurantId || roleRestaurantId;

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const supabase = useMemo(() => getSupabaseClient(), []);

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
                toast.error('Failed to load orders');
                return;
            }

            const mapped = (data ?? [])
                .map(mapOrderToTicket)
                // Filter out completed kitchen tickets locally
                .filter(t => t.status !== 'completed');

            // Group by Table
            const groupedTickets = new Map<string, Ticket>();
            for (const t of mapped) {
                const existing = groupedTickets.get(t.tableNumber);
                if (existing) {
                    existing.orderIds.push(...t.orderIds);
                    // Append ticket numbers if not already there to show multiple
                    const tNum = t.ticketNumber.replace('#', '');
                    if (!existing.ticketNumber.includes(tNum)) {
                        existing.ticketNumber += `, #${tNum}`;
                    }
                    // Combine items (re-generating IDs to avoid duplicate keys)
                    const appendItems = t.items.map(item => ({
                        ...item,
                        id: `${t.id}-${item.id}`,
                    }));
                    existing.items.push(...appendItems);

                    // Keep the oldest createdAt to reflect wait time
                    if (t.createdAt < existing.createdAt) {
                        existing.createdAt = t.createdAt;
                    }

                    // Determine highest priority status (active > new)
                    // If one part is active and another is new, the whole group is active
                    if (t.status === 'active') {
                        existing.status = 'active';
                        existing.rawStatus = t.rawStatus;
                    }
                } else {
                    groupedTickets.set(t.tableNumber, {
                        ...t,
                        id: `group-${t.tableNumber}`,
                    });
                }
            }

            setTickets(
                Array.from(groupedTickets.values()).sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                )
            );
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
        if (roleLoading || !restaurantId) return;

        console.log('KDS: Initializing Realtime for restaurant:', restaurantId);
        const channelName = `kds-orders-${restaurantId}-${Math.random().toString(36).substring(7)}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                payload => {
                    console.log('KDS: Received order change:', payload);
                    void fetchOrders();
                }
            )
            .subscribe((status, err) => {
                console.log('KDS: Realtime status change:', status, err);
                if (err) {
                    console.error('KDS Realtime Error:', err);
                    toast.error(`Realtime Error: ${err.message}`, { id: 'realtime-error' });
                }
                if (status === 'SUBSCRIBED') {
                    setConnected(true);
                } else {
                    setConnected(false);
                }
            });

        return () => {
            console.log('KDS: Cleaning up Realtime channel');
            setConnected(false);
            supabase.removeChannel(channel);
        };
    }, [fetchOrders, restaurantId, supabase, roleLoading]);

    const handleTicketStatusChange = useCallback(
        async (ticket: Ticket, nextStatus: 'new' | 'active' | 'completed') => {
            const targetStatus =
                nextStatus === 'active'
                    ? 'acknowledged'
                    : nextStatus === 'completed'
                      ? 'ready'
                      : 'pending';

            // Optimistic Update First Let's go!
            setTickets(prev => {
                if (nextStatus === 'completed') {
                    // Remove from view immediately
                    return prev.filter(t => t.id !== ticket.id);
                }
                return prev.map(t => (t.id === ticket.id ? { ...t, status: nextStatus } : t));
            });

            // Try to update kitchen_status specifically
            try {
                // Since this could be a grouped ticket, update all associated orders
                const promises = ticket.orderIds.map(orderId =>
                    fetch(`/api/orders/${orderId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: targetStatus, type: 'kitchen' }),
                    })
                );

                const responses = await Promise.all(promises);
                const failedResponse = responses.find(r => !r.ok);

                if (failedResponse) {
                    const errorPayload = await failedResponse.json().catch(() => ({}));
                    console.error('Failed to update status', errorPayload);
                    toast.error(errorPayload?.error || 'Failed to update ticket status');
                    // Revert optimism by re-fetching
                    void fetchOrders();
                } else {
                    // Update rawStatus natively after successful hit
                    setTickets(prev =>
                        prev.map(t => (t.id === ticket.id ? { ...t, rawStatus: targetStatus } : t))
                    );
                }
            } catch (err) {
                console.error('Network error during status update:', err);
                toast.error('Network error. Ticket status might not be saved.');
                void fetchOrders();
            }
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
            <div className="font-manrope flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
                <div className="z-10 flex w-full flex-none items-start justify-between bg-gray-50/90 px-10 py-8 backdrop-blur-sm">
                    <div>
                        <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                            Kitchen Display
                        </h1>
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                            <span className="flex animate-pulse items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-transparent">
                                Connecting...
                            </span>
                            <span className="animate-pulse rounded bg-gray-200 text-transparent">
                                |
                            </span>
                            <span className="animate-pulse rounded bg-gray-200 text-transparent">
                                0 Active Tickets
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="font-manrope selection:bg-brand-crimson flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 selection:text-white">
            {/* Dashboard-style Title Block */}
            <div className="z-10 flex w-full flex-none items-start justify-between bg-gray-50/90 px-10 py-8 backdrop-blur-sm">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Kitchen Display
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
                        <span>{tickets.length} Active Tickets</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="mr-2 flex flex-col items-end">
                        <span className="text-2xl leading-none font-bold tracking-tight text-black tabular-nums">
                            {format(currentTime, 'HH:mm')}
                        </span>
                        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                            {format(currentTime, 'EEE, MMM d')}
                        </span>
                    </div>

                    <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50">
                        <Filter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => void fetchOrders()}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                        title="Refresh Orders"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="bg-brand-crimson flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-xl shadow-black/10 transition-all hover:bg-[#a0151e]"
                    >
                        <Maximize2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Grid Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-10 pb-10">
                <div className="flex h-full w-max items-start gap-6 pb-4">
                    <AnimatePresence mode="popLayout">
                        {tickets.map(ticket => (
                            <motion.div
                                key={ticket.id}
                                className="max-h-[calc(100vh-180px)] w-[340px] shrink-0"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                layout
                            >
                                <TicketCard
                                    {...ticket}
                                    onStatusChange={status =>
                                        handleTicketStatusChange(ticket, status)
                                    }
                                    variant="light"
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {tickets.length === 0 && (
                        <div className="col-span-full flex h-full w-[calc(100vw-80px)] flex-col items-center justify-center text-center opacity-40">
                            <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
                                <ChefHat className="h-14 w-14 text-gray-300" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-300">
                                All caught up!
                            </h2>
                            <p className="mt-2 font-medium text-gray-400">
                                No active tickets in standard queue.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function KDSPage() {
    return (
        <Suspense fallback={
            <div className="font-manrope flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
                <div className="z-10 flex w-full flex-none items-start justify-between bg-gray-50/90 px-10 py-8 backdrop-blur-sm">
                    <div>
                        <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                            Kitchen Display
                        </h1>
                        <p className="text-sm text-gray-500">Loading KDS...</p>
                    </div>
                </div>
            </div>
        }>
            <KDSContent />
        </Suspense>
    );
}
