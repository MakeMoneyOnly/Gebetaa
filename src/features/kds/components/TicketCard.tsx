import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MonitorCheck, AlertCircle, Clock } from 'lucide-react';

interface TicketItem {
    id: string;
    quantity: number;
    name: string;
    modifiers?: string[];
    notes?: string;
    status: 'pending' | 'cooking' | 'ready';
}

interface TicketProps {
    id: string;
    ticketNumber: number;
    tableNumber: string; // e.g., "T-12"
    createdAt: Date;
    items: TicketItem[];
    status: 'new' | 'active' | 'completed';
    onStatusChange: (status: 'new' | 'active' | 'completed') => void;
}

export const TicketCard: React.FC<TicketProps> = ({
    id,
    ticketNumber,
    tableNumber,
    createdAt,
    items,
    status,
    onStatusChange,
}) => {
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [isSirenActive, setIsSirenActive] = useState(false);

    // Calculate urgency level
    const urgency = useMemo<'normal' | 'warning' | 'critical'>(() => {
        if (elapsedMinutes >= 15) return 'critical';
        if (elapsedMinutes >= 10) return 'warning';
        return 'normal';
    }, [elapsedMinutes]);

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
            setElapsedMinutes(diff);
        }, 10000); // Check every 10s

        // Initial check
        const now = new Date();
        setElapsedMinutes(Math.floor((now.getTime() - createdAt.getTime()) / 60000));

        return () => clearInterval(interval);
    }, [createdAt]);

    // "Siren" Effect Logic (Visual Flashing)
    useEffect(() => {
        if (status === 'new') {
            setIsSirenActive(true);
            // In a real app, play audio here: new Audio('/siren.mp3').play();
            const timer = setTimeout(() => setIsSirenActive(false), 5000); // Stop flashing after 5s or until ack
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <Card
            className={cn(
                'flex h-full flex-col border-2 transition-all duration-300',
                // Urgency Styles - Dark Mode Optimized
                urgency === 'normal' && 'bg-neutral-900 border-neutral-700',
                urgency === 'warning' && 'bg-yellow-950/30 border-yellow-600',
                urgency === 'critical' && 'bg-red-950/40 border-red-600 animate-pulse-slow',
                // New Order "Siren" Flash
                status === 'new' && isSirenActive && 'animate-flash-crimson ring-4 ring-brand-crimson/50'
            )}
            padding="none"
        >
            {/* Header */}
            <div
                className={cn(
                    'flex items-center justify-between px-4 py-3 border-b',
                    urgency === 'normal' && 'bg-neutral-800 border-neutral-700',
                    urgency === 'warning' && 'bg-yellow-900/50 border-yellow-600 text-yellow-100',
                    urgency === 'critical' && 'bg-red-900/50 border-red-600 text-red-100'
                )}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-white">#{ticketNumber}</span>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-sm font-bold text-white backdrop-blur-sm">
                        {tableNumber}
                    </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    <span>{elapsedMinutes}m</span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item, idx) => (
                    <div key={`${id}-${item.id}-${idx}`} className="group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-lg font-bold",
                                    item.quantity > 1 ? "text-brand-yellow" : "text-white"
                                )}>
                                    {item.quantity}x
                                </span>
                                <span className="text-lg font-bold text-neutral-100">{item.name}</span>
                            </div>
                        </div>

                        {/* Modifiers */}
                        {(item.modifiers?.length || item.notes) && (
                            <div className="mt-1 ml-7 space-y-1">
                                {item.modifiers?.map((mod, i) => (
                                    <div key={i} className="text-sm text-neutral-400 font-medium">
                                        + {mod}
                                    </div>
                                ))}
                                {item.notes && (
                                    <div className="mt-1 flex items-start gap-1 text-sm font-bold text-brand-yellow bg-brand-yellow/10 p-1.5 rounded border border-brand-yellow/20">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span className="uppercase tracking-wide">Note: {item.notes}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Separator if not last */}
                        {idx < items.length - 1 && (
                            <div className="my-3 border-t border-dashed border-neutral-700 w-full" />
                        )}
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="bg-neutral-800 p-3 border-t border-neutral-700">
                {status === 'active' || status === 'new' ? (
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 text-lg font-bold tracking-wider bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
                        onClick={() => onStatusChange('completed')}
                    >
                        READY
                    </Button>
                ) : (
                    <div className="flex items-center justify-center h-14 text-green-500 font-bold gap-2">
                        <MonitorCheck className="h-6 w-6" />
                        <span>COMPLETED</span>
                    </div>
                )}
            </div>
        </Card>
    );
};
