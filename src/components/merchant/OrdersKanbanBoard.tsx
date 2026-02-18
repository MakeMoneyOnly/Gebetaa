'use client';

import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '@/types/database';

interface OrdersKanbanBoardProps {
    orders: Order[];
    onOpenDetails: (orderId: string) => void;
    onStatusUpdate: (orderId: string, status: string | null) => void;
    getNextStatus: (status: string | null) => string | null;
    loadingOrderId: string | null;
    updatingOrderId: string | null;
    selectedOrderIds: string[];
    onToggleOrder: (orderId: string) => void;
}

const COLUMNS: Array<{ id: string; title: string; statuses: string[] }> = [
    { id: 'pending', title: 'Pending', statuses: ['pending', 'service_pending'] },
    { id: 'in-progress', title: 'In Progress', statuses: ['acknowledged', 'preparing', 'service_in_progress'] },
    { id: 'ready', title: 'Ready', statuses: ['ready', 'served'] },
    { id: 'done', title: 'Done', statuses: ['completed', 'cancelled', 'service_completed'] },
];

function statusColor(status: string | null) {
    if (status?.startsWith('service_')) return 'bg-blue-50 text-blue-700';
    if (status === 'completed') return 'bg-green-50 text-green-600';
    if (status === 'pending') return 'bg-yellow-50 text-yellow-600';
    if (status === 'cancelled') return 'bg-red-50 text-red-600';
    if (status === 'ready' || status === 'served') return 'bg-emerald-50 text-emerald-700';
    return 'bg-orange-50 text-orange-600';
}

function ageColor(createdAt: string | null) {
    const ageMinutes = createdAt
        ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
        : 0;
    if (ageMinutes >= 30) return 'text-red-600';
    if (ageMinutes >= 15) return 'text-orange-600';
    return 'text-green-600';
}

export function OrdersKanbanBoard({
    orders,
    onOpenDetails,
    onStatusUpdate,
    getNextStatus,
    loadingOrderId,
    updatingOrderId,
    selectedOrderIds,
    onToggleOrder,
}: OrdersKanbanBoardProps) {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {COLUMNS.map((column) => {
                const columnOrders = orders.filter((order) => column.statuses.includes(order.status ?? ''));
                return (
                    <section key={column.id} className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
                                {columnOrders.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {columnOrders.length === 0 ? (
                                <div className="rounded-xl bg-gray-50 p-4 text-center text-xs font-semibold text-gray-400">
                                    No orders
                                </div>
                            ) : (
                                columnOrders.map((order) => {
                                    const isServiceRequest = order.id.startsWith('sr_');
                                    const nextStatus = getNextStatus(order.status);
                                    const isUpdating = updatingOrderId === order.id;
                                    const isSelected = !isServiceRequest && selectedOrderIds.includes(order.id);
                                    return (
                                        <article key={order.id} className={cn(
                                            "rounded-2xl border bg-white p-4 shadow-sm",
                                            isSelected ? "border-black/30 ring-2 ring-black/10" : "border-gray-100"
                                        )}>
                                            {isServiceRequest ? (
                                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                                    Service request
                                                </p>
                                            ) : (
                                                <div className="mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => onToggleOrder(order.id)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                </div>
                                            )}
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                        Table
                                                    </p>
                                                    <p className="text-xl font-black tracking-tight text-gray-900">
                                                        {order.table_number || 'N/A'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                                                        statusColor(order.status)
                                                    )}
                                                >
                                                    {(order.status || '').replace('service_', '')}
                                                </span>
                                            </div>

                                            <div className="mb-3 space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className={cn('font-semibold', ageColor(order.created_at))}>
                                                        {order.created_at
                                                            ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                                {isServiceRequest ? (
                                                    <div className="text-xs font-semibold text-blue-700">
                                                        {order.notes || 'No notes'}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                                        {order.total_price} ETB
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => onOpenDetails(order.id)}
                                                    className="h-9 rounded-xl bg-black text-xs font-bold text-white hover:bg-gray-800"
                                                >
                                                    {loadingOrderId === order.id ? 'Loading...' : 'Details'}
                                                </button>
                                                <button
                                                    disabled={!nextStatus || isUpdating}
                                                    onClick={() => onStatusUpdate(order.id, order.status)}
                                                    className={cn(
                                                        'h-9 rounded-xl text-xs font-bold',
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
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
