import { Landmark, FileCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatETBCurrency, formatLocalizedDate } from '@/lib/format/et';
import { cn } from '@/lib/utils';
import type { AppLocale } from '@/lib/i18n/locale';

export type PayoutRow = {
    id: string;
    provider: string;
    period_start: string;
    period_end: string;
    gross: number;
    fees: number;
    net: number;
    status: string;
};

export type ReconciliationRow = {
    id: string;
    source_type: string;
    expected_amount: number;
    settled_amount: number;
    delta_amount: number;
    status: string;
};

type PayoutReconciliationTableProps = {
    loading: boolean;
    payouts: PayoutRow[];
    reconciliationEntries: ReconciliationRow[];
    locale: AppLocale;
};

export function PayoutReconciliationTable({
    loading,
    payouts,
    reconciliationEntries,
    locale,
}: PayoutReconciliationTableProps) {
    const openExceptions = reconciliationEntries.filter(
        entry => entry.status === 'exception' || entry.status === 'investigating'
    ).length;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 flex min-h-[500px] flex-col rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-xl leading-tight font-bold text-gray-900">
                        Payout reconciliation
                    </h2>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                        Provider settlement windows and automated match status.
                    </p>
                </div>
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all',
                        openExceptions > 0
                            ? 'border border-rose-100 bg-rose-50 text-rose-700'
                            : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                    )}
                >
                    {openExceptions > 0 ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    {openExceptions} open exceptions
                </div>
            </header>

            <div className="flex-1">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-50" />
                        ))}
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-8 text-center">
                        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                            <Landmark className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">No payouts found</h3>
                        <p className="mt-1 max-w-xs text-sm text-gray-500">
                            Payout records will appear once providers initiate settlement windows.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                            <thead className="text-[11px] font-bold text-gray-400">
                                <tr>
                                    <th className="px-4 pb-2">Provider</th>
                                    <th className="px-4 pb-2">Settlement window</th>
                                    <th className="px-4 pb-2 text-right">Gross</th>
                                    <th className="px-4 pb-2 text-right">Fees</th>
                                    <th className="px-4 pb-2 text-right">Net payout</th>
                                    <th className="px-4 pb-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.map(payout => (
                                    <tr
                                        key={payout.id}
                                        className="group h-16 bg-white transition-colors hover:bg-gray-50/50"
                                    >
                                        <td className="rounded-l-2xl border-y border-l border-gray-100 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-gray-50 p-2 text-gray-500">
                                                    <Landmark className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-gray-900 capitalize">
                                                    {payout.provider}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border-y border-gray-100 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">
                                                    {formatLocalizedDate(
                                                        payout.period_start,
                                                        locale
                                                    )}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-400 lowercase">
                                                    to{' '}
                                                    {formatLocalizedDate(payout.period_end, locale)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border-y border-gray-100 px-4 text-right font-medium text-gray-500">
                                            {formatETBCurrency(Number(payout.gross ?? 0), {
                                                locale,
                                            })}
                                        </td>
                                        <td className="border-y border-gray-100 px-4 text-right font-medium text-rose-500">
                                            -
                                            {formatETBCurrency(Number(payout.fees ?? 0), {
                                                locale,
                                            })}
                                        </td>
                                        <td className="border-y border-gray-100 px-4 text-right">
                                            <span className="font-black text-gray-900">
                                                {formatETBCurrency(Number(payout.net ?? 0), {
                                                    locale,
                                                })}
                                            </span>
                                        </td>
                                        <td className="rounded-r-2xl border-y border-r border-gray-100 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {payout.status === 'pending' && (
                                                    <Clock className="h-3 w-3 animate-spin text-amber-500" />
                                                )}
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-tight capitalize',
                                                        payout.status === 'settled'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : payout.status === 'pending'
                                                              ? 'bg-amber-100 text-amber-700'
                                                              : 'bg-gray-100 text-gray-600'
                                                    )}
                                                >
                                                    {payout.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-bold text-gray-400">Matched</p>
                    <p className="mt-1 text-lg font-black text-gray-900">
                        {reconciliationEntries.filter(e => e.status === 'matched').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-bold text-gray-400">Pending</p>
                    <p className="mt-1 text-lg font-black text-amber-600">
                        {reconciliationEntries.filter(e => e.status === 'pending').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                    <p className="text-[10px] font-bold text-rose-400">Exceptions</p>
                    <p className="mt-1 text-lg font-black text-rose-600">{openExceptions}</p>
                </div>
            </div>
        </section>
    );
}
