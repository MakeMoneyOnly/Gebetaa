'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Martini, Maximize2 } from 'lucide-react';
import { TicketCard } from '@/features/kds/components/TicketCard';
import { Order } from '@/types/database';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton as SkeletonComponent } from '@/components/ui/Skeleton'; // Renamed import to avoid conflict if I imported icon

// --- Types ---
type OrderItemPayload = {
    id: string;
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    modifiers?: any[];
    category_id?: string;
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

// --- Helpers ---
const DRINK_KEYWORDS = [
    'drink',
    'beverage',
    'beer',
    'wine',
    'cocktail',
    'water',
    'soda',
    'juice',
    'coffee',
    'tea',
    'bottle',
];

function isDrinkItem(item: OrderItemPayload): boolean {
    const nameLower = item.name.toLowerCase();
    return DRINK_KEYWORDS.some(keyword => nameLower.includes(keyword));
}

function mapOrderToBarTicket(order: Order): Ticket | null {
    const parsedItems = Array.isArray(order.items) ? (order.items as OrderItemPayload[]) : [];

    // Filter only drinks
    const drinkItems = parsedItems.filter(isDrinkItem);

    if (drinkItems.length === 0) return null;

    const itemStatus: 'pending' | 'cooking' | 'ready' =
        order.bar_status === 'ready'
            ? 'ready'
            : order.bar_status === 'preparing'
              ? 'cooking'
              : 'pending';

    const normalizedItems = drinkItems.map((item, index) => ({
        id: item.id ?? `${order.id}-${index}`,
        quantity: item.quantity ?? 1,
        name: item.name ?? 'Unnamed item',
        modifiers: item.modifiers,
        notes: item.notes,
        status: itemStatus,
    }));

    // Use bar_status if available, fallback to status
    const effectiveStatus = order.bar_status || order.status || 'pending';

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

export default function BarPage() {
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
                .neq('status', 'completed')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to fetch Bar orders:', error);
                return;
            }

            const mapped = (data ?? [])
                .map(mapOrderToBarTicket)
                .filter((t): t is Ticket => t !== null)
                .filter((t: Ticket) => t.status !== 'completed');

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
            .channel(`bar-orders-${restaurantId}`)
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

            const response = await fetch(`/api/orders/${ticket.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus, type: 'bar' }),
            });

            if (!response.ok) {
                console.error('Failed to update status');
                return;
            }

            setTickets(prev => {
                if (nextStatus === 'completed') {
                    return prev.filter(t => t.id !== ticket.id);
                }
                const updated = prev.map(t =>
                    t.id === ticket.id ? { ...t, status: nextStatus } : t
                );
                return updated;
            });
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
            <div className="h-screen space-y-8 overflow-hidden bg-gray-50 p-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <SkeletonComponent className="h-12 w-64 rounded-2xl" />
                        <SkeletonComponent className="h-5 w-48 rounded-xl" />
                    </div>
                    <SkeletonComponent className="h-12 w-44 rounded-2xl" />
                </div>
                <div className="grid h-full auto-cols-[340px] grid-flow-col gap-6 overflow-hidden pb-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonComponent
                            key={i}
                            className="h-full max-h-[600px] w-[340px] rounded-[2.5rem]"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="font-manrope flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Dashboard-style Title Block */}
            <div className="z-10 flex w-full flex-none items-start justify-between bg-gray-50/90 px-10 py-8 backdrop-blur-sm">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Bar Display
                    </h1>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                        <span
                            className={`flex items-center gap-2 rounded-full px-3 py-1 ${connected ? 'bg-blue-50 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${connected ? 'bg-blue-500' : 'bg-amber-500'}`}
                            />
                            {connected ? 'System Live' : 'Connecting...'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{tickets.length} Active Orders</span>
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
                <div className="grid h-full auto-cols-[340px] grid-flow-col gap-6 pb-4">
                    <AnimatePresence mode="popLayout">
                        {tickets.map(ticket => (
                            <motion.div
                                key={ticket.id}
                                className="h-full max-h-[calc(100vh-180px)]"
                                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                layout
                            >
                                <TicketCard
                                    {...ticket}
                                    onStatusChange={(status: 'new' | 'active' | 'completed') =>
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
                                <Martini className="h-14 w-14 text-gray-300" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-300">
                                No Drinks Pending
                            </h2>
                            <p className="mt-2 font-medium text-gray-400">
                                Time to clean some glasses.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
