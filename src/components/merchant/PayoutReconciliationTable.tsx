'use client';

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
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 2,
    }).format(value);
}

export function PayoutReconciliationTable({
    loading,
    payouts,
    reconciliationEntries,
}: PayoutReconciliationTableProps) {
    const openExceptions = reconciliationEntries.filter(
        entry => entry.status === 'exception' || entry.status === 'investigating'
    ).length;

    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-black">Payout Reconciliation</h2>
                    <p className="text-sm text-gray-500">
                        Provider payout windows and match status.
                    </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {openExceptions} open exceptions
                </span>
            </header>

            {loading ? (
                <div className="h-44 animate-pulse rounded-2xl bg-gray-100" />
            ) : payouts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                    No payouts found for the current period.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-xs tracking-wide text-gray-500 uppercase">
                            <tr>
                                <th className="pb-2">Provider</th>
                                <th className="pb-2">Window</th>
                                <th className="pb-2">Gross</th>
                                <th className="pb-2">Fees</th>
                                <th className="pb-2">Net</th>
                                <th className="pb-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map(payout => (
                                <tr key={payout.id} className="border-t border-gray-100">
                                    <td className="py-2 pr-3 font-semibold capitalize">
                                        {payout.provider}
                                    </td>
                                    <td className="py-2 pr-3 text-xs text-gray-600">
                                        {new Date(payout.period_start).toLocaleDateString()} -{' '}
                                        {new Date(payout.period_end).toLocaleDateString()}
                                    </td>
                                    <td className="py-2 pr-3">
                                        {formatCurrency(Number(payout.gross ?? 0))}
                                    </td>
                                    <td className="py-2 pr-3">
                                        {formatCurrency(Number(payout.fees ?? 0))}
                                    </td>
                                    <td className="py-2 pr-3 font-semibold">
                                        {formatCurrency(Number(payout.net ?? 0))}
                                    </td>
                                    <td className="py-2">
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize">
                                            {payout.status}
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
