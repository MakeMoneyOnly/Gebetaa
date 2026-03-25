import {
    BarChart3,
    TrendingUp,
    CreditCard,
    Users,
    Landmark,
    Search,
    ArrowRight,
    Wallet,
    History,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    X,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { AppLocale } from '@/lib/i18n/locale';
import { formatETBCurrency } from '@/lib/format/et';
import { cn } from '@/lib/utils';
import { isToday, isWithinInterval, subDays, subMonths } from 'date-fns';

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
    payments: PaymentRow[] | null;
    locale: AppLocale;
};

export function PaymentMethodBreakdown({ loading, payments, locale }: PaymentMethodBreakdownProps) {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [partnersRange, setPartnersRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
    const [partnersFilterOpen, setPartnersFilterOpen] = useState(false);
    const [ledgerRange, setLedgerRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
    const [ledgerFilterOpen, setLedgerFilterOpen] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<PaymentRow | null>(null);
    const itemsPerPage = 10;

    // Helper for date filtering
    const isWithinRange = (dateStr: string, range: 'today' | 'week' | 'month' | 'all') => {
        if (range === 'all') return true;
        const date = new Date(dateStr);
        const now = new Date();

        switch (range) {
            case 'today':
                return isToday(date);
            case 'week':
                return isWithinInterval(date, { start: subDays(now, 7), end: now });
            case 'month':
                return isWithinInterval(date, { start: subMonths(now, 1), end: now });
            default:
                return true;
        }
    };

    // Derived data based on selected range for the analysis section
    // We use partnersRange for the top-level analysis and partners cards
    const effectivePayments = useMemo(() => {
        // If we have any real payments, use them exclusively
        if (payments && payments.length > 0) return payments;

        // If we are currently loading or the initial load guard is active,
        // return an empty array instead of flashing mock data
        if (loading || payments === null) return [];

        // Mock demo data for unseeded/fresh restaurants ONLY when strictly no data exists
        const now = new Date();
        const justToday = new Date().toISOString();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        return [
            {
                id: 'd1',
                method: 'cash',
                amount: 450,
                provider: 'internal',
                status: 'captured',
                created_at: justToday,
                tip_amount: 50,
            },
            {
                id: 'd2',
                method: 'cash',
                amount: 320,
                provider: 'internal',
                status: 'captured',
                created_at: justToday,
                tip_amount: 30,
            },
            {
                id: 'd3',
                method: 'chapa',
                amount: 1200,
                provider: 'chapa',
                status: 'captured',
                created_at: justToday,
                tip_amount: 0,
            },
            {
                id: 'd4',
                method: 'chapa',
                amount: 850,
                provider: 'chapa',
                status: 'captured',
                created_at: threeDaysAgo,
                tip_amount: 0,
            },
            {
                id: 'd5',
                method: 'card',
                amount: 2100,
                provider: 'internal',
                status: 'captured',
                created_at: twoWeeksAgo,
                tip_amount: 200,
            },
        ] as PaymentRow[];
    }, [payments, loading]);

    const filteredPaymentsForAnalysis = useMemo(() => {
        return effectivePayments.filter(p => isWithinRange(p.created_at, partnersRange));
    }, [effectivePayments, partnersRange]);

    const { byMethod, totalAmount } = useMemo(() => {
        return filteredPaymentsForAnalysis.reduce<{
            byMethod: Record<string, { count: number; amount: number }>;
            totalAmount: number;
        }>(
            (acc, payment) => {
                const key = payment.method || 'unknown';
                if (!acc.byMethod[key]) {
                    acc.byMethod[key] = { count: 0, amount: 0 };
                }
                const amt = Number(payment.amount ?? 0);
                acc.byMethod[key].count += 1;
                acc.byMethod[key].amount += amt;
                acc.totalAmount += amt;
                return acc;
            },
            { byMethod: {}, totalAmount: 0 }
        );
    }, [filteredPaymentsForAnalysis]);

    const methodRows = useMemo(
        () => Object.entries(byMethod).sort((a, b) => b[1].amount - a[1].amount),
        [byMethod]
    );

    const allMethods = useMemo(() => {
        const methods = effectivePayments.reduce<Record<string, number>>((acc, p) => {
            const key = p.method || 'unknown';
            acc[key] = (acc[key] || 0) + Number(p.amount ?? 0);
            return acc;
        }, {});
        return Object.entries(methods).sort((a, b) => b[1] - a[1]);
    }, [effectivePayments]);

    // Active method for details - use full list as fallback so ledger works even if top-level range is empty
    const activeMethod = selectedMethod || methodRows[0]?.[0] || allMethods[0]?.[0];

    // Filtered transactions for the ledger (using ledgerRange)
    const filteredTransactions = useMemo(() => {
        if (!activeMethod) return [];
        return effectivePayments
            .filter(
                p =>
                    p.method?.toLowerCase() === activeMethod.toLowerCase() &&
                    isWithinRange(p.created_at, ledgerRange)
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [effectivePayments, activeMethod, ledgerRange]);

    // Paginated transactions
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage]);

    // Reset page when method or range changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeMethod, ledgerRange]);

    // Dynamic Delivery Partner Data based on range
    const deliveryPartners = useMemo(() => {
        const multiplier = partnersRange === 'month' ? 30 : partnersRange === 'week' ? 7 : 1;
        return [
            {
                id: 'beu',
                name: 'BeU delivery',
                todayOrders: 3 * multiplier,
                totalTransacted: 3200 * multiplier,
                owsYou: 1250 * multiplier,
            },
            {
                id: 'deliver_addis',
                name: 'Deliver Addis',
                todayOrders: 5 * multiplier,
                totalTransacted: 7800 * multiplier,
                owsYou: 2100 * multiplier,
            },
        ];
    }, [partnersRange]);

    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-10">
            {/* Delivery Partners - Scalable Table */}
            <div className="space-y-6">
                <header className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl leading-tight font-bold text-gray-900">
                            Delivery partners
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Track outstanding balances and reconciliation states from external
                            aggregators.
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setPartnersFilterOpen(!partnersFilterOpen)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 capitalize transition-all"
                        >
                            {partnersRange === 'all' ? 'All time' : partnersRange}
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 transition-transform duration-200',
                                    partnersFilterOpen ? 'rotate-180' : ''
                                )}
                            />
                        </button>
                        {partnersFilterOpen && (
                            <div className="animate-in fade-in zoom-in-95 absolute right-0 z-20 mt-2 w-32 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 duration-100">
                                {(['today', 'week', 'month', 'all'] as const).map(option => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setPartnersRange(option);
                                            setPartnersFilterOpen(false);
                                        }}
                                        className={cn(
                                            'w-full rounded-lg px-2.5 py-2 text-left text-sm capitalize transition-colors',
                                            partnersRange === option
                                                ? 'bg-gray-100 font-bold text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        {option === 'all' ? 'All time' : option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className="rounded-4xl bg-white p-2 shadow-2xl shadow-gray-200/50">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                            <thead>
                                <tr className="text-[11px] font-bold text-gray-400">
                                    <th className="border-b border-gray-50 px-6 py-4">Partner</th>
                                    <th className="border-b border-gray-50 px-6 py-4 capitalize">
                                        {partnersRange === 'today' ? "Today's" : partnersRange}{' '}
                                        orders
                                    </th>
                                    <th className="border-b border-gray-50 px-6 py-4">
                                        Total transacted
                                    </th>
                                    <th className="border-b border-gray-50 px-6 py-4">Owes you</th>
                                    <th className="border-b border-gray-50 px-6 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {deliveryPartners.map(partner => (
                                    <tr
                                        key={partner.id}
                                        className="group transition-colors hover:bg-gray-50/50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-lg font-bold text-gray-900 transition-all group-hover:bg-white group-hover:shadow-sm">
                                                    {partner.name[0]}
                                                </div>
                                                <span className="font-bold text-gray-900">
                                                    {partner.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-500">
                                                {partner.todayOrders.toLocaleString()} orders
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-500">
                                            {formatETBCurrency(partner.totalTransacted, { locale })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-gray-900">
                                                    {formatETBCurrency(partner.owsYou, { locale })}
                                                </span>
                                                <span className="text-brand-crimson text-[10px] font-bold">
                                                    Pending reconciliation
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-black">
                                                Reconcile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Methods Section */}
            <div className="space-y-6">
                <header className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl leading-tight font-bold text-gray-900">
                            Payment analysis
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Select a payment method to view specific transaction logs and provider
                            performance.
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] leading-none font-bold text-gray-400">
                            Total volume
                        </span>
                        <span className="mt-1 text-2xl leading-none font-black tracking-tight text-gray-900">
                            {formatETBCurrency(totalAmount, { locale, compact: true })}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="h-[180px] animate-pulse rounded-4xl bg-gray-100"
                            />
                        ))
                    ) : methodRows.length === 0 ? (
                        <div className="col-span-full rounded-4xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-16 text-center">
                            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                            <p className="font-bold text-gray-400">
                                No payment data available for the selected period
                            </p>
                        </div>
                    ) : (
                        methodRows.map(([method, details]) => {
                            const isSelected = activeMethod === method;
                            const percentage =
                                totalAmount > 0 ? (details.amount / totalAmount) * 100 : 0;
                            const progressDots = Math.round(percentage / 5); // 20 dots total scale

                            return (
                                <button
                                    key={method}
                                    onClick={() => setSelectedMethod(method)}
                                    className={cn(
                                        'group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-4xl p-5 text-left transition-all',
                                        isSelected
                                            ? 'card-shadow-lg bg-white ring-2 ring-gray-900'
                                            : 'card-shadow hover:card-shadow-lg border border-gray-100 bg-white'
                                    )}
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-colors',
                                                isSelected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white text-gray-900'
                                            )}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-600">
                                                {details.count} txns
                                            </span>
                                            <div className="mt-[14px] flex flex-col items-end">
                                                <h3 className="text-4xl leading-none font-bold tracking-tight text-gray-900">
                                                    {details.amount.toLocaleString('en', {
                                                        notation: 'compact',
                                                        compactDisplay: 'short',
                                                    })}
                                                </h3>
                                                <span className="mt-1 text-xs font-bold text-gray-400">
                                                    ETB
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute right-5 bottom-5 left-5">
                                        <div className="mb-3">
                                            <h3 className="mb-1 text-lg leading-none font-bold text-gray-900 capitalize">
                                                {method}
                                            </h3>
                                            <p className="text-xs font-medium text-gray-400">
                                                Distribution: {percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-1">
                                            {Array.from({ length: 20 }).map((_, i) => {
                                                const isActive = i < progressDots;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            'h-2.5 w-2.5 rounded-full transition-all duration-500',
                                                            isActive
                                                                ? 'bg-brand-crimson'
                                                                : 'bg-gray-100'
                                                        )}
                                                        style={{
                                                            opacity: isActive
                                                                ? 0.3 +
                                                                  0.7 *
                                                                      (i /
                                                                          Math.max(progressDots, 1))
                                                                : 1,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="space-y-6">
                <header className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gray-100 p-3 text-gray-900">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Transaction ledger</h3>
                            <p className="text-sm font-medium text-gray-500">
                                Audit logs for {activeMethod || 'selected method'}
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setLedgerFilterOpen(!ledgerFilterOpen)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 capitalize transition-all"
                        >
                            {ledgerRange === 'all' ? 'All time' : ledgerRange}
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 transition-transform duration-200',
                                    ledgerFilterOpen ? 'rotate-180' : ''
                                )}
                            />
                        </button>
                        {ledgerFilterOpen && (
                            <div className="animate-in fade-in zoom-in-95 absolute right-0 z-20 mt-2 w-32 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 duration-100">
                                {(['today', 'week', 'month', 'all'] as const).map(option => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setLedgerRange(option);
                                            setLedgerFilterOpen(false);
                                        }}
                                        className={cn(
                                            'w-full rounded-lg px-2.5 py-2 text-left text-sm capitalize transition-colors',
                                            ledgerRange === option
                                                ? 'bg-gray-100 font-bold text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        {option === 'all' ? 'All time' : option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className="rounded-4xl bg-white p-2 shadow-2xl shadow-gray-200/50">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                            <thead>
                                <tr className="text-[11px] font-bold text-gray-400">
                                    <th className="border-b border-gray-50 px-6 py-4">Reference</th>
                                    <th className="border-b border-gray-50 px-6 py-4">Timestamp</th>
                                    <th className="border-b border-gray-50 px-6 py-4 text-right">
                                        Tip
                                    </th>
                                    <th className="border-b border-gray-50 px-6 py-4 text-right">
                                        Amount
                                    </th>
                                    <th className="border-b border-gray-50 px-6 py-4 text-right">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedTransactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="rounded-b-4xl bg-white px-6 py-16 text-center font-bold text-gray-400"
                                        >
                                            No recent transactions found for this method
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map(txn => (
                                        <tr
                                            key={txn.id}
                                            onClick={() => setSelectedTxn(txn)}
                                            className="group cursor-pointer transition-colors hover:bg-gray-50/50"
                                        >
                                            <td className="px-6 py-5">
                                                <span className="text-[13px] font-bold tracking-tight text-gray-900">
                                                    {txn.id.slice(0, 16).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {new Date(txn.created_at).toLocaleTimeString(
                                                        [],
                                                        { hour: '2-digit', minute: '2-digit' }
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-xs font-bold text-emerald-600">
                                                    +
                                                    {formatETBCurrency(
                                                        Number(txn.tip_amount ?? 0),
                                                        { locale }
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-black text-gray-900">
                                                    {formatETBCurrency(Number(txn.amount ?? 0), {
                                                        locale,
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-tighter capitalize',
                                                        txn.status === 'captured'
                                                            ? 'bg-emerald-100 font-black text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    )}
                                                >
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls - Always show if we have many total transactions to hint at pagination */}
                    {filteredTransactions.length > itemsPerPage && (
                        <div className="flex items-center justify-between border-t border-gray-50 px-6 py-4">
                            <div className="text-xs font-bold text-gray-400">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}{' '}
                                of {filteredTransactions.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                'h-1.5 w-1.5 rounded-full transition-all',
                                                currentPage === i + 1
                                                    ? 'w-6 bg-gray-900'
                                                    : 'bg-gray-200'
                                            )}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {selectedTxn && (
                <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="animate-in zoom-in-95 slide-in-from-bottom-5 relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl transition-all duration-300">
                        <header className="mb-8 flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-900">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-gray-900">
                                        Transaction Details
                                    </h2>
                                </div>
                                <p className="text-xs font-bold text-gray-400">
                                    Ref: {selectedTxn.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTxn(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="grid grid-cols-2 gap-6 border-b border-gray-50 pb-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400">
                                    Amount
                                </label>
                                <p className="text-2xl font-black text-gray-900">
                                    {formatETBCurrency(selectedTxn.amount, {
                                        locale,
                                        compact: false,
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <label className="text-[10px] font-black text-gray-400">
                                    Status
                                </label>
                                <div>
                                    <span
                                        className={cn(
                                            'inline-flex items-center rounded-lg px-3 py-1 text-xs font-black capitalize',
                                            selectedTxn.status === 'captured'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        )}
                                    >
                                        {selectedTxn.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 py-8">
                            <div>
                                <label className="mb-1 block text-[10px] font-black text-gray-400">
                                    Payment method
                                </label>
                                <span className="flex items-center gap-2 text-sm font-bold text-gray-900 capitalize">
                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-900" />
                                    {selectedTxn.method}
                                </span>
                            </div>
                            <div className="text-right">
                                <label className="mb-1 block text-[10px] font-black text-gray-400">
                                    Provider
                                </label>
                                <span className="text-sm font-bold text-gray-900 capitalize">
                                    {selectedTxn.provider}
                                </span>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-black text-gray-400">
                                    Timestamp
                                </label>
                                <span className="text-sm font-bold text-gray-900">
                                    {new Date(selectedTxn.created_at).toLocaleString([], {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </span>
                            </div>
                            <div className="text-right">
                                <label className="mb-1 block text-[10px] font-black text-gray-400">
                                    Tip amount
                                </label>
                                <span className="text-sm font-bold text-emerald-600">
                                    {formatETBCurrency(selectedTxn.tip_amount, {
                                        locale,
                                        compact: false,
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={() => setSelectedTxn(null)}
                                className="h-14 w-full rounded-2xl bg-gray-900 text-sm font-bold text-white shadow-xl shadow-gray-200 transition-all hover:bg-black active:scale-[0.98]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
