'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatETBCurrency } from '@/lib/format/et';
import { Order } from '@/types/database';

type SortKey = 'created_at' | 'table_number' | 'status' | 'total_price';
type SortDirection = 'asc' | 'desc';

interface OrdersQueueTableProps {
    orders: Order[];
    sortKey: SortKey;
    sortDirection: SortDirection;
    onSortChange: (key: SortKey) => void;
    onOpenDetails: (orderId: string) => void;
    onStatusUpdate: (orderId: string, status: string | null) => void;
    getNextStatus: (status: string | null) => string | null;
    loadingOrderId: string | null;
    updatingOrderId: string | null;
    selectedOrderIds: string[];
    onToggleOrder: (orderId: string) => void;
    onToggleAllVisible: () => void;
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
    if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    return direction === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-gray-600" />
    ) : (
        <ArrowDown className="h-3.5 w-3.5 text-gray-600" />
    );
}

function statusPill(status: string | null) {
    if (status?.startsWith('service_')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60';
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 ring-1 ring-red-200/60';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
    if (status === 'ready') return 'bg-green-50 text-green-700 ring-1 ring-green-200/60';
    if (status === 'preparing' || status === 'acknowledged')
        return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60';
    return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60';
}

function ageTone(createdAt: string | null) {
    const ageMinutes = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
        : 0;
    if (ageMinutes >= 30) return 'text-red-500';
    if (ageMinutes >= 15) return 'text-orange-500';
    return 'text-emerald-600';
}

export function OrdersQueueTable({
    orders,
    sortKey,
    sortDirection,
    onSortChange,
    onOpenDetails,
    onStatusUpdate,
    getNextStatus,
    loadingOrderId,
    updatingOrderId,
    selectedOrderIds,
    onToggleOrder,
    onToggleAllVisible,
}: OrdersQueueTableProps) {
    const allVisibleSelected =
        orders.filter(order => !order.id.startsWith('sr_')).length > 0 &&
        orders
            .filter(order => !order.id.startsWith('sr_'))
            .every(order => selectedOrderIds.includes(order.id));

    return (
        <div className="card-shadow overflow-hidden rounded-4xl bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="border-b border-gray-100 bg-gray-50/60">
                        <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            <th className="px-5 py-4">
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    onChange={onToggleAllVisible}
                                    className="h-4 w-4 rounded border-gray-300 accent-gray-800"
                                />
                            </th>
                            <th className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5">
                                    Table
                                    <button
                                        onClick={() => onSortChange('table_number')}
                                        className="opacity-60 transition-opacity hover:opacity-100"
                                    >
                                        <SortIcon
                                            active={sortKey === 'table_number'}
                                            direction={sortDirection}
                                        />
                                    </button>
                                </span>
                            </th>
                            <th className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5">
                                    Status
                                    <button
                                        onClick={() => onSortChange('status')}
                                        className="opacity-60 transition-opacity hover:opacity-100"
                                    >
                                        <SortIcon
                                            active={sortKey === 'status'}
                                            direction={sortDirection}
                                        />
                                    </button>
                                </span>
                            </th>
                            <th className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5">
                                    Time
                                    <button
                                        onClick={() => onSortChange('created_at')}
                                        className="opacity-60 transition-opacity hover:opacity-100"
                                    >
                                        <SortIcon
                                            active={sortKey === 'created_at'}
                                            direction={sortDirection}
                                        />
                                    </button>
                                </span>
                            </th>
                            <th className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5">
                                    Total
                                    <button
                                        onClick={() => onSortChange('total_price')}
                                        className="opacity-60 transition-opacity hover:opacity-100"
                                    >
                                        <SortIcon
                                            active={sortKey === 'total_price'}
                                            direction={sortDirection}
                                        />
                                    </button>
                                </span>
                            </th>
                            <th className="px-5 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            const isServiceRequest = order.id.startsWith('sr_');
                            const nextStatus = getNextStatus(order.status);
                            const isUpdating = updatingOrderId === order.id;
                            const isSelected =
                                !isServiceRequest && selectedOrderIds.includes(order.id);
                            return (
                                <tr
                                    key={order.id}
                                    className={cn(
                                        'border-b border-gray-50 transition-colors duration-150 last:border-0',
                                        isSelected ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'
                                    )}
                                >
                                    <td className="px-5 py-4">
                                        {isServiceRequest ? (
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase ring-1 ring-blue-200/60">
                                                SR
                                            </span>
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onToggleOrder(order.id)}
                                                className="h-4 w-4 rounded border-gray-300 accent-gray-800"
                                            />
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-bold text-gray-900">
                                            {order.table_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={cn(
                                                'rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase',
                                                statusPill(order.status)
                                            )}
                                        >
                                            {(order.status || 'unknown').replace('service_', '')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            <span
                                                className={cn(
                                                    'text-sm font-semibold',
                                                    ageTone(order.created_at)
                                                )}
                                            >
                                                {order.created_at
                                                    ? new Date(order.created_at).toLocaleTimeString(
                                                          [],
                                                          { hour: '2-digit', minute: '2-digit' }
                                                      )
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {isServiceRequest ? (
                                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                                                {order.notes || 'Service request'}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
                                                <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                                {formatETBCurrency(order.total_price)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onOpenDetails(order.id)}
                                                className="h-9 rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-800 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
                                            >
                                                {loadingOrderId === order.id
                                                    ? 'Loading…'
                                                    : 'Details'}
                                            </button>
                                            <button
                                                disabled={!nextStatus || isUpdating}
                                                onClick={() =>
                                                    onStatusUpdate(order.id, order.status)
                                                }
                                                className={cn(
                                                    'h-9 rounded-xl px-3 text-xs font-bold transition-all duration-200',
                                                    !nextStatus
                                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                                )}
                                            >
                                                {isUpdating
                                                    ? 'Updating…'
                                                    : nextStatus
                                                      ? nextStatus
                                                            .replace('service_', '')
                                                            .replace('_', ' ')
                                                            .replace(/\b\w/g, c => c.toUpperCase())
                                                      : 'Done'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
