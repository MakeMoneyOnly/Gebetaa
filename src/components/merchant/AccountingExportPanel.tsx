import { FileText, CreditCard, Landmark, GitCompare, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DatasetKey = 'payments' | 'refunds' | 'payouts' | 'reconciliation';

type AccountingExportPanelProps = {
    exporting: DatasetKey | null;
    onExport: (dataset: DatasetKey) => Promise<void>;
};

const DATASETS: Array<{ key: DatasetKey; label: string; description: string; icon: any }> = [
    {
        key: 'payments',
        label: 'Payments',
        description: 'Method-level payment transactions.',
        icon: CreditCard,
    },
    {
        key: 'refunds',
        label: 'Refunds',
        description: 'Refund queue and processing outcomes.',
        icon: FileText,
    },
    {
        key: 'payouts',
        label: 'Payouts',
        description: 'Provider settlement windows and totals.',
        icon: Landmark,
    },
    {
        key: 'reconciliation',
        label: 'Reconciliation',
        description: 'Matched and exception entries.',
        icon: GitCompare,
    },
];

export function AccountingExportPanel({ exporting, onExport }: AccountingExportPanelProps) {
    return (
        <section className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <header>
                <h2 className="text-xl leading-tight font-bold text-gray-900">Data exports</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">
                    Download filtered finance datasets for external bookkeeping and auditing.
                </p>
            </header>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {DATASETS.map(dataset => (
                    <div
                        key={dataset.key}
                        className="group flex flex-col rounded-3xl border border-transparent bg-white p-6 shadow-xl shadow-gray-200/50 transition-all hover:border-gray-100 hover:shadow-gray-300/50"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-2xl bg-gray-50 p-3 text-gray-400 transition-all group-hover:bg-gray-900 group-hover:text-white">
                                <dataset.icon className="h-6 w-6" />
                            </div>
                            {exporting === dataset.key && (
                                <Loader2 className="text-brand-crimson h-5 w-5 animate-spin" />
                            )}
                        </div>

                        <div className="mb-6 flex-1">
                            <h3 className="text-base font-bold text-gray-900">{dataset.label}</h3>
                            <p className="mt-1 text-xs leading-relaxed font-medium text-gray-500">
                                {dataset.description}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void onExport(dataset.key)}
                            disabled={exporting !== null}
                            className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-bold tracking-wider uppercase transition-all active:scale-[0.98]',
                                exporting === dataset.key
                                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    : 'bg-gray-900 text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800'
                            )}
                        >
                            <Download className="h-3.5 w-3.5" />
                            {exporting === dataset.key ? 'Preparing...' : 'Export CSV'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6">
                <div className="flex gap-4">
                    <div className="shrink-0 rounded-2xl bg-amber-100 p-3 text-amber-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900">Compliance reminder</h4>
                        <p className="mt-1 text-xs leading-relaxed font-medium text-amber-700/80">
                            These exports contain PII. Ensure all downloaded data is stored
                            according to your local data protection policies and accounting
                            requirements in Ethiopia.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
