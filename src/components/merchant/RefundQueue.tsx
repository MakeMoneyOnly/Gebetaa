'use client';

import { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <div className="grid min-h-[500px] grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Refund Submission */}
            <div className="flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-4">
                <header className="mb-6">
                    <h2 className="text-xl leading-tight font-bold text-gray-900">
                        Request refund
                    </h2>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                        Initiate a return for a captured payment.
                    </p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 space-y-5 rounded-4xl border border-gray-100 bg-gray-50/40 p-5"
                >
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Payment reference
                        </label>
                        <div className="relative">
                            <input
                                value={paymentReference}
                                onChange={event => setPaymentReference(event.target.value)}
                                placeholder="Select or type reference"
                                list="refund-payment-options"
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold transition-all outline-none placeholder:text-gray-300 focus:border-gray-400"
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
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Amount (ETB)
                        </label>
                        <input
                            value={amount}
                            onChange={event => setAmount(event.target.value)}
                            placeholder="0.00"
                            inputMode="decimal"
                            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold transition-all outline-none focus:border-gray-400"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Reason for refund
                        </label>
                        <textarea
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            placeholder="e.g. Order cancelled by guest"
                            rows={3}
                            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium transition-all outline-none placeholder:text-gray-300 focus:border-gray-400"
                        />
                    </div>

                    <div className="mt-auto pt-4">
                        <button
                            type="submit"
                            disabled={creating || !paymentReference || !amount || !reason}
                            className="bg-brand-crimson shadow-crimson-900/10 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {creating ? 'Submitting...' : 'Submit refund request'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right: Refund History */}
            <div className="flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-8">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl leading-tight font-bold text-gray-900">History</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Recently processed or pending refunds.
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <span className="animate-pulse rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            {pendingCount} pending
                        </span>
                    )}
                </header>

                <div className="flex-1">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-2xl bg-gray-50"
                                />
                            ))}
                        </div>
                    ) : refunds.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-8 text-center">
                            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                                <RefreshCcw className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                No refunds recorded
                            </h3>
                            <p className="mt-1 max-w-xs text-sm text-gray-500">
                                Once you submit a refund request, it will appear here for tracking.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                                <thead className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-4 pb-2">Payment</th>
                                        <th className="px-4 pb-2 text-right">Amount</th>
                                        <th className="px-4 pb-2">Reason</th>
                                        <th className="px-4 pb-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refunds.map(refund => (
                                        <tr
                                            key={refund.id}
                                            className="group h-14 bg-white transition-colors hover:bg-gray-50/50"
                                        >
                                            <td className="rounded-l-2xl border-y border-l border-gray-100 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-bold text-gray-900">
                                                        {refund.payment_id.slice(0, 12)}...
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {new Date(
                                                            refund.created_at
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-y border-gray-100 px-4 text-right">
                                                <span className="font-bold text-gray-900">
                                                    {formatETBCurrency(Number(refund.amount ?? 0), {
                                                        locale,
                                                    })}
                                                </span>
                                            </td>
                                            <td className="border-y border-gray-100 px-4">
                                                <span className="line-clamp-1 text-xs font-semibold text-gray-600">
                                                    {refund.reason}
                                                </span>
                                            </td>
                                            <td className="rounded-r-2xl border-y border-r border-gray-100 px-4 text-right">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider uppercase',
                                                        refund.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : refund.status === 'processed'
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-rose-100 text-rose-700'
                                                    )}
                                                >
                                                    {refund.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
