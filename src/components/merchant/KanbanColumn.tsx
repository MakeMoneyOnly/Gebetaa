'use client';

import { cn } from '@/lib/utils';
import { Order } from '@/types/database';
import { OrderCard } from './OrderCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    statuses: string[];
    accent: string;
    dotColor: string;
    orders: Order[];
    loadingOrderId: string | null;
    updatingOrderId: string | null;
    selectedOrderIds: string[];
    getNextStatus: (status: string | null) => string | null;
    onOpenDetails: (orderId: string) => void;
    onStatusUpdate: (orderId: string, status: string | null) => void;
    onToggleOrder: (orderId: string) => void;
}

export function KanbanColumn({
    id,
    title,
    statuses,
    accent,
    dotColor,
    orders,
    loadingOrderId,
    updatingOrderId,
    selectedOrderIds,
    getNextStatus,
    onOpenDetails,
    onStatusUpdate,
    onToggleOrder,
}: KanbanColumnProps) {
    return (
        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-gray-100">
            {/* Column header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', dotColor)} />
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">
                    {orders.length}
                </span>
            </div>

            {/* Accent bar */}
            <div className={cn('mb-4 h-0.5 w-full rounded-full opacity-60', accent)} />

            <div className="space-y-3">
                {orders.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 p-5 text-center text-xs font-semibold text-gray-400">
                        No orders
                    </div>
                ) : (
                    orders.map(order => {
                        const isServiceRequest = order.id.startsWith('sr_');
                        const nextStatus = getNextStatus(order.status);
                        const isUpdating = updatingOrderId === order.id;
                        const isSelected = !isServiceRequest && selectedOrderIds.includes(order.id);

                        return (
                            <OrderCard
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
}
