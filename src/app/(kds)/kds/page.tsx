'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TicketCard } from '@/features/kds/components/TicketCard';
import { Maximize2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase';
import type { Order } from '@/types/database';

interface Ticket {
    id: string;
    ticketNumber: string;
    tableNumber: string;
    createdAt: Date;
    status: 'new' | 'active' | 'completed';
    rawStatus: string | null;
    items: {
        id: string;
        quantity: number;
        name: string;
        modifiers?: string[];
        notes?: string;
        status: 'pending' | 'cooking' | 'ready';
    }[];
}

type OrderItemPayload = {
    id?: string;
    quantity?: number;
    name?: string;
    modifiers?: string[];
    notes?: string;
};

const ACTIVE_ORDER_STATUSES = ['pending', 'acknowledged', 'preparing'];

function mapOrderToTicket(order: Order): Ticket {
    const parsedItems = Array.isArray(order.items) ? (order.items as OrderItemPayload[]) : [];
    const itemStatus: 'pending' | 'cooking' | 'ready' =
        order.status === 'ready' ? 'ready' : order.status === 'preparing' ? 'cooking' : 'pending';
    const normalizedItems = parsedItems.map((item, index) => ({
        id: item.id ?? `${order.id}-${index}`,
        quantity: item.quantity ?? 1,
        name: item.name ?? 'Unnamed item',
        modifiers: item.modifiers,
        notes: item.notes,
        status: itemStatus,
    }));

    const normalizedStatus: Ticket['status'] =
        order.status === 'pending'
            ? 'new'
            : order.status === 'acknowledged' || order.status === 'preparing'
              ? 'active'
              : 'completed';

    return {
        id: order.id,
        ticketNumber: order.order_number,
        tableNumber: `T-${order.table_number}`,
        createdAt: new Date(order.created_at ?? new Date().toISOString()),
        status: normalizedStatus,
        rawStatus: order.status,
        items: normalizedItems,
    };
}

export default function KDSPage() {
    const { user, restaurantId, loading: roleLoading } = useRole(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const supabase = useMemo(() => createClient(), []);

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
                .in('status', ACTIVE_ORDER_STATUSES)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to fetch KDS orders:', error);
                return;
            }

            const mapped = (data ?? []).map(mapOrderToTicket);
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

            const response = await fetch(`/api/kds/orders/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus }),
            });

            const payload = await response.json();
            if (!response.ok) {
                console.error('Failed to update ticket status:', payload?.error);
                return;
            }

            const updated = mapOrderToTicket(payload.data as Order);
            setTickets(prev => {
                const next = prev.map(item => (item.id === updated.id ? updated : item));
                return next.filter(item => item.status !== 'completed');
            });
        },
        []
    );

    if (loading || roleLoading) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-400">
                Loading kitchen queue...
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="h-[400px]">
                            <TicketCard
                                {...ticket}
                                onStatusChange={status => handleTicketStatusChange(ticket, status)}
                            />
                        </div>
                    ))}
                </div>
                {!restaurantId && (
                    <div className="mt-8 text-center text-sm text-neutral-400">
                        No active restaurant context found for this user.
                    </div>
                )}
                {restaurantId && tickets.length === 0 && (
                    <div className="mt-8 text-center text-sm text-neutral-400">
                        No active kitchen tickets.
                    </div>
                )}
                {!user && (
                    <div className="mt-8 text-center text-sm text-neutral-400">
                        Sign in to access the kitchen display.
                    </div>
                )}
            </div>

            <div className="fixed bottom-4 right-4 flex gap-2">
                <Button
                    variant="ghost"
                    className="bg-neutral-800 text-white hover:bg-neutral-700 h-12 w-12 rounded-full p-0"
                >
                    <Wifi className={`h-5 w-5 ${connected ? 'text-green-500' : 'text-yellow-400'}`} />
                </Button>
                <Button
                    variant="ghost"
                    className="bg-neutral-800 text-white hover:bg-neutral-700 h-12 w-12 rounded-full p-0"
                >
                    <Maximize2 className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
