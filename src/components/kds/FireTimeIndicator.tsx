/**
 * Fire Time Indicator Component
 * TASK-KDS-001: Fire by Prep Time
 *
 * Shows calculated fire time for order items on KDS
 */

'use client';

import { useState, useEffect } from 'react';

interface FireTimeItem {
    order_item_id: string;
    item_name: string;
    quantity: number;
    prep_time_minutes: number;
    calculated_fire_at: string | null;
    fire_status: 'pending' | 'fired' | 'completed' | 'cancelled';
    minutes_until_fire: number | null;
}

interface FireTimeIndicatorProps {
    orderId: string;
    items: FireTimeItem[];
    onFireItem?: (itemId: string) => void;
}

export function FireTimeIndicator({ orderId, items, onFireItem }: FireTimeIndicatorProps) {
    const [now, setNow] = useState(new Date());

    // Update every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getFireStatus = (item: FireTimeItem) => {
        if (item.fire_status === 'fired') return 'fired';
        if (item.fire_status === 'completed') return 'completed';
        if (item.fire_status === 'cancelled') return 'cancelled';

        if (item.calculated_fire_at) {
            const fireTime = new Date(item.calculated_fire_at);
            if (fireTime <= now) return 'ready';
        }

        return 'pending';
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getMinutesUntil = (isoString: string) => {
        const target = new Date(isoString);
        const diff = (target.getTime() - now.getTime()) / 60000;
        return Math.round(diff);
    };

    const pendingItems = items.filter(i => i.fire_status === 'pending');
    const readyItems = items.filter(i => getFireStatus(i) === 'ready');
    const firedItems = items.filter(i => i.fire_status === 'fired');

    return (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fire Times</h3>
                <span className="text-sm text-gray-500">
                    {pendingItems.length} pending • {readyItems.length} ready • {firedItems.length}{' '}
                    fired
                </span>
            </div>

            {/* Ready to Fire Alert */}
            {readyItems.length > 0 && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                    <div className="mb-2 flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                            />
                        </svg>
                        {readyItems.length} item{readyItems.length > 1 ? 's' : ''} ready to fire!
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {readyItems.map(item => (
                            <button
                                key={item.order_item_id}
                                onClick={() => onFireItem?.(item.order_item_id)}
                                className="rounded bg-orange-500 px-3 py-1 text-sm text-white transition-colors hover:bg-orange-600"
                            >
                                Fire {item.quantity}x {item.item_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
                {items.map(item => {
                    const status = getFireStatus(item);

                    return (
                        <div
                            key={item.order_item_id}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                status === 'ready'
                                    ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10'
                                    : status === 'fired'
                                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10'
                                      : status === 'completed'
                                        ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                                        : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {item.quantity}x {item.item_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        ({item.prep_time_minutes} min prep)
                                    </span>
                                </div>

                                {item.calculated_fire_at && status === 'pending' && (
                                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Fire at {formatTime(item.calculated_fire_at)}
                                        <span className="ml-2 text-xs">
                                            ({getMinutesUntil(item.calculated_fire_at)} min)
                                        </span>
                                    </div>
                                )}

                                {status === 'fired' && (
                                    <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                        🔥 Fired
                                    </div>
                                )}

                                {status === 'completed' && (
                                    <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        ✓ Completed
                                    </div>
                                )}
                            </div>

                            {status === 'ready' && onFireItem && (
                                <button
                                    onClick={() => onFireItem(item.order_item_id)}
                                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                                >
                                    Fire Now
                                </button>
                            )}

                            {status === 'pending' && item.calculated_fire_at && (
                                <div className="text-right">
                                    <div
                                        className={`text-lg font-bold ${
                                            getMinutesUntil(item.calculated_fire_at) <= 2
                                                ? 'text-orange-500'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {getMinutesUntil(item.calculated_fire_at)} min
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-gray-500 dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" />
                    <span>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-orange-300" />
                    <span>Ready to Fire</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-blue-300" />
                    <span>Fired</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-green-300" />
                    <span>Completed</span>
                </div>
            </div>
        </div>
    );
}
