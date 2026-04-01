'use client';

import React from 'react';
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

    let statusColorClass = 'bg-state-info-bg text-state-info ring-state-info/20';

    if (order.status === 'completed' || order.status === 'service_completed')
        statusColorClass = 'bg-state-success-bg text-state-success ring-state-success/20';
    else if (order.status === 'pending' || order.status === 'service_pending')
        statusColorClass = 'bg-state-warning-bg text-state-warning ring-state-warning/20';
    else if (order.status === 'cancelled')
        statusColorClass = 'bg-state-danger-bg text-state-danger ring-state-danger/20';
    else if (order.status === 'ready')
        statusColorClass = 'bg-state-success-bg text-state-success ring-state-success/20';
    else if (
        order.status === 'preparing' ||
        order.status === 'acknowledged' ||
        order.status === 'service_in_progress'
    )
        statusColorClass = 'bg-state-warning-bg text-state-warning ring-state-warning/20';

    const ageMinutes = React.useMemo(() => {
        if (!order.created_at) return 0;
        // Using Date.now() to calculate order age - intentional for live display
        return Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
    }, [order.created_at]);

    const ageColorClass =
        ageMinutes >= 30
            ? 'text-brand-ember'
            : ageMinutes >= 15
              ? 'text-state-warning'
              : 'text-brand-neutral';

    return (
        <div
            className={cn(
                'group shadow-soft hover:shadow-medium relative flex min-h-72 flex-col gap-4 overflow-hidden rounded-4xl bg-white p-4 transition-all duration-300',
                isSelected ? 'ring-brand-accent/30 ring-2' : 'ring-brand-neutral-soft/10 ring-1'
            )}
        >
            {/* Top Area: Table Number & Status Overlay */}
            <div className="bg-brand-canvas-alt relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-3xl">
                {/* Decorative background */}
                <div className="from-brand-canvas-alt to-brand-canvas absolute inset-0 bg-linear-to-br" />

                {/* Visual Anchor: Table Number */}
                <span className="text-brand-neutral/20 relative text-6xl font-black tracking-tighter select-none">
                    {order.table_number || '?'}
                </span>

                {/* Status Badge Overlay */}
                {order.status !== 'completed' && order.status !== 'service_completed' && (
                    <div className="absolute top-3 left-3">
                        <span
                            className={cn(
                                'text-micro rounded-lg px-2.5 py-1 font-bold tracking-wide uppercase ring-1 backdrop-blur-md',
                                statusColorClass
                            )}
                        >
                            {(order.status || '').replace('service_', '').replace('_', ' ')}
                        </span>
                    </div>
                )}

                {/* Selection / SR Badge Overlay */}
                <div className="absolute top-3 right-3">
                    {isServiceRequest ? (
                        <span className="bg-brand-surface-dark text-micro rounded-lg px-2.5 py-1 font-bold tracking-wider text-white uppercase shadow-sm">
                            SR
                        </span>
                    ) : (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleOrder(order.id)}
                            className="border-brand-neutral-soft/30 accent-brand-accent h-5 w-5 cursor-pointer rounded-md transition-all"
                        />
                    )}
                </div>
            </div>

            {/* Info Area: Table, Total, Time */}
            <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-micro text-brand-neutral font-bold tracking-widest uppercase">
                            Table
                        </p>
                        <h4 className="text-brand-ink text-xl leading-tight font-bold">
                            {order.table_number || 'N/A'}
                        </h4>
                    </div>
                    <div className="text-right">
                        <p className="text-micro text-brand-neutral font-bold tracking-widest uppercase">
                            {isServiceRequest ? 'Request' : 'Total'}
                        </p>
                        <p className="text-brand-ink font-bold whitespace-nowrap">
                            {isServiceRequest
                                ? order.notes || 'Service'
                                : `${formatCurrencyCompact(order.total_price)} ETB`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            ageMinutes >= 30
                                ? 'bg-brand-ember animate-pulse'
                                : 'bg-brand-neutral/30'
                        )}
                    />
                    <p className={cn('text-xs font-semibold', ageColorClass)}>
                        {order.created_at
                            ? new Date(order.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : 'N/A'}
                        <span className="ml-1 opacity-50">({ageMinutes}m)</span>
                    </p>
                </div>
            </div>

            {/* Action Buttons: Details & Workflow */}
            <div className="mt-auto flex items-center gap-2">
                <button
                    onClick={() => onOpenDetails(order.id)}
                    className="border-brand-neutral-soft/10 text-brand-ink hover:bg-brand-canvas-alt inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border px-4 text-xs font-bold transition-all duration-200 active:scale-95"
                >
                    {isLoading ? 'Loading…' : 'Details'}
                </button>
                <button
                    disabled={!nextStatus || isUpdating}
                    onClick={() => onStatusUpdate(order.id, order.status)}
                    className={cn(
                        'h-10 flex-[1.5] rounded-xl px-4 text-xs font-bold transition-all duration-200 active:scale-95',
                        !nextStatus
                            ? 'bg-brand-canvas-alt text-brand-neutral cursor-not-allowed opacity-50'
                            : 'bg-brand-accent text-brand-ink shadow-sm hover:brightness-105'
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
        </div>
    );
}
