import React from 'react';
import { Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

type TicketItem = {
    id: string;
    quantity: number;
    name: string;
    modifiers?: any[];
    notes?: string;
    status: 'pending' | 'cooking' | 'ready';
    category?: string;
};

type TicketCardProps = {
    id: string;
    ticketNumber: string;
    tableNumber: string;
    createdAt: Date;
    status: 'new' | 'active' | 'completed';
    items: TicketItem[];
    onStatusChange: (status: 'new' | 'active' | 'completed') => void;
    variant?: 'light' | 'dark'; // Added for future flexibility if needed
};

export const TicketCard = ({
    ticketNumber,
    tableNumber,
    createdAt,
    status,
    items,
    onStatusChange,
}: TicketCardProps) => {
    const elapsedMinutes = differenceInMinutes(new Date(), createdAt);

    // Urgency Logic
    let urgencyColor = 'bg-blue-500';
    let urgencyBg = 'bg-blue-50';
    let urgencyText = 'text-blue-600';
    let borderColor = 'border-gray-200';

    if (elapsedMinutes > 15) {
        urgencyColor = 'bg-orange-500';
        urgencyBg = 'bg-orange-50';
        urgencyText = 'text-orange-600';
        borderColor = 'border-orange-200';
    }
    if (elapsedMinutes > 30) {
        urgencyColor = 'bg-red-500';
        urgencyBg = 'bg-red-50';
        urgencyText = 'text-red-600';
        borderColor = 'border-red-200';
    }

    if (status === 'completed') {
        urgencyColor = 'bg-green-500';
        urgencyBg = 'bg-green-50';
        urgencyText = 'text-green-600';
        borderColor = 'border-green-200';
    }

    return (
        <div
            className={cn(
                'flex max-h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md',
                status === 'active'
                    ? `border-l-4 ${borderColor} border-l-${urgencyColor} ring-1 ring-black/5`
                    : 'border-gray-200'
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    'flex flex-col gap-2 border-b p-4',
                    status === 'new' ? 'bg-gray-50/50' : 'bg-white',
                    borderColor
                )}
            >
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                            Table
                        </span>
                        <span className="text-2xl leading-none font-black text-gray-900">
                            {tableNumber.replace('T-', '')}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                            Ticket
                        </span>
                        <span className="text-xl font-bold text-gray-900 tabular-nums">
                            #{ticketNumber.slice(-4)}
                        </span>
                    </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold',
                            urgencyBg,
                            urgencyText
                        )}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{elapsedMinutes}m ago</span>
                    </div>
                    {status === 'new' && (
                        <div className="bg-brand-accent/10 animate-pulse rounded-lg px-2 py-1 text-xs font-bold tracking-wide text-black uppercase">
                            New
                        </div>
                    )}
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-2">
                <div className="space-y-1">
                    {items.map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            className="group flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-xs font-bold text-gray-900">
                                {item.quantity}x
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm leading-tight font-bold text-gray-900 transition-colors group-hover:text-black">
                                    {item.name}
                                </p>
                                {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {item.modifiers.map((mod: any, i: number) => (
                                            <span
                                                key={i}
                                                className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                                            >
                                                {mod.name || mod}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 p-1.5 text-[11px] font-medium text-amber-600">
                                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                        <span>{item.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 bg-white p-3">
                {status === 'new' && (
                    <button
                        onClick={() => onStatusChange('active')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                        <span>Start Preparing</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}

                {status === 'active' && (
                    <button
                        onClick={() => onStatusChange('completed')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-500 bg-white py-3 font-bold text-green-600 transition-all hover:bg-green-50 active:scale-[0.98]"
                    >
                        <CheckCircle className="h-5 w-5" />
                        <span>Mark Ready</span>
                    </button>
                )}
            </div>
        </div>
    );
};
