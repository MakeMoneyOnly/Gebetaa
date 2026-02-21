'use client';

import type { AppLocale } from '@/lib/i18n/locale';
import { formatETBCurrency } from '@/lib/format/et';

export type PaymentRow = {
    id: string;
    created_at: string;
    method: string;
    provider: string;
    amount: number;
    tip_amount: number;
    status: string;
};

type PaymentMethodBreakdownProps = {
    loading: boolean;
    payments: PaymentRow[];
    locale: AppLocale;
};

export function PaymentMethodBreakdown({ loading, payments, locale }: PaymentMethodBreakdownProps) {
    const byMethod = payments.reduce<Record<string, { count: number; amount: number }>>(
        (acc, payment) => {
            const key = payment.method;
            if (!acc[key]) {
                acc[key] = { count: 0, amount: 0 };
            }
            acc[key].count += 1;
            acc[key].amount += Number(payment.amount ?? 0);
            return acc;
        },
        {}
    );

    const methodRows = Object.entries(byMethod).sort((a, b) => b[1].amount - a[1].amount);

    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <header className="mb-4">
                <h2 className="text-lg font-bold text-black">Payment Method Breakdown</h2>
                <p className="text-sm text-gray-500">Captured payment volume by method.</p>
            </header>

            {loading ? (
                <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
            ) : methodRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                    No payment records available yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {methodRows.map(([method, details]) => (
                        <div
                            key={method}
                            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-900 capitalize">
                                    {method}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {details.count} transactions
                                </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                {formatETBCurrency(details.amount, { locale })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
