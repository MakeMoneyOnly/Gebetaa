'use client';

import { Activity, AlertTriangle, CheckCircle2, Truck } from 'lucide-react';

type ChannelSummary = {
    totals: {
        delivery_partners: number;
        connected_partners: number;
        degraded_partners: number;
        external_orders_24h: number;
        external_orders_total: number;
        unacked_orders: number;
    };
    statuses: Record<string, number>;
    partners: Array<{
        id: string;
        provider: string;
        status: string;
        updated_at: string;
        last_sync_at: string | null;
    }>;
};

interface ChannelHealthBoardProps {
    loading: boolean;
    summary: ChannelSummary | null;
    error: string | null;
}

function toLabel(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export function ChannelHealthBoard({ loading, summary, error }: ChannelHealthBoardProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[140px] animate-pulse rounded-[1.5rem] bg-white shadow-sm" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                {error}
            </div>
        );
    }

    const totals = summary?.totals;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <p className="text-3xl font-bold text-black">{totals?.delivery_partners ?? 0}</p>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-gray-700">Connected Channels</p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-3xl font-bold text-black">{totals?.connected_partners ?? 0}</p>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-gray-700">Healthy Partners</p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <p className="text-3xl font-bold text-black">{totals?.external_orders_24h ?? 0}</p>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-gray-700">External Orders (24h)</p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="text-3xl font-bold text-black">{totals?.unacked_orders ?? 0}</p>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-gray-700">Unacknowledged Orders</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900">Order Status Mix</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(summary?.statuses ?? {}).length === 0 ? (
                            <p className="text-sm text-gray-500">No external order status data yet.</p>
                        ) : (
                            Object.entries(summary?.statuses ?? {}).map(([status, count]) => (
                                <span
                                    key={status}
                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700"
                                >
                                    {toLabel(status)}: {count}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900">Partner Health</h3>
                    <div className="mt-3 space-y-2">
                        {(summary?.partners ?? []).length === 0 ? (
                            <p className="text-sm text-gray-500">No delivery partners connected.</p>
                        ) : (
                            (summary?.partners ?? []).map((partner) => (
                                <div key={partner.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                                    <p className="text-sm font-semibold text-gray-900">{toLabel(partner.provider)}</p>
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                        partner.status === 'connected'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : partner.status === 'error'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {toLabel(partner.status)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
