'use client';

import { useMemo, useState } from 'react';
import { formatETBCurrency } from '@/lib/format/et';
import type { AppLocale } from '@/lib/i18n/locale';

export type RefundRow = {
    id: string;
    payment_id: string;
    amount: number;
    reason: string;
    status: 'pending' | 'processed' | 'failed' | 'cancelled';
    created_at: string;
};

type PaymentOption = {
    id: string;
    amount: number;
    method: string;
    status: string;
    provider?: string;
    provider_reference?: string | null;
};

type RefundQueueProps = {
    loading: boolean;
    creating: boolean;
    refunds: RefundRow[];
    payments: PaymentOption[];
    locale: AppLocale;
    onCreateRefund: (payload: {
        payment_reference: string;
        amount: number;
        reason: string;
    }) => Promise<void>;
};

function paymentDisplayLabel(payment: PaymentOption, locale: AppLocale) {
    const shortId = payment.id.slice(0, 8);
    const reference = payment.provider_reference ? ` · ${payment.provider_reference}` : '';
    return `${shortId}${reference} · ${payment.method} · ${formatETBCurrency(Number(payment.amount ?? 0), { locale })}`;
}

export function RefundQueue({
    loading,
    creating,
    refunds,
    payments,
    locale,
    onCreateRefund,
}: RefundQueueProps) {
    const [paymentReference, setPaymentReference] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const pendingCount = useMemo(
        () => refunds.filter(refund => refund.status === 'pending').length,
        [refunds]
    );

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsedAmount = Number(amount);
        if (!paymentReference || !reason || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return;
        }

        await onCreateRefund({
            payment_reference: paymentReference.trim(),
            amount: parsedAmount,
            reason: reason.trim(),
        });

        setPaymentReference('');
        setAmount('');
        setReason('');
    };

    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-black">Refund Queue</h2>
                    <p className="text-sm text-gray-500">Track and submit refund requests.</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {pendingCount} pending
                </span>
            </header>

            <form onSubmit={handleSubmit} className="mb-4 grid gap-2 md:grid-cols-4">
                <input
                    value={paymentReference}
                    onChange={event => setPaymentReference(event.target.value)}
                    placeholder="Payment ID or Provider Reference"
                    list="refund-payment-options"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <datalist id="refund-payment-options">
                    {payments.map(payment => (
                        <option key={payment.id} value={payment.id}>
                            {paymentDisplayLabel(payment, locale)}
                        </option>
                    ))}
                    {payments
                        .filter(payment => Boolean(payment.provider_reference))
                        .map(payment => (
                            <option
                                key={`${payment.id}-provider`}
                                value={payment.provider_reference!}
                            >
                                {paymentDisplayLabel(payment, locale)}
                            </option>
                        ))}
                </datalist>
                <input
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    placeholder="Amount"
                    inputMode="decimal"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    placeholder="Reason"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                    type="submit"
                    disabled={creating}
                    className="bg-brand-crimson h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {creating ? 'Submitting...' : 'Submit Refund'}
                </button>
            </form>

            {loading ? (
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            ) : refunds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                    No refund requests recorded.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-xs tracking-wide text-gray-500 uppercase">
                            <tr>
                                <th className="pb-2">Payment</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">Reason</th>
                                <th className="pb-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map(refund => (
                                <tr key={refund.id} className="border-t border-gray-100">
                                    <td className="py-2 pr-3 font-mono text-xs text-gray-700">
                                        {refund.payment_id}
                                    </td>
                                    <td className="py-2 pr-3 font-semibold text-gray-900">
                                        {formatETBCurrency(Number(refund.amount ?? 0), { locale })}
                                    </td>
                                    <td className="py-2 pr-3 text-gray-700">{refund.reason}</td>
                                    <td className="py-2">
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 capitalize">
                                            {refund.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
