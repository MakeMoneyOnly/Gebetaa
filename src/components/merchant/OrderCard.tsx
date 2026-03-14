'use client';

import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/utils/monetary';
import { Order } from '@/types/database';

interface OrderCardProps {
    order: Order;
    isServiceRequest: boolean;
    nextStatus: string | null;
    isUpdating: boolean;
    isSelected: boolean;
    loadingOrderId: string | null;
    onOpenDetails: (orderId: string) => void;
    onStatusUpdate: (orderId: string, status: string | null) => void;
    onToggleOrder: (orderId: string) => void;
}

function statusColor(status: string | null) {
    if (status?.startsWith('service_')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60';
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
    if (status === 'ready' || status === 'served')
        return 'bg-green-50 text-green-700 ring-1 ring-green-200/60';
    return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
}

function ageColor(createdAt: string | null) {
    const ageMinutes = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
        : 0;
    if (ageMinutes >= 30) return 'text-red-500';
    if (ageMinutes >= 15) return 'text-orange-500';
    return 'text-emerald-600';
}

function formatNextStatus(status: string | null): string {
    if (!status) return 'Done';
    return status
        .replace('service_', '')
        .replace('_', ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

export function OrderCard({
    order,
    isServiceRequest,
    nextStatus,
    isUpdating,
    isSelected,
    loadingOrderId,
    onOpenDetails,
    onStatusUpdate,
    onToggleOrder,
}: OrderCardProps) {
    const isLoading = loadingOrderId === order.id;

    return (
        <article
            className={cn(
                'rounded-2xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md',
                isSelected ? 'ring-2 ring-gray-800/20 ring-offset-1' : 'ring-1 ring-gray-100'
            )}
        >
            {/* SR badge or checkbox */}
            {isServiceRequest ? (
                <p className="mb-2 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                    Service request
                </p>
            ) : (
                <div className="mb-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleOrder(order.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-gray-800"
                    />
                </div>
            )}

            {/* Table + Status */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        Table
                    </p>
                    <p className="text-xl font-black tracking-tight text-gray-900">
                        {order.table_number || 'N/A'}
                    </p>
                </div>
                <span
                    className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase',
                        statusColor(order.status)
                    )}
                >
                    {(order.status || '').replace('service_', '')}
                </span>
            </div>

            {/* Time + Total/Notes */}
            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className={cn('font-semibold', ageColor(order.created_at))}>
                        {order.created_at
                            ? new Date(order.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : 'N/A'}
                    </span>
                </div>
                {isServiceRequest ? (
                    <div className="text-xs font-semibold text-blue-700">
                        {order.notes || 'No notes'}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        {formatCurrencyCompact(order.total_price)} ETB
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onOpenDetails(order.id)}
                    className="h-9 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
                >
                    {isLoading ? 'Loading…' : 'Details'}
                </button>
                <button
                    disabled={!nextStatus || isUpdating}
                    onClick={() => onStatusUpdate(order.id, order.status)}
                    className={cn(
                        'h-9 rounded-xl text-xs font-bold transition-all duration-200',
                        !nextStatus
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    )}
                >
                    {isUpdating ? 'Updating…' : formatNextStatus(nextStatus)}
                </button>
            </div>
        </article>
    );
}
