'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Banknote,
    CreditCard,
    Loader2,
    Receipt,
    RefreshCw,
    UserX,
    Store,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeviceHeartbeat } from '@/hooks/useDeviceHeartbeat';
import type { SupportedPaymentMethod } from '@/lib/devices/config';
import { getDeviceTypeLabel } from '@/lib/devices/config';
import { formatCurrencyCompact } from '@/lib/utils/monetary';

type TerminalTable = {
    id: string;
    table_number: string;
    status: string;
    updated_at: string | null;
    outstanding_total: number;
    active_order_count: number;
};

type TerminalOrder = {
    id: string;
    table_number: string | null;
    order_number: string | null;
    status: string;
    total_price: number;
    created_at: string | null;
};

type TerminalPaymentOption = {
    method: SupportedPaymentMethod;
    label: string;
    description: string;
};

type SettlementSplit = {
    id: string;
    split_index: number;
    split_label?: string | null;
    computed_amount: number;
    requested_amount?: number | null;
};

type SettlementPayment = {
    id: string;
    split_id?: string | null;
    amount: number;
    status: string;
};

type SplitPayload = {
    order: { id: string; total_price: number; status: string };
    splits: SettlementSplit[];
    split_payments: SettlementPayment[];
};

type TerminalOverview = {
    device: {
        id: string;
        name: string;
        device_type: string;
        assigned_zones: string[];
        metadata?: {
            station_name?: string;
            settlement_mode?: string;
            receipt_mode?: string;
        } | null;
    };
    payment_options: TerminalPaymentOption[];
    tables: TerminalTable[];
    orders: TerminalOrder[];
};

const METHOD_ICONS: Record<SupportedPaymentMethod, React.ReactNode> = {
    cash: <Banknote className="h-4 w-4" />,
    chapa: <CreditCard className="h-4 w-4" />,
    card: <CreditCard className="h-4 w-4" />,
    other: <Receipt className="h-4 w-4" />,
};

function getProviderForMethod(method: SupportedPaymentMethod): string {
    if (method === 'chapa') {
        return method;
    }

    return 'internal';
}

