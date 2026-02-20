'use client';

import { useState } from 'react';
import { Archive, Loader2 } from 'lucide-react';

export type InventoryItemRow = {
    id: string;
    name: string;
    sku: string | null;
    uom: string;
    current_stock: number;
    reorder_level: number;
    cost_per_unit: number;
    is_active: boolean;
};

interface InventoryTableProps {
    items: InventoryItemRow[];
    loading: boolean;
    creating: boolean;
    movementSubmittingId: string | null;
    onCreateItem: (payload: {
        name: string;
        sku?: string;
        uom: string;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }) => Promise<void>;
    onCreateMovement: (payload: {
        inventory_item_id: string;
        movement_type: 'in' | 'out' | 'waste';
        qty: number;
        reason: string;
    }) => Promise<void>;
}

export function InventoryTable({
    items,
    loading,
    creating,
    movementSubmittingId,
    onCreateItem,
    onCreateMovement,
}: InventoryTableProps) {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [uom, setUom] = useState('kg');
    const [currentStock, setCurrentStock] = useState('0');
    const [reorderLevel, setReorderLevel] = useState('5');
    const [costPerUnit, setCostPerUnit] = useState('0');
    const [movementByItemId, setMovementByItemId] = useState<Record<string, { qty: string; reason: string }>>({});

    const submitCreate = async () => {
        const stock = Number(currentStock);
        const reorder = Number(reorderLevel);
        const cost = Number(costPerUnit);
        if (!name.trim() || !Number.isFinite(stock) || !Number.isFinite(reorder) || !Number.isFinite(cost)) return;

        await onCreateItem({
            name: name.trim(),
            ...(sku.trim() ? { sku: sku.trim().toUpperCase() } : {}),
            uom: uom.trim() || 'unit',
            current_stock: stock,
            reorder_level: reorder,
            cost_per_unit: cost,
        });

        setName('');
        setSku('');
        setCurrentStock('0');
        setReorderLevel('5');
        setCostPerUnit('0');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Inventory Table</h3>
                    <p className="text-sm text-gray-500">Track ingredient stock, reorder levels, and quick stock updates.</p>
                </div>
                <Archive className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Item name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder="SKU"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={uom}
                    onChange={(event) => setUom(event.target.value)}
                    placeholder="UOM"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={currentStock}
                    onChange={(event) => setCurrentStock(event.target.value)}
                    inputMode="decimal"
                    placeholder="Opening stock"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={reorderLevel}
                    onChange={(event) => setReorderLevel(event.target.value)}
                    inputMode="decimal"
                    placeholder="Reorder level"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <div className="flex gap-2">
                    <input
                        value={costPerUnit}
                        onChange={(event) => setCostPerUnit(event.target.value)}
                        inputMode="decimal"
                        placeholder="Cost/UOM"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={submitCreate}
                        disabled={creating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Add
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading inventory...</p>
            ) : items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No inventory items yet.</p>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <caption className="sr-only">Inventory stock and quick adjustment table</caption>
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                                <th scope="col" className="py-2 pr-3">Item</th>
                                <th scope="col" className="py-2 pr-3">Stock</th>
                                <th scope="col" className="py-2 pr-3">Reorder</th>
                                <th scope="col" className="py-2 pr-3">Cost</th>
                                <th scope="col" className="py-2 pr-3">Movements</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const movementState = movementByItemId[item.id] ?? { qty: '', reason: '' };
                                const isLow = item.current_stock <= item.reorder_level;
                                return (
                                    <tr key={item.id} className="border-b border-gray-50 align-top">
                                        <th scope="row" className="py-3 pr-3 text-left font-semibold text-gray-900">
                                            {item.name}
                                            <p className="text-xs font-medium text-gray-500">{item.sku ?? 'No SKU'} · {item.uom}</p>
                                        </th>
                                        <td className="py-3 pr-3">
                                            <span className={isLow ? 'font-semibold text-amber-700' : 'font-semibold text-gray-800'}>
                                                {item.current_stock.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-3 text-gray-700">{item.reorder_level.toFixed(2)}</td>
                                        <td className="py-3 pr-3 text-gray-700">{item.cost_per_unit.toFixed(2)}</td>
                                        <td className="py-3 pr-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    value={movementState.qty}
                                                    onChange={(event) =>
                                                        setMovementByItemId((previous) => ({
                                                            ...previous,
                                                            [item.id]: { ...movementState, qty: event.target.value },
                                                        }))
                                                    }
                                                    inputMode="decimal"
                                                    placeholder="Qty"
                                                    className="h-8 w-20 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-gray-400"
                                                />
                                                <input
                                                    value={movementState.reason}
                                                    onChange={(event) =>
                                                        setMovementByItemId((previous) => ({
                                                            ...previous,
                                                            [item.id]: { ...movementState, reason: event.target.value },
                                                        }))
                                                    }
                                                    placeholder="Reason"
                                                    className="h-8 w-32 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-gray-400"
                                                />
                                                {(['in', 'out', 'waste'] as const).map((movementType) => (
                                                    <button
                                                        key={movementType}
                                                        type="button"
                                                        disabled={movementSubmittingId === item.id}
                                                        onClick={() => {
                                                            const qty = Number(movementState.qty);
                                                            if (!Number.isFinite(qty) || qty <= 0 || !movementState.reason.trim()) return;
                                                            void onCreateMovement({
                                                                inventory_item_id: item.id,
                                                                movement_type: movementType,
                                                                qty,
                                                                reason: movementState.reason.trim(),
                                                            });
                                                        }}
                                                        className="h-8 rounded-lg border border-gray-200 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-700 disabled:opacity-50"
                                                    >
                                                        {movementType}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
