'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { TableSummary } from '@/lib/services/dashboardDataService';
import { submitTableStatusUpdate } from '@/lib/tables/session-adapter';

interface TablesPageClientProps {
    initialData: {
        tables: TableSummary[];
        restaurant_id: string;
    } | null;
}

function statusColor(status: string) {
    switch (status) {
        case 'available':
            return 'bg-state-success-bg/30 text-state-success ring-1 ring-state-success/10';
        case 'occupied':
            return 'bg-state-warning-bg/30 text-state-warning ring-1 ring-state-warning/10';
        case 'reserved':
            return 'bg-state-info-bg/30 text-state-info ring-1 ring-state-info/10';
        case 'cleaning':
            return 'bg-brand-canvas-alt text-brand-neutral ring-1 ring-brand-neutral/10';
        default:
            return 'bg-brand-canvas text-brand-neutral ring-1 ring-brand-neutral-soft/10';
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
                const result = await submitTableStatusUpdate({
                    restaurantId: restaurantId ?? '',
                    tableId,
                    status: newStatus as 'available' | 'occupied' | 'reserved' | 'cleaning',
                });

                if (!result.ok) {
                    throw new Error(result.error ?? 'Failed to update table status');
                }

                toast.success('Table status updated');
            } catch (_error) {
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
        [initialData?.tables, restaurantId]
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
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h1 className="text-brand-ink-strong text-5xl font-bold tracking-tight">
                        Tables
                    </h1>
                    <p className="text-body text-brand-neutral mt-2 font-medium">
                        Manage restaurant floor, seating capacity and real-time status.
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="bg-brand-canvas-alt text-body-sm text-brand-ink hover:bg-brand-neutral-soft/10 flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                    {refreshing ? 'Syncing...' : 'Refresh'}
                </button>
            </div>

            {/* Stats - Unified Pattern */}
            <div className="divide-brand-neutral-soft/10 flex w-full divide-x py-8">
                {[
                    { label: 'Total', value: stats.total, color: 'text-brand-ink' },
                    { label: 'Available', value: stats.available, color: 'text-state-success' },
                    { label: 'Occupied', value: stats.occupied, color: 'text-state-warning' },
                    { label: 'Reserved', value: stats.reserved, color: 'text-state-info' },
                    { label: 'Inactive', value: stats.inactive, color: 'text-brand-neutral-soft' },
                ].map((stat, idx) => (
                    <div key={idx} className="flex-1 px-8 first:pl-10 last:pr-10">
                        <p className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                            {stat.label}
                        </p>
                        <p className={cn('mt-1 text-4xl font-black tracking-tight', stat.color)}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {tables.map(table => (
                    <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={cn(
                            'group relative rounded-4xl p-6 text-left transition-all hover:scale-105 active:scale-95',
                            table.is_active
                                ? 'shadow-soft ring-brand-neutral-soft/5 hover:shadow-medium hover:ring-brand-accent bg-white ring-1'
                                : 'bg-brand-canvas-alt ring-brand-neutral-soft/10 opacity-50 ring-1'
                        )}
                    >
                        <div className="mb-3 flex items-start justify-between">
                            <span className="text-brand-ink group-hover:text-brand-ink-strong text-2xl font-black tracking-tight">
                                {table.table_number}
                            </span>
                            <span
                                className={cn(
                                    'text-micro rounded-full px-2 py-0.5 font-bold tracking-wider uppercase ring-1',
                                    statusColor(table.status)
                                )}
                            >
                                {table.status}
                            </span>
                        </div>
                        {table.capacity && (
                            <p className="text-body-sm text-brand-neutral font-medium">
                                Seats: {table.capacity}
                            </p>
                        )}
                    </button>
                ))}
            </div>

            {/* Selected Table Panel */}
            {selectedTable && (
                <div className="bg-brand-ink/40 fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-4 backdrop-blur-sm">
                    <div className="animate-in slide-in-from-bottom-5 shadow-strong ring-brand-neutral-soft/10 w-full max-w-2xl rounded-4xl bg-white p-8 ring-1">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-brand-ink text-2xl font-black tracking-tight">
                                    Table {selectedTable.table_number}
                                </h3>
                                <p className="text-body-sm text-brand-neutral mt-1 font-medium">
                                    Capacity: {selectedTable.capacity} · Current status:{' '}
                                    <span className="capitalize">{selectedTable.status}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="bg-brand-canvas-alt text-brand-neutral hover:bg-brand-canvas-alt hover:text-brand-ink flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['available', 'occupied', 'reserved', 'cleaning'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(selectedTable.id, status)}
                                    className={cn(
                                        'text-body-sm rounded-2xl px-5 py-4 font-black tracking-wider uppercase transition-all',
                                        selectedTable.status === status
                                            ? 'bg-brand-ink shadow-medium text-white'
                                            : 'bg-brand-canvas-alt text-brand-neutral hover:bg-brand-neutral-soft/10 hover:text-brand-ink'
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