export default function TerminalPage() {
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<TerminalOverview | null>(null);
    const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [splitPayload, setSplitPayload] = useState<SplitPayload | null>(null);
    const [splitGuestCount, setSplitGuestCount] = useState(2);
    const [paymentMethod, setPaymentMethod] = useState<SupportedPaymentMethod>('cash');
    const [orderAmountInput, setOrderAmountInput] = useState('');
    const [providerReference, setProviderReference] = useState('');
    const [capturingId, setCapturingId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const token = localStorage.getItem('gebata_device_token');
            const rawInfo = localStorage.getItem('gebata_device_info');
            if (token) setDeviceToken(token);
            if (rawInfo) setDeviceInfo(JSON.parse(rawInfo));
        } catch (error) {
            console.error('Failed to load paired terminal context', error);
        }
    }, []);

    useDeviceHeartbeat({
        deviceToken,
        route: '/terminal',
        enabled: Boolean(deviceToken),
    });

    const loadOverview = useCallback(async () => {
        if (!deviceToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/device/terminal/overview', {
                headers: {
                    'x-device-token': deviceToken,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load terminal workspace');
            }
            setOverview(payload.data as TerminalOverview);
            const firstTable = (payload.data as TerminalOverview).tables[0];
            setSelectedTableNumber(current => current ?? firstTable?.table_number ?? null);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to load terminal workspace'
            );
        } finally {
            setLoading(false);
        }
    }, [deviceToken]);

    useEffect(() => {
        void loadOverview();
        const interval = window.setInterval(() => {
            void loadOverview();
        }, 30_000);

        return () => window.clearInterval(interval);
    }, [loadOverview]);

    const loadSplitPayload = useCallback(
        async (orderId: string) => {
            if (!deviceToken) return;

            try {
                const response = await fetch(`/api/orders/${orderId}/split`, {
                    headers: {
                        'x-device-token': deviceToken,
                    },
                });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error ?? 'Failed to load split settlement');
                }
                const splitData = payload.data as SplitPayload;
                setSplitPayload(splitData);
                if ((splitData.splits?.length ?? 0) >= 2) {
                    setSplitGuestCount(Math.max(2, Math.min(12, splitData.splits.length)));
                }
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Failed to load split settlement'
                );
            }
        },
        [deviceToken]
    );

    const selectedTable = useMemo(
        () => overview?.tables.find(table => table.table_number === selectedTableNumber) ?? null,
        [overview?.tables, selectedTableNumber]
    );

    const tableOrders = useMemo(
        () =>
            (overview?.orders ?? []).filter(
                order => String(order.table_number ?? '') === String(selectedTableNumber ?? '')
            ),
        [overview?.orders, selectedTableNumber]
    );

    useEffect(() => {
        const nextOrderId = tableOrders[0]?.id ?? null;
        setSelectedOrderId(current =>
            current && tableOrders.some(order => order.id === current) ? current : nextOrderId
        );
    }, [tableOrders]);

    useEffect(() => {
        if (!selectedOrderId) {
            setSplitPayload(null);
            return;
        }

        void loadSplitPayload(selectedOrderId);
    }, [loadSplitPayload, selectedOrderId]);

    const selectedOrder = useMemo(
        () => tableOrders.find(order => order.id === selectedOrderId) ?? null,
        [tableOrders, selectedOrderId]
    );

    const selectedPaymentOption = useMemo(
        () =>
            (overview?.payment_options ?? []).find(option => option.method === paymentMethod) ??
            null,
        [overview?.payment_options, paymentMethod]
    );

    const splitPaidById = useMemo(() => {
        const totals = new Map<string, number>();
        for (const payment of splitPayload?.split_payments ?? []) {
            if (!payment.split_id || payment.status !== 'captured') continue;
            totals.set(
                payment.split_id,
                Number(
                    ((totals.get(payment.split_id) ?? 0) + Number(payment.amount ?? 0)).toFixed(2)
                )
            );
        }
        return totals;
    }, [splitPayload?.split_payments]);

    const fullOrderRemaining = useMemo(() => {
        if (!selectedTable) return 0;
        return Number(selectedTable.outstanding_total ?? 0);
    }, [selectedTable]);

    useEffect(() => {
        setOrderAmountInput(fullOrderRemaining > 0 ? String(fullOrderRemaining.toFixed(2)) : '');
    }, [fullOrderRemaining, selectedOrderId]);

    useEffect(() => {
        const preferredMethod =
            overview?.payment_options.find(option => option.method === 'cash')?.method ??
            overview?.payment_options[0]?.method;
        if (preferredMethod) {
            setPaymentMethod(preferredMethod);
        }
    }, [overview?.payment_options]);

    const createEvenSplit = async () => {
        if (!deviceToken || !selectedOrderId || !selectedOrder) return;

        try {
            setCapturingId('split-setup');
            const response = await fetch(`/api/orders/${selectedOrderId}/split`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': deviceToken,
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify({
                    method: 'even',
                    splits: Array.from({ length: splitGuestCount }, (_, index) => ({
                        guest_name: `Guest ${index + 1}`,
                    })),
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to create even split');
            }
            toast.success(`Split ${selectedOrder.order_number ?? 'order'} into ${splitGuestCount}`);
            await loadSplitPayload(selectedOrderId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create split');
        } finally {
            setCapturingId(null);
        }
    };

    const capturePayment = async (args: {
        orderId?: string;
        splitId?: string;
        amount: number;
        label: string;
    }) => {
        if (!deviceToken) return;

        try {
            setCapturingId(args.splitId ?? args.orderId ?? 'payment');
            const response = await fetch('/api/finance/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': deviceToken,
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify({
                    order_id: args.orderId,
                    split_id: args.splitId,
                    method: paymentMethod,
                    provider: getProviderForMethod(paymentMethod),
                    provider_reference: providerReference.trim() || undefined,
                    amount: Number(args.amount.toFixed(2)),
                    metadata: {
                        source: 'terminal_device',
                        terminal_name: overview?.device.name ?? null,
                        station_name: overview?.device.metadata?.station_name ?? null,
                        settlement_label: args.label,
                    },
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to record payment');
            }
            toast.success(`Payment recorded for ${args.label}`);
            setProviderReference('');
            await Promise.all([
                loadOverview(),
                selectedOrderId ? loadSplitPayload(selectedOrderId) : null,
            ]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to record payment');
        } finally {
            setCapturingId(null);
        }
    };

    const closeTableSettlement = async () => {
        if (!deviceToken || !selectedTable) return;

        const parsedAmount = Number(orderAmountInput);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            toast.error('Enter a valid settlement amount');
            return;
        }

        try {
            setCapturingId(`table-${selectedTable.id}`);
            const response = await fetch('/api/device/tables/close', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': deviceToken,
                },
                body: JSON.stringify({
                    table_id: selectedTable.id,
                    payment: {
                        provider: paymentMethod === 'other' ? 'other' : paymentMethod,
                        amount: parsedAmount,
                        tx_ref: providerReference.trim() || undefined,
                    },
                    notes: `Settled from cashier terminal ${overview?.device.name ?? 'Terminal'}`,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to close table settlement');
            }
            toast.success(`Closed table ${selectedTable.table_number}`);
            setProviderReference('');
            setSelectedOrderId(null);
            setSplitPayload(null);
            await loadOverview();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to close table');
        } finally {
            setCapturingId(null);
        }
    };

    if (!deviceToken && !loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-300" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        Terminal not paired
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        Pair this tablet from the merchant device provisioning flow before using the
                        cashier terminal.
                    </p>
                </div>
            </div>
        );
    }

    if (deviceInfo?.device_type && deviceInfo.device_type !== 'terminal') {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-300" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        Wrong device role
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        This tablet is paired as {getDeviceTypeLabel(deviceInfo.device_type)}.
                        Re-provision it as a cashier terminal to access `/terminal`.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 pb-24 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black md:text-5xl">
                        {overview?.device.metadata?.station_name ||
                            overview?.device.name ||
                            'Cashier Terminal'}
                    </h1>
                    <p className="font-medium text-gray-500">
                        Review open orders and settle bills seamlessly without entering waiter
                        workflows.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void loadOverview()}
                        disabled={loading}
                        className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-black shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? 'animate-spin text-gray-400' : 'text-gray-500'}`}
                        />
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <aside className="relative flex flex-col space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group flex h-[140px] flex-col justify-between overflow-hidden rounded-[2rem] border border-gray-100/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-gray-400">
                                    <Store className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                    Mode
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight text-gray-900 capitalize">
                                    {overview?.device.metadata?.settlement_mode ?? 'Cashier'}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-gray-400">
                                    Settlement Workflow
                                </p>
                            </div>
                        </div>
                        <div className="group flex h-[140px] flex-col justify-between overflow-hidden rounded-[2rem] border border-gray-100/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-gray-400">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                    Print
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight text-gray-900 capitalize">
                                    {overview?.device.metadata?.receipt_mode ?? 'Prompt'}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-gray-400">
                                    Receipt Setting
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-h-[500px] flex-col rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between px-2">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-gray-900">
                                    Billable Tables
                                </h3>
                                <p className="text-sm font-medium text-gray-500">
                                    Tables with active orders
                                </p>
                            </div>
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-gray-900">
                                {overview?.tables.length ?? 0}
                            </span>
                        </div>

                        <div className="space-y-4 overflow-y-auto px-2 pb-4">
                            {(overview?.tables ?? []).map(table => {
                                const isSelected = selectedTableNumber === table.table_number;
                                return (
                                    <button
                                        key={table.id}
                                        onClick={() => setSelectedTableNumber(table.table_number)}
                                        className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-[2rem] border transition-all hover:shadow-md focus:outline-none ${
                                            isSelected
                                                ? 'border-gray-900 bg-gray-900 p-5 text-white shadow-xl'
                                                : 'border-gray-100 bg-white p-5 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex w-full items-start justify-between">
                                            <div className="flex flex-col items-start gap-1">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${isSelected ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}
                                                >
                                                    {table.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-[10px] font-bold tracking-widest uppercase ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}
                                                >
                                                    Amount Due
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex w-full items-end justify-between">
                                            <div className="text-left">
                                                <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                    Table
                                                </p>
                                                <div
                                                    className="text-4xl font-black tracking-tighter"
                                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                                >
                                                    {table.table_number}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-2xl font-bold tracking-tight ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}
                                                >
                                                    {Number(table.outstanding_total ?? 0).toFixed(
                                                        2
                                                    )}
                                                    <span
                                                        className={`ml-1 text-sm font-medium ${isSelected ? 'text-emerald-500' : 'text-emerald-500'}`}
                                                    >
                                                        ETB
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={`mt-4 flex items-center justify-between border-t ${isSelected ? 'border-white/10' : 'border-gray-50'} pt-4`}
                                        >
                                            <div
                                                className={`text-xs font-bold ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}
                                            >
                                                {table.active_order_count} Active{' '}
                                                {table.active_order_count === 1
                                                    ? 'Order'
                                                    : 'Orders'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {!loading && (overview?.tables.length ?? 0) === 0 && (
                                <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                                    <p className="text-base font-semibold text-gray-700">
                                        No billable tables.
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Waiting for new orders...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <section className="flex min-w-0 flex-col space-y-6">
                    <div className="flex flex-col gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">
                                Settlement Workspace
                            </p>
                            <h2 className="mt-1 text-4xl font-black tracking-tight text-gray-900">
                                {selectedTable
                                    ? `Table ${selectedTable.table_number}`
                                    : 'Select a Table'}
                            </h2>
                        </div>
                        {selectedTable && (
                            <div className="flex flex-wrap items-center gap-2 rounded-[2rem] border border-gray-100 bg-slate-50 p-2">
                                {(overview?.payment_options ?? []).map(option => (
                                    <button
                                        key={option.method}
                                        onClick={() => setPaymentMethod(option.method)}
                                        className={`flex items-center gap-2 rounded-[1.5rem] px-5 py-3 text-sm font-bold transition-all ${
                                            paymentMethod === option.method
                                                ? 'border border-gray-200/50 bg-white text-gray-900 shadow-sm'
                                                : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {METHOD_ICONS[option.method]}
                                        <span className="capitalize">{option.method}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedPaymentOption && (
                            <p className="text-sm font-medium text-gray-500 lg:max-w-md">
                                {selectedPaymentOption.description}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                        <div className="flex min-h-[500px] flex-col rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight text-gray-900">
                                        Open Orders
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500">
                                        For selected table
                                    </p>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-gray-900">
                                    {tableOrders.length}
                                </span>
                            </div>
                            <div className="space-y-4 overflow-y-auto px-1 pb-4">
                                {tableOrders.map(order => {
                                    const isOrderSelected = order.id === selectedOrderId;
                                    return (
                                        <button
                                            key={order.id}
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-[2rem] border transition-all hover:shadow-md focus:outline-none ${
                                                isOrderSelected
                                                    ? 'border-green-200 bg-green-50/50 p-5 shadow-sm ring-1 ring-green-100 ring-offset-1'
                                                    : 'border-gray-100 bg-white p-5 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex w-full items-start justify-between">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${isOrderSelected ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex w-full items-end justify-between">
                                                <div className="text-left">
                                                    <h3
                                                        className={`text-2xl font-black tracking-tight ${isOrderSelected ? 'text-green-900' : 'text-gray-900'}`}
                                                    >
                                                        {order.order_number ?? 'Open Order'}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`text-xl font-black tracking-tight text-emerald-600`}
                                                    >
                                                        {formatCurrencyCompact(
                                                            order.total_price ?? 0
                                                        )}
                                                        <span className="ml-1 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                                            ETB
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                                {selectedTable && tableOrders.length === 0 && (
                                    <div className="mt-4 flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                                        <p className="text-base font-semibold text-gray-700">
                                            No active orders.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                            {!selectedOrder ? (
                                <div className="flex flex-1 items-center justify-center text-center">
                                    <div className="max-w-xs">
                                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-gray-400">
                                            <Store className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight text-gray-900">
                                            Select an Order
                                        </h3>
                                        <p className="mt-3 text-[15px] leading-relaxed font-medium text-gray-500">
                                            Choose an order from the list to review the full
                                            settlement or divide the check evenly among multiple
                                            guests.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col space-y-8">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                Order Check
                                            </p>
                                            <h3 className="text-3xl font-black tracking-tight text-gray-900 md:text-5xl">
                                                {selectedOrder.order_number}
                                            </h3>
                                            <p className="mt-2 text-[15px] font-medium text-gray-500">
                                                Capture a full payment or divide this check.
                                            </p>
                                        </div>
                                        <div className="flex min-w-[200px] flex-col items-end justify-center rounded-[2rem] border border-gray-100 bg-slate-50 p-6 text-right shadow-inner">
                                            <p className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">
                                                Outstanding
                                            </p>
                                            <p
                                                className="mt-1 text-5xl font-black tracking-tighter text-emerald-600"
                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                            >
                                                {fullOrderRemaining.toFixed(2)}
                                            </p>
                                            <span className="mt-1 text-sm font-bold tracking-widest text-emerald-500 uppercase">
                                                ETB
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                                        <div className="flex flex-col rounded-[2rem] border border-gray-100 bg-slate-50 p-6 shadow-sm">
                                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                                <h4 className="text-xl font-bold tracking-tight text-gray-900">
                                                    Split Checks
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select
                                                        value={splitGuestCount}
                                                        onChange={e =>
                                                            setSplitGuestCount(
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        className="h-12 w-28 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 shadow-sm transition-all outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                                                    >
                                                        {[2, 3, 4, 5, 6].map(count => (
                                                            <option key={count} value={count}>
                                                                {count} Guests
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => void createEvenSplit()}
                                                        disabled={capturingId === 'split-setup'}
                                                        className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-900 px-6 text-[15px] font-bold text-white shadow-md shadow-gray-900/10 transition-all hover:-translate-y-0.5 hover:bg-black focus:outline-none active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                                                    >
                                                        {capturingId === 'split-setup'
                                                            ? 'Saving...'
                                                            : 'Split Evenly'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto pr-2">
                                                {(splitPayload?.splits ?? []).length > 0 ? (
                                                    <div className="space-y-4 pb-4">
                                                        {splitPayload!.splits.map(split => {
                                                            const paid =
                                                                splitPaidById.get(split.id) ?? 0;
                                                            const remaining = Number(
                                                                Math.max(
                                                                    0,
                                                                    split.computed_amount - paid
                                                                ).toFixed(2)
                                                            );
                                                            const isPaid = remaining <= 0;
                                                            return (
                                                                <div
                                                                    key={split.id}
                                                                    className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                                                                >
                                                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                                        <div className="flex-1 pr-4">
                                                                            <p className="text-lg font-bold tracking-tight text-gray-900">
                                                                                {split.split_label ||
                                                                                    `Guest ${split.split_index + 1}`}
                                                                            </p>
                                                                            <div className="mt-3 flex items-center gap-3">
                                                                                <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                                                        style={{
                                                                                            width: `${Math.min(100, (paid / split.computed_amount) * 100)}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <p className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">
                                                                                    {paid.toFixed(
                                                                                        0
                                                                                    )}{' '}
                                                                                    /{' '}
                                                                                    {Number(
                                                                                        split.computed_amount ??
                                                                                            0
                                                                                    ).toFixed(
                                                                                        0
                                                                                    )}{' '}
                                                                                    ETB
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() =>
                                                                                void capturePayment(
                                                                                    {
                                                                                        splitId:
                                                                                            split.id,
                                                                                        amount:
                                                                                            remaining ||
                                                                                            Number(
                                                                                                split.computed_amount ??
                                                                                                    0
                                                                                            ),
                                                                                        label:
                                                                                            split.split_label ||
                                                                                            `Guest ${split.split_index + 1}`,
                                                                                    }
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                capturingId ===
                                                                                    split.id ||
                                                                                isPaid
                                                                            }
                                                                            className={`flex h-12 min-w-[130px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition-all ${
                                                                                isPaid
                                                                                    ? 'bg-emerald-50 text-emerald-700 opacity-80 shadow-none'
                                                                                    : 'bg-emerald-600 text-white shadow-md hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-95'
                                                                            } disabled:pointer-events-none`}
                                                                        >
                                                                            {capturingId ===
                                                                            split.id ? (
                                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                                            ) : isPaid ? (
                                                                                <>
                                                                                    <CheckCircle className="h-4 w-4" />
                                                                                    Paid
                                                                                </>
                                                                            ) : (
                                                                                `Pay ${remaining.toFixed(2)}`
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white/50 p-6 text-center text-[15px] font-medium text-gray-500">
                                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                                                            <UserX className="h-5 w-5" />
                                                        </div>
                                                        <p>No split is configured yet.</p>
                                                        <p className="mt-1 text-sm text-gray-400">
                                                            Use Split Evenly to distribute the total
                                                            across guests.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-gray-800 bg-gray-900 p-8 text-white shadow-xl ring-1 ring-white/10 lg:h-auto">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <Banknote className="h-48 w-48" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                                        <Banknote className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                                <h4 className="text-2xl font-black tracking-tight">
                                                    Close Table
                                                </h4>
                                                <p className="mt-2 text-[15px] leading-relaxed font-medium text-gray-400">
                                                    {paymentMethod === 'chapa'
                                                        ? 'Confirm the digital tender, add the transaction reference when available, then close the table.'
                                                        : 'Record the final settlement to immediately clear the table.'}
                                                </p>
                                            </div>

                                            <div className="relative z-10 mt-8 space-y-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                        Settlement Amount
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-gray-400">
                                                            ETB
                                                        </span>
                                                        <input
                                                            value={orderAmountInput}
                                                            onChange={e =>
                                                                setOrderAmountInput(e.target.value)
                                                            }
                                                            placeholder="0.00"
                                                            className="h-14 w-full rounded-2xl border border-gray-700 bg-gray-800 p-4 pl-14 text-lg font-bold text-white transition-all outline-none placeholder:text-gray-500 focus:border-gray-500 focus:bg-gray-700"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                        Provider Reference{' '}
                                                        <span className="tracking-normal text-gray-500 lowercase">
                                                            (Optional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        value={providerReference}
                                                        onChange={e =>
                                                            setProviderReference(e.target.value)
                                                        }
                                                        placeholder={
                                                            paymentMethod === 'chapa'
                                                                ? 'Chapa tx_ref'
                                                                : 'Txn ID or receipt #'
                                                        }
                                                        className="h-14 w-full rounded-2xl border border-gray-700 bg-gray-800 px-4 text-sm font-bold text-white transition-all outline-none placeholder:text-gray-500 focus:border-gray-500 focus:bg-gray-700"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => void closeTableSettlement()}
                                                    disabled={
                                                        capturingId === `table-${selectedTable?.id}`
                                                    }
                                                    className="bg-brand-crimson mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-[16px] font-bold text-white shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#a0151e] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    {capturingId ===
                                                    `table-${selectedTable?.id}` ? (
                                                        <Loader2 className="h-6 w-6 animate-spin" />
                                                    ) : (
                                                        <>
                                                            {METHOD_ICONS[paymentMethod]}
                                                            {paymentMethod === 'cash'
                                                                ? 'Capture Cash & Close'
                                                                : paymentMethod === 'chapa'
                                                                  ? 'Confirm Chapa & Close'
                                                                  : 'Capture & Close'}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
