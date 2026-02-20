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
        <div className={cn(
            "flex flex-col h-full rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden bg-white hover:shadow-md",
            status === 'active' ? `border-l-4 ${borderColor} border-l-${urgencyColor} ring-1 ring-black/5` : "border-gray-200"
        )}>
            {/* Header */}
            <div className={cn(
                "p-4 flex flex-col gap-2 border-b",
                status === 'new' ? 'bg-gray-50/50' : 'bg-white',
                borderColor
            )}>
                <div className="flex justify-between items-start">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Table</span>
                        <span className="text-2xl font-black text-gray-900 leading-none">{tableNumber.replace('T-', '')}</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket</span>
                        <span className="text-xl font-bold text-gray-900 tabular-nums">#{ticketNumber.slice(-4)}</span>
                     </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5", urgencyBg, urgencyText)}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes}m ago</span>
                    </div>
                    {status === 'new' && (
                        <div className="px-2 py-1 bg-brand-crimson/10 text-brand-crimson text-xs font-bold rounded-lg uppercase tracking-wide animate-pulse">
                            New
                        </div>
                    )}
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50/30">
                <div className="space-y-1">
                    {items.map((item, idx) => (
                        <div 
                            key={`${item.id}-${idx}`}
                            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 group"
                        >
                            <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900 border border-gray-200">
                                {item.quantity}x
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-brand-crimson transition-colors">
                                    {item.name}
                                </p>
                                {(item.modifiers && item.modifiers.length > 0) && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {item.modifiers.map((mod: any, i: number) => (
                                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                {mod.name || mod}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="mt-1.5 flex items-start gap-1.5 text-amber-600 text-[11px] font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                        <span>{item.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-white border-t border-gray-100">
                {status === 'new' && (
                     <button
                        onClick={() => onStatusChange('active')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span>Start Preparing</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {status === 'active' && (
                    <button
                        onClick={() => onStatusChange('completed')}
                        className="w-full py-3 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span>Mark Ready</span>
                    </button>
                )}
            </div>
        </div>
    );
};
