'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { TableSummary } from '@/lib/services/dashboardDataService';

interface TablesPageClientProps {
    initialData: {
        tables: TableSummary[];
        restaurant_id: string;
    } | null;
}

function statusColor(status: string) {
    switch (status) {
        case 'available':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
        case 'occupied':
            return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
        case 'reserved':
            return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60';
        case 'cleaning':
            return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60';
        default:
            return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60';
    }
}

export function TablesPageClient({ initialData }: TablesPageClientProps) {
    const { markLoaded } = usePageLoadGuard('tables');

    // Initialize state with server data - NO loading flash!
    const [tables, setTables] = useState<TableSummary[]>(initialData?.tables ?? []);
    const [selectedTable, setSelectedTable] = useState<TableSummary | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const restaurantId = initialData?.restaurant_id;

    // Mark loaded after initial render
    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    // Refresh data from server
    const refreshData = useCallback(async () => {
        if (!restaurantId) return;

        setRefreshing(true);
        try {
            const response = await fetch('/api/tables');
            const result = await response.json();

            if (response.ok) {
                setTables(result.data?.tables ?? []);
            }
        } catch (error) {
            console.error('Failed to refresh tables:', error);
            toast.error('Failed to refresh tables');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId]);

    // Handle table status update
    const handleStatusUpdate = useCallback(
        async (tableId: string, newStatus: string) => {
            // Optimistic update
            setTables(prev => prev.map(t => (t.id === tableId ? { ...t, status: newStatus } : t)));

            try {
                const response = await fetch(`/api/tables/${tableId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update table status');
                }

                toast.success('Table status updated');
            } catch (error) {
                // Revert on error
                setTables(prev =>
                    prev.map(t =>
                        t.id === tableId
                            ? {
                                  ...t,
                                  status:
                                      initialData?.tables.find(it => it.id === tableId)?.status ??
                                      t.status,
                              }
                            : t
                    )
                );
                toast.error('Failed to update table status');
            }
        },
        [initialData?.tables]
    );

    // Calculate stats
    const stats = useMemo(() => {
        const total = tables.length;
        const available = tables.filter(t => t.status === 'available' && t.is_active).length;
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const reserved = tables.filter(t => t.status === 'reserved').length;
        const inactive = tables.filter(t => !t.is_active).length;

        return { total, available, occupied, reserved, inactive };
    }, [tables]);

    return (
        <div className="min-h-screen space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Tables</h1>
                    <p className="font-medium text-gray-500">
                        Manage restaurant tables and seating.
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">Available</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.available}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-sm font-medium text-amber-600">Occupied</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.occupied}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <p className="text-sm font-medium text-blue-600">Reserved</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.reserved}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {tables.map(table => (
                    <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={cn(
                            'rounded-2xl p-4 text-left transition-all',
                            table.is_active
                                ? 'bg-white shadow-sm ring-1 ring-gray-100 hover:ring-2 hover:ring-gray-200'
                                : 'bg-gray-50 opacity-60 ring-1 ring-gray-200'
                        )}
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                                {table.table_number}
                            </span>
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                    statusColor(table.status)
                                )}
                            >
                                {table.status}
                            </span>
                        </div>
                        {table.capacity && (
                            <p className="text-sm text-gray-500">Seats: {table.capacity}</p>
                        )}
                    </button>
                ))}
            </div>

            {/* Selected Table Panel */}
            {selectedTable && (
                <div className="fixed right-0 bottom-0 left-0 rounded-t-3xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                            Table {selectedTable.table_number}
                        </h3>
                        <button
                            onClick={() => setSelectedTable(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            Close
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {['available', 'occupied', 'reserved', 'cleaning'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusUpdate(selectedTable.id, status)}
                                className={cn(
                                    'rounded-xl px-4 py-2 text-sm font-bold capitalize',
                                    selectedTable.status === status
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
