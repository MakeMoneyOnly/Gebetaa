'use client';

import { Order } from '@/types/database';
import { OrderKanbanCard } from './OrderKanbanCard';
import { cn } from '@/lib/utils';

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

const COLUMNS: Array<{
    id: string;
    title: string;
    statuses: string[];
    accent: string;
    dotColor: string;
}> = [
    {
        id: 'pending',
        title: 'Pending',
        statuses: ['pending', 'service_pending'],
        accent: 'bg-amber-400',
        dotColor: 'bg-amber-400',
    },
    {
        id: 'in-progress',
        title: 'In Progress',
        statuses: ['acknowledged', 'preparing', 'service_in_progress'],
        accent: 'bg-orange-400',
        dotColor: 'bg-orange-400',
    },
    {
        id: 'ready',
        title: 'Ready',
        statuses: ['ready', 'served'],
        accent: 'bg-emerald-400',
        dotColor: 'bg-emerald-400',
    },
    {
        id: 'done',
        title: 'Done',
        statuses: ['completed', 'cancelled', 'service_completed'],
        accent: 'bg-gray-300',
        dotColor: 'bg-gray-400',
    },
];

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
            {COLUMNS.map(column => {
                const columnOrders = orders.filter(order =>
                    column.statuses.includes(order.status ?? '')
                );
                return (
                    <section key={column.id} className="card-shadow rounded-4xl bg-white p-4">
                        {/* Column header */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full', column.dotColor)} />
                                <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">
                                {columnOrders.length}
                            </span>
                        </div>

                        {/* Accent bar */}
                        <div
                            className={cn(
                                'mb-4 h-0.5 w-full rounded-full opacity-60',
                                column.accent
                            )}
                        />

                        <div className="space-y-3">
                            {columnOrders.length === 0 ? (
                                <div className="rounded-xl bg-gray-50 p-5 text-center text-xs font-semibold text-gray-400">
                                    No orders
                                </div>
                            ) : (
                                columnOrders.map(order => {
                                    const isServiceRequest = order.id.startsWith('sr_');
                                    const nextStatus = getNextStatus(order.status);
                                    const isUpdating = updatingOrderId === order.id;
                                    const isSelected =
                                        !isServiceRequest && selectedOrderIds.includes(order.id);
                                    return (
                                        <OrderKanbanCard
                                            key={order.id}
                                            order={order}
                                            isServiceRequest={isServiceRequest}
                                            nextStatus={nextStatus}
                                            isUpdating={isUpdating}
                                            isSelected={isSelected}
                                            loadingOrderId={loadingOrderId}
                                            onOpenDetails={onOpenDetails}
                                            onStatusUpdate={onStatusUpdate}
                                            onToggleOrder={onToggleOrder}
                                        />
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
