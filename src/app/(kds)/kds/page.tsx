'use client';

import React, { useState } from 'react';
import { TicketCard } from '@/features/kds/components/TicketCard';
import { Maximize2, Settings, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Ticket {
    id: string;
    ticketNumber: number;
    tableNumber: string;
    createdAt: Date;
    status: 'new' | 'active' | 'completed';
    items: {
        id: string;
        quantity: number;
        name: string;
        modifiers?: string[];
        status: 'pending' | 'cooking' | 'ready';
    }[];
}

// MOCK DATA GENERATOR
const generateMockTickets = (): Ticket[] => [
    {
        id: 't1',
        ticketNumber: 11,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
        status: 'new',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
    {
        id: 't2',
        ticketNumber: 12,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 8), // 8 mins ago
        status: 'active',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
    {
        id: 't3',
        ticketNumber: 13,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago (WARNING)
        status: 'active',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
    {
        id: 't4',
        ticketNumber: 14,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 16), // 16 mins ago (CRITICAL)
        status: 'active',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
    {
        id: 't5',
        ticketNumber: 15,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
        status: 'new',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
    {
        id: 't6',
        ticketNumber: 16,
        tableNumber: 'T-04',
        createdAt: new Date(Date.now() - 1000 * 60 * 1), // 1 mins ago
        status: 'new',
        items: [
            { id: 'i1', quantity: 2, name: 'Burger', modifiers: ['No onions'], status: 'pending' },
            { id: 'i2', quantity: 1, name: 'Fries', status: 'pending' },
        ],
    },
];

export default function KDSPage() {
    // In a real app, this would be a real-time subscription
    const [tickets, setTickets] = useState(generateMockTickets());

    const handleTicketStatusChange = (id: string, newStatus: 'new' | 'active' | 'completed') => {
        setTickets(prev =>
            prev.map(t => t.id === id ? { ...t, status: newStatus } : t)
                .filter(t => newStatus !== 'completed') // Hide completed for demo
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar - Sticky Top */}
            {/* Note: The Header is in layout, but we can add secondary controls here if needed */}

            {/* Ticket Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                {/* 
                    Horizontal scrolling container for tickets is a common KDS pattern 
                    to avoid vertical scrolling issues on touch screens, or a wrap grid.
                    Let's stick to a responsive Grid.
                 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="h-[400px]">
                            <TicketCard
                                {...ticket}
                                onStatusChange={(status) => handleTicketStatusChange(ticket.id, status)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Status Bar (optional, for connection status) */}
            <div className="fixed bottom-4 right-4 flex gap-2">
                <Button variant="ghost" className="bg-neutral-800 text-white hover:bg-neutral-700 h-12 w-12 rounded-full p-0">
                    <Wifi className="h-5 w-5 text-green-500" />
                </Button>
                <Button variant="ghost" className="bg-neutral-800 text-white hover:bg-neutral-700 h-12 w-12 rounded-full p-0">
                    <Maximize2 className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
