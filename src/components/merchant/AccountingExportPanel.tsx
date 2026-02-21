'use client';

type DatasetKey = 'payments' | 'refunds' | 'payouts' | 'reconciliation';

type AccountingExportPanelProps = {
    exporting: DatasetKey | null;
    onExport: (dataset: DatasetKey) => Promise<void>;
};

const DATASETS: Array<{ key: DatasetKey; label: string; description: string }> = [
    { key: 'payments', label: 'Payments CSV', description: 'Method-level payment transactions.' },
    { key: 'refunds', label: 'Refunds CSV', description: 'Refund queue and processing outcomes.' },
    {
        key: 'payouts',
        label: 'Payouts CSV',
        description: 'Provider settlement windows and totals.',
    },
    {
        key: 'reconciliation',
        label: 'Reconciliation CSV',
        description: 'Matched and exception reconciliation entries.',
    },
];

export function AccountingExportPanel({ exporting, onExport }: AccountingExportPanelProps) {
    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <header className="mb-4">
                <h2 className="text-lg font-bold text-black">Accounting Exports</h2>
                <p className="text-sm text-gray-500">
                    Download finance datasets for external bookkeeping.
                </p>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
                {DATASETS.map(dataset => (
                    <div
                        key={dataset.key}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                        <p className="text-sm font-semibold text-gray-900">{dataset.label}</p>
                        <p className="mt-1 mb-3 text-xs text-gray-500">{dataset.description}</p>
                        <button
                            type="button"
                            onClick={() => void onExport(dataset.key)}
                            disabled={exporting !== null}
                            className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {exporting === dataset.key ? 'Preparing...' : 'Export CSV'}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
