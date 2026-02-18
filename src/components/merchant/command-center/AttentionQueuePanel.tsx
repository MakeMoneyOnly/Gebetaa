'use client';

import { AlertTriangle, Clock3, Siren, UtensilsCrossed } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { AttentionItem } from './types';

interface AttentionQueuePanelProps {
    items: AttentionItem[];
    loading?: boolean;
    error?: string | null;
    onRetry: () => void;
    onAdvanceOrder: (item: AttentionItem) => void;
    onOpenOrders: () => void;
    onOpenTables: () => void;
    onOpenSettings: () => void;
}

function toAge(createdAt: string | null) {
    if (!createdAt) return 'Unknown age';
    const ms = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.max(0, Math.floor(ms / 60000));
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function badgeClass(item: AttentionItem) {
    if (item.type === 'alert') {
        if (item.severity === 'critical') return 'bg-rose-100 text-rose-700';
        if (item.severity === 'high') return 'bg-orange-100 text-orange-700';
        return 'bg-amber-100 text-amber-700';
    }
    if (item.type === 'service_request') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
}

export function AttentionQueuePanel({
    items,
    loading = false,
    error = null,
    onRetry,
    onAdvanceOrder,
    onOpenOrders,
    onOpenTables,
    onOpenSettings,
}: AttentionQueuePanelProps) {
    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Siren className="h-4 w-4 text-rose-500" />
                    <h2 className="text-lg font-bold text-gray-900">Attention Queue</h2>
                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {items.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenOrders}
                        className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
                    >
                        Open Orders
                    </button>
                    <button
                        onClick={onOpenTables}
                        className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
                    >
                        Open Tables
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-2xl border border-gray-100 p-4">
                            <Skeleton className="h-4 w-40 rounded-lg" />
                            <Skeleton className="mt-2 h-3 w-28 rounded-lg" />
                            <Skeleton className="mt-3 h-9 w-24 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    <p className="font-semibold">Unable to load queue.</p>
                    <p className="pt-1 text-xs">{error}</p>
                    <button
                        onClick={onRetry}
                        className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700"
                    >
                        Retry
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                    <UtensilsCrossed className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="pt-2 text-sm font-semibold text-gray-700">Queue is clear.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.slice(0, 8).map((item) => (
                        <article key={`${item.type}-${item.id}`} className="rounded-2xl border border-gray-100 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass(item)}`}>
                                        {item.type}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                                </div>
                                <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {toAge(item.created_at)}
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span>Status: {item.status}</span>
                                {item.table_number ? <span>Table: {item.table_number}</span> : null}
                                {item.severity ? (
                                    <span className="inline-flex items-center gap-1 text-rose-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        {item.severity}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.type === 'order' && (
                                    <button
                                        onClick={() => onAdvanceOrder(item)}
                                        className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800"
                                    >
                                        Advance Status
                                    </button>
                                )}
                                {item.type === 'service_request' && (
                                    <button
                                        onClick={onOpenTables}
                                        className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                                    >
                                        Handle Request
                                    </button>
                                )}
                                {item.type === 'alert' && (
                                    <button
                                        onClick={onOpenSettings}
                                        className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-200"
                                    >
                                        Open Alert Settings
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
