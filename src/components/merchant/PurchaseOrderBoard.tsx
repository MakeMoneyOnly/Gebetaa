'use client';

import { useMemo, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { formatLocalizedDate } from '@/lib/format/et';
import type { AppLocale } from '@/lib/i18n/locale';

export type PurchaseOrderRow = {
    id: string;
    po_number: string;
    supplier_name: string;
    status: 'draft' | 'submitted' | 'partially_received' | 'received' | 'cancelled';
    currency: string;
    total_amount: number;
    expected_at: string | null;
    created_at: string;
};

interface PurchaseOrderBoardProps {
    orders: PurchaseOrderRow[];
    loading: boolean;
    creating: boolean;
    locale: AppLocale;
    onCreatePurchaseOrder: (payload: {
        supplier_name: string;
        status: 'draft' | 'submitted';
        currency: string;
        subtotal: number;
        tax_amount: number;
        expected_at?: string;
        notes?: string;
    }) => Promise<void>;
}

export function PurchaseOrderBoard({
    orders,
    loading,
    creating,
    locale,
    onCreatePurchaseOrder,
}: PurchaseOrderBoardProps) {
    const [supplierName, setSupplierName] = useState('');
    const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
    const [subtotal, setSubtotal] = useState('0');
    const [taxAmount, setTaxAmount] = useState('0');
    const [expectedAt, setExpectedAt] = useState('');
    const [notes, setNotes] = useState('');

    const grouped = useMemo(() => {
        return {
            draft: orders.filter(order => order.status === 'draft'),
            submitted: orders.filter(order => order.status === 'submitted'),
            partially_received: orders.filter(order => order.status === 'partially_received'),
            received: orders.filter(order => order.status === 'received'),
            cancelled: orders.filter(order => order.status === 'cancelled'),
        };
    }, [orders]);

    const submitCreate = async () => {
        const subtotalValue = Number(subtotal);
        const taxValue = Number(taxAmount);
        if (!supplierName.trim() || !Number.isFinite(subtotalValue) || !Number.isFinite(taxValue))
            return;

        await onCreatePurchaseOrder({
            supplier_name: supplierName.trim(),
            status,
            currency: 'ETB',
            subtotal: subtotalValue,
            tax_amount: taxValue,
            ...(expectedAt ? { expected_at: new Date(expectedAt).toISOString() } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        });

        setSupplierName('');
        setStatus('draft');
        setSubtotal('0');
        setTaxAmount('0');
        setExpectedAt('');
        setNotes('');
    };

    return (
        <section className="card-shadow rounded-4xl bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Purchase Order Board</h3>
                    <p className="text-sm text-gray-500">
                        Create and track procurement workflows by supplier and status.
                    </p>
                </div>
                <ClipboardList className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                <input
                    value={supplierName}
                    onChange={event => setSupplierName(event.target.value)}
                    placeholder="Supplier name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <select
                    value={status}
                    onChange={event => setStatus(event.target.value as 'draft' | 'submitted')}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                </select>
                <input
                    value={subtotal}
                    onChange={event => setSubtotal(event.target.value)}
                    inputMode="decimal"
                    placeholder="Subtotal"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={taxAmount}
                    onChange={event => setTaxAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="Tax"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    type="date"
                    value={expectedAt}
                    onChange={event => setExpectedAt(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <div className="flex gap-2">
                    <input
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        placeholder="Notes"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={submitCreate}
                        disabled={creating}
                        className="bg-brand-crimson inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Create
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading purchase orders...</p>
            ) : orders.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No purchase orders yet.</p>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {Object.entries(grouped).map(([lane, laneOrders]) => (
                        <div
                            key={lane}
                            className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                        >
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                {lane.replace('_', ' ')} ({laneOrders.length})
                            </p>
                            <div className="mt-2 space-y-2">
                                {laneOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="rounded-lg border border-gray-100 bg-white p-2"
                                    >
                                        <p className="text-xs font-semibold text-gray-900">
                                            {order.po_number}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {order.supplier_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {order.currency} {Number(order.total_amount).toFixed(2)}
                                            {order.expected_at
                                                ? ` · due ${formatLocalizedDate(order.expected_at, locale)}`
                                                : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
