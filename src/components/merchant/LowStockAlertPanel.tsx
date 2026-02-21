'use client';

import { AlertTriangle } from 'lucide-react';

export type LowStockItem = {
    id: string;
    name: string;
    current_stock: number;
    reorder_level: number;
    uom: string;
};

interface LowStockAlertPanelProps {
    loading: boolean;
    items: LowStockItem[];
}

export function LowStockAlertPanel({ loading, items }: LowStockAlertPanelProps) {
    return (
        <section className="rounded-[2rem] border border-amber-200/70 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
                    <p className="text-sm text-gray-600">
                        Critical ingredients approaching reorder thresholds.
                    </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>

            {loading ? (
                <p className="mt-3 text-sm text-gray-600">Checking stock levels...</p>
            ) : items.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">
                    No low-stock items. Inventory is healthy.
                </p>
            ) : (
                <div className="mt-4 space-y-2">
                    {items.slice(0, 8).map(item => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-3 py-2"
                        >
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs font-medium text-amber-700">
                                {item.current_stock.toFixed(2)} {item.uom} / reorder{' '}
                                {item.reorder_level.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
