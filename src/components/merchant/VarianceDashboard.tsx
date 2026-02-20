'use client';

import { TrendingUp } from 'lucide-react';

export type VarianceRow = {
    item_id: string;
    item_name: string;
    uom: string;
    current_stock: number;
    theoretical_stock: number;
    variance_qty: number;
    variance_value: number;
    waste_qty: number;
    waste_value: number;
    reorder_level: number;
    low_stock: boolean;
};

export type VarianceTotals = {
    items: number;
    low_stock_items: number;
    total_waste_value: number;
    total_variance_value: number;
};

interface VarianceDashboardProps {
    loading: boolean;
    rows: VarianceRow[];
    totals: VarianceTotals | null;
}

export function VarianceDashboard({ loading, rows, totals }: VarianceDashboardProps) {
    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Variance Dashboard</h3>
                    <p className="text-sm text-gray-500">Review expected vs actual stock, waste value, and variance exposure.</p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-500" />
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Calculating variance insights...</p>
            ) : rows.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No variance data yet.</p>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Tracked Items</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{totals?.items ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-amber-700">Low Stock</p>
                            <p className="mt-1 text-xl font-bold text-amber-700">{totals?.low_stock_items ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-rose-700">Waste Value (ETB)</p>
                            <p className="mt-1 text-xl font-bold text-rose-700">{(totals?.total_waste_value ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                            <p className="text-xs uppercase tracking-wide text-blue-700">Net Variance (ETB)</p>
                            <p className="mt-1 text-xl font-bold text-blue-700">{(totals?.total_variance_value ?? 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <caption className="sr-only">Inventory variance details</caption>
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                                    <th scope="col" className="py-2 pr-3">Item</th>
                                    <th scope="col" className="py-2 pr-3">Actual</th>
                                    <th scope="col" className="py-2 pr-3">Theoretical</th>
                                    <th scope="col" className="py-2 pr-3">Variance</th>
                                    <th scope="col" className="py-2 pr-3">Waste</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.item_id} className="border-b border-gray-50">
                                        <th scope="row" className="py-3 pr-3 text-left font-semibold text-gray-900">
                                            {row.item_name}
                                            <p className="text-xs font-medium text-gray-500">{row.uom}</p>
                                        </th>
                                        <td className="py-3 pr-3 text-gray-800">{row.current_stock.toFixed(2)}</td>
                                        <td className="py-3 pr-3 text-gray-800">{row.theoretical_stock.toFixed(2)}</td>
                                        <td className="py-3 pr-3">
                                            <span className={row.variance_qty >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                                                {row.variance_qty.toFixed(2)} ({row.variance_value.toFixed(2)} ETB)
                                            </span>
                                        </td>
                                        <td className="py-3 pr-3 text-rose-700">
                                            {row.waste_qty.toFixed(2)} ({row.waste_value.toFixed(2)} ETB)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
