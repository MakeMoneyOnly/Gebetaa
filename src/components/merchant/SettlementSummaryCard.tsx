'use client';

type SettlementSummaryTotals = {
    gross: number;
    refunds: number;
    payoutNet: number;
    exceptionDelta: number;
};

type SettlementSummaryCardProps = {
    loading: boolean;
    totals: SettlementSummaryTotals;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 2,
    }).format(value);
}

export function SettlementSummaryCard({ loading, totals }: SettlementSummaryCardProps) {
    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <header className="mb-4">
                <h2 className="text-lg font-bold text-black">Daily Settlement Summary</h2>
                <p className="text-sm text-gray-500">
                    Payments, refunds, payouts, and exception deltas.
                </p>
            </header>

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                        <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                            Gross Payments
                        </p>
                        <p className="mt-2 text-xl font-bold text-emerald-900">
                            {formatCurrency(totals.gross)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4">
                        <p className="text-xs font-semibold tracking-wide text-rose-700 uppercase">
                            Refund Outflow
                        </p>
                        <p className="mt-2 text-xl font-bold text-rose-900">
                            {formatCurrency(totals.refunds)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                            Payout Net
                        </p>
                        <p className="mt-2 text-xl font-bold text-blue-900">
                            {formatCurrency(totals.payoutNet)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
                            Exception Delta
                        </p>
                        <p className="mt-2 text-xl font-bold text-amber-900">
                            {formatCurrency(totals.exceptionDelta)}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

export type { SettlementSummaryTotals };
