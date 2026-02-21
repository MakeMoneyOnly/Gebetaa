'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

export type InvoiceRow = {
    id: string;
    invoice_number: string;
    supplier_name: string;
    status: 'pending_review' | 'approved' | 'disputed' | 'paid' | 'voided';
    currency: string;
    total_amount: number;
    due_at: string | null;
    created_at: string;
};

interface InvoiceReviewQueueProps {
    invoices: InvoiceRow[];
    loading: boolean;
    creating: boolean;
    onCreateInvoice: (payload: {
        supplier_name: string;
        status: InvoiceRow['status'];
        currency: string;
        subtotal: number;
        tax_amount: number;
        due_at?: string;
        notes?: string;
    }) => Promise<void>;
}

export function InvoiceReviewQueue({
    invoices,
    loading,
    creating,
    onCreateInvoice,
}: InvoiceReviewQueueProps) {
    const [supplierName, setSupplierName] = useState('');
    const [status, setStatus] = useState<InvoiceRow['status']>('pending_review');
    const [subtotal, setSubtotal] = useState('0');
    const [taxAmount, setTaxAmount] = useState('0');
    const [dueAt, setDueAt] = useState('');
    const [notes, setNotes] = useState('');

    const submitCreate = async () => {
        const subtotalValue = Number(subtotal);
        const taxValue = Number(taxAmount);
        if (!supplierName.trim() || !Number.isFinite(subtotalValue) || !Number.isFinite(taxValue))
            return;

        await onCreateInvoice({
            supplier_name: supplierName.trim(),
            status,
            currency: 'ETB',
            subtotal: subtotalValue,
            tax_amount: taxValue,
            ...(dueAt ? { due_at: new Date(dueAt).toISOString() } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        });

        setSupplierName('');
        setStatus('pending_review');
        setSubtotal('0');
        setTaxAmount('0');
        setDueAt('');
        setNotes('');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Invoice Review Queue</h3>
                    <p className="text-sm text-gray-500">
                        Capture supplier invoices and review approval/payment status.
                    </p>
                </div>
                <FileText className="h-5 w-5 text-gray-500" />
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
                    onChange={event => setStatus(event.target.value as InvoiceRow['status'])}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="pending_review">Pending review</option>
                    <option value="approved">Approved</option>
                    <option value="disputed">Disputed</option>
                    <option value="paid">Paid</option>
                    <option value="voided">Voided</option>
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
                    value={dueAt}
                    onChange={event => setDueAt(event.target.value)}
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
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Add
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading invoices...</p>
            ) : invoices.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No invoices in queue.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {invoices.map(invoice => (
                        <div key={invoice.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {invoice.invoice_number}
                                    </p>
                                    <p className="text-xs text-gray-600">{invoice.supplier_name}</p>
                                </div>
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 uppercase">
                                    {invoice.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {invoice.currency} {Number(invoice.total_amount).toFixed(2)}
                                {invoice.due_at
                                    ? ` · due ${new Date(invoice.due_at).toLocaleDateString()}`
                                    : ''}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
