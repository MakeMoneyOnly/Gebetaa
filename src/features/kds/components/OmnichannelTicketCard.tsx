'use client';

import React from 'react';
import { Clock, MapPin, User, Phone, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedKDSOrder } from '@/app/api/kds/queue/route';

interface OmnichannelTicketCardProps {
    order: UnifiedKDSOrder;
    onAcknowledge?: (orderId: string) => void;
    onComplete?: (orderId: string) => void;
    isAcknowledging?: boolean;
}

const PRIORITY_STYLES = {
    normal: {
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-600',
        pulse: '',
    },
    high: {
        border: 'border-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700',
        pulse: 'animate-pulse',
    },
    urgent: {
        border: 'border-red-500',
        badge: 'bg-red-100 text-red-700',
        pulse: 'animate-pulse',
    },
};

const DRIVER_STATUS_CONFIG = {
    pending: { label: 'Finding driver', color: 'text-yellow-600', icon: Clock },
    assigned: { label: 'Driver assigned', color: 'text-blue-600', icon: Truck },
    arrived: { label: 'Driver arrived', color: 'text-green-600', icon: CheckCircle },
};

export const OmnichannelTicketCard: React.FC<OmnichannelTicketCardProps> = ({
    order,
    onAcknowledge,
    onComplete,
    isAcknowledging = false,
}) => {
    const priorityStyle = PRIORITY_STYLES[order.priority];
    const driverConfig = order.driverInfo ? DRIVER_STATUS_CONFIG[order.driverInfo.status] : null;
    const DriverIcon = driverConfig?.icon ?? Truck;

    const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-md overflow-hidden border-t-4',
                priorityStyle.border,
                order.priority === 'urgent' && 'ring-2 ring-red-200'
            )}
        >
            {/* Header with source color */}
            <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: order.sourceColor }}
            >
                <div className="flex items-center gap-2 text-white">
                    <span className="font-bold text-lg">{order.sourceLabel}</span>
                    {order.priority !== 'normal' && (
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', priorityStyle.badge)}>
                            {order.priority.toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">{formatTime(order.elapsedMinutes)}</span>
                </div>
            </div>

            {/* Order info */}
            <div className="p-4">
                {/* Order number / Table */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {order.source === 'dine-in' ? (
                            <>
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <span className="font-bold text-xl">Table {order.tableNumber ?? order.orderNumber}</span>
                            </>
                        ) : (
                            <span className="font-bold text-lg">#{order.orderNumber}</span>
                        )}
                    </div>
                    <span className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        order.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                        order.status === 'confirmed' && 'bg-blue-100 text-blue-700',
                        order.status === 'preparing' && 'bg-purple-100 text-purple-700',
                        order.status === 'ready' && 'bg-green-100 text-green-700',
                    )}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>

                {/* Customer info for delivery/pickup */}
                {order.customerName && (
                    <div className="flex items-center gap-2 mb-3 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                    </div>
                )}

                {/* Items list */}
                <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                        <div key={item.id ?? index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                {item.quantity}
                            </span>
                            <div className="flex-1">
                                <span className="font-medium">{item.name}</span>
                                {item.notes && (
                                    <p className="text-sm text-gray-500 mt-0.5">{item.notes}</p>
                                )}
                                {item.modifiers && item.modifiers.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {item.modifiers.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Driver status for delivery orders */}
                {order.driverInfo && (
                    <div className={cn(
                        'flex items-center gap-2 p-3 rounded-lg mb-4',
                        order.driverInfo.status === 'arrived' ? 'bg-green-50' : 'bg-gray-50'
                    )}>
                        <DriverIcon className={cn('w-5 h-5', driverConfig?.color)} />
                        <div className="flex-1">
                            <span className={cn('font-medium', driverConfig?.color)}>
                                {driverConfig?.label}
                            </span>
                            {order.driverInfo.name && (
                                <p className="text-sm text-gray-600">{order.driverInfo.name}</p>
                            )}
                            {order.driverInfo.etaMinutes && order.driverInfo.status !== 'arrived' && (
                                <p className="text-xs text-gray-400">ETA: {order.driverInfo.etaMinutes} min</p>
                            )}
                        </div>
                        {order.driverInfo.status === 'arrived' && (
                            <div className="flex items-center gap-1 text-green-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Ready for pickup</span>
                            </div>
                        )}
                    </div>
                )}

                {/* External order ID for partner orders */}
                {order.externalOrderId && ['beu', 'zmall', 'deliver_addis', 'esoora'].includes(order.source) && (
                    <div className="text-xs text-gray-400 mb-4">
                        Partner Order ID: <span className="font-mono">{order.externalOrderId}</span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    {order.status === 'pending' && onAcknowledge && (
                        <button
                            onClick={() => onAcknowledge(order.id)}
                            disabled={isAcknowledging}
                            className={cn(
                                'flex-1 py-2 px-4 rounded-lg font-medium',
                                'bg-blue-600 text-white hover:bg-blue-700',
                                isAcknowledging && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
                        </button>
                    )}
                    {(order.status === 'confirmed' || order.status === 'preparing') && onComplete && (
                        <button
                            onClick={() => onComplete(order.id)}
                            className="flex-1 py-2 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
                        >
                            Mark Ready
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OmnichannelTicketCard;