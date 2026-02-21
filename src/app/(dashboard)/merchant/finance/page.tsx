'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Landmark } from 'lucide-react';
import { AccountingExportPanel } from '@/components/merchant/AccountingExportPanel';
import {
    PaymentMethodBreakdown,
    type PaymentRow,
} from '@/components/merchant/PaymentMethodBreakdown';
import {
    PayoutReconciliationTable,
    type PayoutRow,
    type ReconciliationRow,
} from '@/components/merchant/PayoutReconciliationTable';
import { RefundQueue, type RefundRow } from '@/components/merchant/RefundQueue';
import {
    SettlementSummaryCard,
    type SettlementSummaryTotals,
} from '@/components/merchant/SettlementSummaryCard';
import { useAppLocale } from '@/hooks/useAppLocale';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { getP2Copy } from '@/lib/i18n/p2';

type DatasetKey = 'payments' | 'refunds' | 'payouts' | 'reconciliation';

export default function FinancePage() {
    const locale = useAppLocale();
    const copy = getP2Copy(locale);
    const { loading, markLoaded } = usePageLoadGuard('finance');
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [refunds, setRefunds] = useState<RefundRow[]>([]);
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);
    const [reconciliationEntries, setReconciliationEntries] = useState<ReconciliationRow[]>([]);
    const [creatingRefund, setCreatingRefund] = useState(false);
    const [exporting, setExporting] = useState<DatasetKey | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    const [paymentsTotals, setPaymentsTotals] = useState<{ gross: number }>({ gross: 0 });
    const [refundsTotals, setRefundsTotals] = useState<{ total_amount: number }>({
        total_amount: 0,
    });
    const [payoutsTotals, setPayoutsTotals] = useState<{ net: number }>({ net: 0 });
    const [exceptionsSummary, setExceptionsSummary] = useState<{ total_delta: number }>({
        total_delta: 0,
    });

    const loadAll = useCallback(async () => {
        try {
            setError(null);
            const [paymentsRes, refundsRes, payoutsRes, reconciliationRes, exceptionsRes] =
                await Promise.all([
                    fetch('/api/finance/payments?limit=200', { method: 'GET', cache: 'no-store' }),
                    fetch('/api/finance/refunds?limit=200', { method: 'GET', cache: 'no-store' }),
                    fetch('/api/finance/payouts?limit=200', { method: 'GET', cache: 'no-store' }),
                    fetch('/api/finance/reconciliation?limit=200', {
                        method: 'GET',
                        cache: 'no-store',
                    }),
                    fetch('/api/finance/exceptions?limit=200', {
                        method: 'GET',
                        cache: 'no-store',
                    }),
                ]);

            const [
                paymentsPayload,
                refundsPayload,
                payoutsPayload,
                reconciliationPayload,
                exceptionsPayload,
            ] = await Promise.all([
                paymentsRes.json(),
                refundsRes.json(),
                payoutsRes.json(),
                reconciliationRes.json(),
                exceptionsRes.json(),
            ]);

            if (!paymentsRes.ok) {
                throw new Error(paymentsPayload?.error ?? 'Failed to load payments.');
            }
            if (!refundsRes.ok) {
                throw new Error(refundsPayload?.error ?? 'Failed to load refunds.');
            }
            if (!payoutsRes.ok) {
                throw new Error(payoutsPayload?.error ?? 'Failed to load payouts.');
            }
            if (!reconciliationRes.ok) {
                throw new Error(reconciliationPayload?.error ?? 'Failed to load reconciliation.');
            }
            if (!exceptionsRes.ok) {
                throw new Error(exceptionsPayload?.error ?? 'Failed to load exceptions.');
            }

            setPayments((paymentsPayload?.data?.payments ?? []) as PaymentRow[]);
            setRefunds((refundsPayload?.data?.refunds ?? []) as RefundRow[]);
            setPayouts((payoutsPayload?.data?.payouts ?? []) as PayoutRow[]);
            setReconciliationEntries(
                (reconciliationPayload?.data?.entries ?? []) as ReconciliationRow[]
            );

            setPaymentsTotals({ gross: Number(paymentsPayload?.data?.totals?.gross ?? 0) });
            setRefundsTotals({
                total_amount: Number(refundsPayload?.data?.totals?.total_amount ?? 0),
            });
            setPayoutsTotals({ net: Number(payoutsPayload?.data?.totals?.net ?? 0) });
            setExceptionsSummary({
                total_delta: Number(exceptionsPayload?.data?.summary?.total_delta ?? 0),
            });
        } catch (loadError) {
            console.error(loadError);
            const message =
                loadError instanceof Error ? loadError.message : 'Failed to load finance data.';
            setError(message);
            setPayments([]);
            setRefunds([]);
            setPayouts([]);
            setReconciliationEntries([]);
            setPaymentsTotals({ gross: 0 });
            setRefundsTotals({ total_amount: 0 });
            setPayoutsTotals({ net: 0 });
            setExceptionsSummary({ total_delta: 0 });
        } finally {
            markLoaded();
        }
    }, [markLoaded]);

    useEffect(() => {
        void loadAll();
    }, [loadAll, refreshToken]);

    const refresh = () => setRefreshToken(value => value + 1);

    const settlementTotals = useMemo<SettlementSummaryTotals>(
        () => ({
            gross: paymentsTotals.gross,
            refunds: refundsTotals.total_amount,
            payoutNet: payoutsTotals.net,
            exceptionDelta: exceptionsSummary.total_delta,
        }),
        [
            exceptionsSummary.total_delta,
            paymentsTotals.gross,
            payoutsTotals.net,
            refundsTotals.total_amount,
        ]
    );

    const handleCreateRefund = async (payload: {
        payment_reference: string;
        amount: number;
        reason: string;
    }) => {
        try {
            setCreatingRefund(true);
            const response = await fetch('/api/finance/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to submit refund.');
            }
            toast.success('Refund request submitted.');
            refresh();
        } catch (refundError) {
            toast.error(
                refundError instanceof Error ? refundError.message : 'Failed to submit refund.'
            );
        } finally {
            setCreatingRefund(false);
        }
    };

    const handleExport = async (dataset: DatasetKey) => {
        try {
            setExporting(dataset);
            const response = await fetch(`/api/finance/export?dataset=${dataset}&format=csv`, {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.error ?? 'Failed to export finance dataset.');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${dataset}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            toast.success(`${dataset} export downloaded.`);
        } catch (exportError) {
            toast.error(
                exportError instanceof Error ? exportError.message : 'Failed to export dataset.'
            );
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                    {copy.finance.title}
                </h1>
                <p className="font-medium text-gray-500">{copy.finance.subtitle}</p>
            </div>

            <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Landmark className="h-4 w-4 text-blue-600" />
                    {copy.finance.operationsCenter}
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <SettlementSummaryCard loading={loading} totals={settlementTotals} locale={locale} />

            <div className="grid gap-6 xl:grid-cols-2">
                <PaymentMethodBreakdown loading={loading} payments={payments} locale={locale} />
                <RefundQueue
                    loading={loading}
                    creating={creatingRefund}
                    refunds={refunds}
                    payments={payments}
                    onCreateRefund={handleCreateRefund}
                    locale={locale}
                />
            </div>

            <PayoutReconciliationTable
                loading={loading}
                payouts={payouts}
                reconciliationEntries={reconciliationEntries}
                locale={locale}
            />

            <AccountingExportPanel exporting={exporting} onExport={handleExport} />
        </div>
    );
}
