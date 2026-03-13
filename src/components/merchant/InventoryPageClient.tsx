'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { InventoryPageData, InventoryItemSummary, PurchaseOrderSummary } from '@/lib/services/dashboardDataService';

interface InventoryPageClientProps {
    initialData: InventoryPageData | null;
}

export function InventoryPageClient({ initialData }: InventoryPageClientProps) {
    const { markLoaded } = usePageLoadGuard('inventory');

    const [items, setItems] = useState<InventoryItemSummary[]>(initialData?.items ?? []);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>(initialData?.purchase_orders ?? []);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'items' | 'orders'>('items');

    const restaurantId = initialData?.restaurant_id;

    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    const refreshData = useCallback(async () => {
        if (!restaurantId) return;
        setRefreshing(true);
        try {
            const response = await fetch('/api/inventory');
            const result = await response.json();
            if (response.ok) {
                setItems(result.data?.items ?? []);
                setPurchaseOrders(result.data?.purchase_orders ?? []);
            }
        } catch (error) {
            console.error('Failed to refresh inventory:', error);
            toast.error('Failed to refresh inventory');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId]);

    const lowStockItems = items.filter(i => i.current_stock <= i.reorder_level);
    const stats = {
        totalItems: items.length,
        lowStock: lowStockItems.length,
        pendingOrders: purchaseOrders.filter(po => po.status === 'pending' || po.status === 'submitted').length,
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Inventory</h1>
                    <p className="font-medium text-gray-500">Manage inventory items and purchase orders.</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <p className="text-sm font-medium text-red-600">Low Stock</p>
                    <p className="text-2xl font-bold text-red-700">{stats.lowStock}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-sm font-medium text-amber-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.pendingOrders}</p>
                </div>
            </div>

            {lowStockItems.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 font-bold text-red-800">Low Stock Alerts</h3>
                    <div className="flex flex-wrap gap-2">
                        {lowStockItems.slice(0, 5).map(item => (
                            <span key={item.id} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-red-700">
                                {item.name}: {item.current_stock} {item.uom}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                {(['items', 'orders'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'rounded-xl px-4 py-2 text-sm font-bold capitalize',
                            activeTab === tab
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                    >
                        {tab === 'items' ? 'Inventory Items' : 'Purchase Orders'}
                    </button>
                ))}
            </div>

            {activeTab === 'items' && (
                <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-gray-100 bg-gray-50/60">
                                <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                    <th className="px-5 py-4">Name</th>
                                    <th className="px-5 py-4">SKU</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Reorder Level</th>
                                    <th className="px-5 py-4">Cost/Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-gray-500">No inventory items</td>
                                    </tr>
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{item.sku ?? 'N/A'}</td>
                                            <td className="px-5 py-4">
                                                <span className={cn(
                                                    'text-sm font-bold',
                                                    item.current_stock <= item.reorder_level ? 'text-red-600' : 'text-gray-900'
                                                )}>
                                                    {item.current_stock} {item.uom}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{item.reorder_level} {item.uom}</td>
                                            <td className="px-5 py-4 text-sm text-gray-900">{item.cost_per_unit.toLocaleString()} ETB</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-gray-100 bg-gray-50/60">
                                <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                    <th className="px-5 py-4">PO Number</th>
                                    <th className="px-5 py-4">Supplier</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Amount</th>
                                    <th className="px-5 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-gray-500">No purchase orders</td>
                                    </tr>
                                ) : (
                                    purchaseOrders.map(po => (
                                        <tr key={po.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900">{po.po_number ?? 'N/A'}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{po.supplier_name}</td>
                                            <td className="px-5 py-4">
                                                <span className={cn(
                                                    'rounded-full px-2 py-1 text-xs font-bold',
                                                    po.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                                                    po.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-600'
                                                )}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900">{po.total_amount.toLocaleString()} {po.currency}</td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{new Date(po.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}