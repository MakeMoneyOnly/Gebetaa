'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <ArrowUp className="h-3.5 w-3.5 text-gray-700" />
    ) : (
        <ArrowDown className="h-3.5 w-3.5 text-gray-700" />
    );
}

function statusPill(status: string | null) {
    if (status?.startsWith('service_')) return 'bg-blue-50 text-blue-700';
    if (status === 'completed') return 'bg-green-50 text-green-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-700';
    if (status === 'pending') return 'bg-yellow-50 text-yellow-700';
    if (status === 'ready') return 'bg-emerald-50 text-emerald-700';
    if (status === 'preparing' || status === 'acknowledged') return 'bg-orange-50 text-orange-700';
    return 'bg-gray-100 text-gray-700';
}

function ageTone(createdAt: string | null) {
    const ageMinutes = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
        : 0;
    if (ageMinutes >= 30) return 'text-red-600';
    if (ageMinutes >= 15) return 'text-orange-600';
    return 'text-green-600';
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
        orders.filter((order) => !order.id.startsWith('sr_')).length > 0 &&
        orders
            .filter((order) => !order.id.startsWith('sr_'))
            .every((order) => selectedOrderIds.includes(order.id));

    return (
        <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="border-b border-gray-100 bg-gray-50/50">
                        <tr className="text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-5 py-4">
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    onChange={onToggleAllVisible}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                            </th>
                            <th className="px-5 py-4">
                                <button
                                    onClick={() => onSortChange('table_number')}
                                    className="inline-flex items-center gap-1.5 font-bold"
                                >
                                    Table
                                    <SortIcon active={sortKey === 'table_number'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-5 py-4">
                                <button
                                    onClick={() => onSortChange('status')}
                                    className="inline-flex items-center gap-1.5 font-bold"
                                >
                                    Status
                                    <SortIcon active={sortKey === 'status'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-5 py-4">
                                <button
                                    onClick={() => onSortChange('created_at')}
                                    className="inline-flex items-center gap-1.5 font-bold"
                                >
                                    Time
                                    <SortIcon active={sortKey === 'created_at'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-5 py-4">
                                <button
                                    onClick={() => onSortChange('total_price')}
                                    className="inline-flex items-center gap-1.5 font-bold"
                                >
                                    Total
                                    <SortIcon active={sortKey === 'total_price'} direction={sortDirection} />
                                </button>
                            </th>
                            <th className="px-5 py-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const isServiceRequest = order.id.startsWith('sr_');
                            const nextStatus = getNextStatus(order.status);
                            const isUpdating = updatingOrderId === order.id;
                            const isSelected = !isServiceRequest && selectedOrderIds.includes(order.id);
                            return (
                                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                    <td className="px-5 py-4">
                                        {isServiceRequest ? (
                                            <span className="text-xs font-semibold text-blue-700">SR</span>
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onToggleOrder(order.id)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-bold text-gray-900">
                                            {order.table_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn('rounded-full px-3 py-1 text-[11px] font-bold uppercase', statusPill(order.status))}>
                                            {(order.status || 'unknown').replace('service_', '')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            <span className={cn('text-sm font-semibold', ageTone(order.created_at))}>
                                                {order.created_at
                                                    ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                                                <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                                                {order.total_price}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onOpenDetails(order.id)}
                                                className="h-9 rounded-xl bg-black px-3 text-xs font-bold text-white hover:bg-gray-800"
                                            >
                                                {loadingOrderId === order.id ? 'Loading...' : 'Details'}
                                            </button>
                                            <button
                                                disabled={!nextStatus || isUpdating}
                                                onClick={() => onStatusUpdate(order.id, order.status)}
                                                className={cn(
                                                    'h-9 rounded-xl px-3 text-xs font-bold',
                                                    !nextStatus
                                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                )}
                                            >
                                                {isUpdating
                                                    ? 'Updating...'
                                                    : nextStatus
                                                        ? `Mark ${nextStatus.replace('service_', '')}`
                                                        : 'No Action'}
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
