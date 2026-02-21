'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Link2, Loader2 } from 'lucide-react';

type DeliveryPartner = {
    id: string;
    provider: string;
    status: string;
    updated_at: string;
    last_sync_at: string | null;
};

type ExternalOrder = {
    id: string;
    provider: string;
    provider_order_id: string;
    source_channel: string;
    normalized_status: string;
    total_amount: number;
    currency: string;
    payload_json: Record<string, unknown>;
    acked_at: string | null;
    created_at: string;
    updated_at: string;
};

interface DeliveryPartnerHubProps {
    loading: boolean;
    partners: DeliveryPartner[];
    orders: ExternalOrder[];
    connecting: boolean;
    acknowledgingId: string | null;
    onConnect: (
        provider: 'beu' | 'deliver_addis' | 'zmall' | 'esoora' | 'custom_local',
        displayName?: string
    ) => Promise<void>;
    onAcknowledge: (externalOrderId: string) => Promise<void>;
}

const PROVIDERS: Array<'beu' | 'deliver_addis' | 'zmall' | 'esoora' | 'custom_local'> = [
    'beu',
    'deliver_addis',
    'zmall',
    'esoora',
    'custom_local',
];
const DASHBOARD_LOCALE = 'en-ET';

function toLabel(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, match => match.toUpperCase());
}

export function DeliveryPartnerHub({
    loading,
    partners,
    orders,
    connecting,
    acknowledgingId,
    onConnect,
    onAcknowledge,
}: DeliveryPartnerHubProps) {
    const providerToConnectId = 'delivery-provider-connect';
    const displayNameId = 'delivery-provider-display-name';
    const providerFilterId = 'delivery-provider-filter';
    const [providerToConnect, setProviderToConnect] = useState<
        'beu' | 'deliver_addis' | 'zmall' | 'esoora' | 'custom_local'
    >('beu');
    const [displayName, setDisplayName] = useState('');
    const [providerFilter, setProviderFilter] = useState<string>('all');

    const visibleOrders = useMemo(() => {
        if (providerFilter === 'all') return orders;
        return orders.filter(order => order.provider === providerFilter);
    }, [orders, providerFilter]);

    return (
        <div className="space-y-4 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Delivery Partner Hub</h3>
                    <p className="text-sm text-gray-500">
                        Connect providers and manage external delivery order intake.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-3">
                    <label
                        htmlFor={providerToConnectId}
                        className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                    >
                        Connect Provider
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                        <select
                            id={providerToConnectId}
                            value={providerToConnect}
                            onChange={event =>
                                setProviderToConnect(event.target.value as typeof providerToConnect)
                            }
                            className="h-10 flex-1 rounded-lg border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                        >
                            {PROVIDERS.map(provider => (
                                <option key={provider} value={provider}>
                                    {toLabel(provider)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label htmlFor={displayNameId} className="sr-only">
                        Provider display name
                    </label>
                    <input
                        id={displayNameId}
                        value={displayName}
                        onChange={event => setDisplayName(event.target.value)}
                        placeholder="Display name (optional)"
                        className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            void onConnect(providerToConnect, displayName.trim() || undefined)
                        }
                        disabled={connecting}
                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {connecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                        Connect
                    </button>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 xl:col-span-2">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Partner Status
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {partners.length === 0 && (
                            <p className="text-sm text-gray-500">
                                No delivery partners connected yet.
                            </p>
                        )}
                        {partners.map(partner => (
                            <div
                                key={partner.id}
                                className="flex items-center justify-between rounded-lg border border-gray-100 p-2"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {toLabel(partner.provider)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Updated{' '}
                                        {new Date(partner.updated_at).toLocaleString(
                                            DASHBOARD_LOCALE
                                        )}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                        partner.status === 'connected'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : partner.status === 'error'
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {toLabel(partner.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                    <label
                        htmlFor={providerFilterId}
                        className="text-xs font-semibold tracking-wide text-gray-500 uppercase"
                    >
                        External Orders
                    </label>
                    <select
                        id={providerFilterId}
                        value={providerFilter}
                        onChange={event => setProviderFilter(event.target.value)}
                        className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400"
                    >
                        <option value="all">All Providers</option>
                        {PROVIDERS.map(provider => (
                            <option key={provider} value={provider}>
                                {toLabel(provider)}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="mt-2 h-32 animate-pulse rounded-lg bg-gray-50" />
                ) : visibleOrders.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                        No external orders found for this provider filter.
                    </p>
                ) : (
                    <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <caption className="sr-only">
                                External delivery orders by provider with acknowledgment actions.
                            </caption>
                            <thead className="text-xs tracking-wide text-gray-500 uppercase">
                                <tr>
                                    <th scope="col" className="py-2">
                                        Provider
                                    </th>
                                    <th scope="col" className="py-2">
                                        Order Ref
                                    </th>
                                    <th scope="col" className="py-2">
                                        Status
                                    </th>
                                    <th scope="col" className="py-2">
                                        Amount
                                    </th>
                                    <th scope="col" className="py-2">
                                        Created
                                    </th>
                                    <th scope="col" className="py-2">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map(order => (
                                    <tr key={order.id} className="border-t border-gray-100">
                                        <td className="py-2 font-semibold text-gray-900">
                                            {toLabel(order.provider)}
                                        </td>
                                        <td className="py-2 font-mono text-xs text-gray-700">
                                            {order.provider_order_id}
                                        </td>
                                        <td className="py-2 text-gray-700">
                                            {toLabel(order.normalized_status)}
                                        </td>
                                        <td className="py-2 text-gray-700">
                                            {new Intl.NumberFormat(DASHBOARD_LOCALE, {
                                                style: 'currency',
                                                currency: order.currency || 'ETB',
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(Number(order.total_amount ?? 0))}
                                        </td>
                                        <td className="py-2 text-gray-500">
                                            {new Date(order.created_at).toLocaleString(
                                                DASHBOARD_LOCALE
                                            )}
                                        </td>
                                        <td className="py-2">
                                            {order.acked_at ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Acked
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => void onAcknowledge(order.id)}
                                                    disabled={acknowledgingId === order.id}
                                                    aria-label={`Acknowledge external order ${order.provider_order_id}`}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-black px-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                                >
                                                    {acknowledgingId === order.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    )}
                                                    Ack
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
