import type { AppLocale } from '@/lib/i18n/locale';
import { formatETBCurrency } from '@/lib/format/et';
import { Wallet, RefreshCcw, Landmark, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/merchant/MetricCard';

type SettlementSummaryTotals = {
    gross: number;
    refunds: number;
    payoutNet: number;
    exceptionDelta: number;
};

type SettlementSummaryCardProps = {
    loading: boolean;
    totals: SettlementSummaryTotals;
    locale: AppLocale;
};

export function SettlementSummaryCard({ loading, totals, locale }: SettlementSummaryCardProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="card-shadow min-h-[180px] animate-pulse rounded-4xl bg-white p-5"
                    >
                        <div className="h-4 w-28 rounded bg-gray-100" />
                        <div className="mt-3 h-3 w-20 rounded bg-gray-100" />
                        <div className="mt-8 h-8 w-full rounded bg-gray-100" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={Wallet}
                chip="Gross"
                value={formatETBCurrency(totals.gross, { locale, compact: true })}
                label="Gross Payments"
                subLabel="Total funds captured"
                tone="green"
                progress={15}
                targetLabel="Target: N/A"
                currentLabel="Current"
            />
            <MetricCard
                icon={RefreshCcw}
                chip="Refunds"
                value={formatETBCurrency(totals.refunds, { locale, compact: true })}
                label="Refund Outflow"
                subLabel="Total funds returned"
                tone="rose"
                progress={5}
                targetLabel="Target: N/A"
                currentLabel="Current"
            />
            <MetricCard
                icon={Landmark}
                chip="Payout"
                value={formatETBCurrency(totals.payoutNet, { locale, compact: true })}
                label="Payout Net"
                subLabel="Expected settlement"
                tone="blue"
                progress={12}
                targetLabel="Target: N/A"
                currentLabel="Current"
            />
            <MetricCard
                icon={AlertTriangle}
                chip="Exceptions"
                value={formatETBCurrency(totals.exceptionDelta, { locale, compact: true })}
                label="Exception Delta"
                subLabel="Failed or disputed amounts"
                tone="amber"
                progress={2}
                targetLabel="Target: N/A"
                currentLabel="Current"
            />
        </div>
    );
}

export type { SettlementSummaryTotals };
