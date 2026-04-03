'use client';

import React from 'react';
import { Edit2, Plus, QrCode, RefreshCcw, Trash2 } from 'lucide-react';

export type TableGridRow = {
    id: string;
    table_number: string;
    status: 'available' | 'occupied' | 'reserved' | 'bill_requested';
    qr_code_url: string | null;
    active_order_id: string | null;
    zone: string | null;
    capacity: number;
};

interface TableGridProps {
    tables: TableGridRow[];
    isLoading?: boolean;
    onAddTable: () => void;
    onEditTable: (table: TableGridRow) => void;
    onDeleteTable: (table: TableGridRow) => void;
    onShowQR: (table: TableGridRow) => void;
    onRefreshTable: (table: TableGridRow) => void;
}

const _getStatusColor = (status: TableGridRow['status']) => {
    switch (status) {
        case 'available':
            return 'bg-state-success-bg/30 text-state-success ring-1 ring-state-success/10';
        case 'occupied':
            return 'bg-state-warning-bg/30 text-state-warning ring-1 ring-state-warning/10';
        case 'reserved':
            return 'bg-state-info-bg/30 text-state-info ring-1 ring-state-info/10';
        case 'bill_requested':
            return 'bg-brand-ink text-white shadow-medium';
        default:
            return 'bg-brand-canvas text-brand-neutral ring-1 ring-brand-neutral-soft/10';
    }
};

export function TableGrid({
    tables,
    isLoading = false,
    onAddTable,
    onEditTable,
    onDeleteTable,
    onShowQR,
    onRefreshTable,
}: TableGridProps) {
    if (isLoading && tables.length === 0) {
        return (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={index}
                        className="shadow-soft min-h-[240px] animate-pulse rounded-4xl bg-white p-6"
                    >
                        <div className="bg-brand-canvas-alt h-6 w-20 rounded-full" />
                        <div className="bg-brand-canvas-alt mx-auto mt-10 h-16 w-20 rounded-2xl" />
                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <div className="bg-brand-canvas-alt h-10 rounded-xl" />
                            <div className="bg-brand-canvas-alt h-10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!isLoading && tables.length === 0) {
        return (
            <div className="border-brand-neutral-soft/20 bg-brand-canvas shadow-soft rounded-4xl border border-dashed p-16 text-center">
                <p className="text-brand-ink text-xl font-black tracking-tight">No tables found.</p>
                <p className="text-body-sm text-brand-neutral mt-2 font-medium">
                    Create your first table to start seating guests and generating revenue.
                </p>
                <button
                    onClick={onAddTable}
                    className="bg-brand-accent text-body-sm text-brand-ink-strong shadow-soft mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-8 font-bold transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Add Table
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
            {tables.map(table => (
                <div
                    key={table.id}
                    className="group shadow-soft ring-brand-neutral-soft/5 relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-4xl bg-white p-7 ring-1"
                >
                    <div className="relative z-10 flex items-start justify-end">
                        <div className="flex items-center gap-1.5 transition-all duration-300">
                            <button
                                onClick={() => onEditTable(table)}
                                className="bg-brand-canvas-alt text-brand-neutral hover:bg-brand-neutral-soft/10 hover:text-brand-ink flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDeleteTable(table)}
                                className="bg-brand-canvas-alt text-brand-neutral hover:bg-state-danger-bg/20 hover:text-state-danger flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10 my-6 flex flex-col items-center justify-center">
                        <span className="text-brand-neutral text-micro mb-1 font-bold tracking-widest">
                            Table
                        </span>
                        <div
                            className="text-brand-ink text-7xl font-black tracking-tighter"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {table.table_number}
                        </div>
                    </div>

                    <div className="border-brand-neutral-soft/5 relative z-10 mt-auto grid grid-cols-2 gap-3 border-t pt-5">
                        <button
                            onClick={() => onShowQR(table)}
                            className="bg-brand-accent text-body-xs text-brand-ink-strong shadow-medium flex h-11 items-center justify-center gap-2 rounded-xl font-bold transition-all"
                        >
                            <QrCode className="h-4 w-4" />
                            QR
                        </button>
                        <button
                            onClick={() => onRefreshTable(table)}
                            className="bg-brand-canvas-alt text-body-xs text-brand-neutral flex h-11 items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95"
                            title="Refresh Status"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Sync
                        </button>
                    </div>

                    <div className="to-brand-canvas-alt/20 pointer-events-none absolute inset-0 bg-linear-to-br from-transparent opacity-0" />
                </div>
            ))}

            <button
                onClick={onAddTable}
                className="group border-brand-neutral-soft/20 bg-brand-canvas/30 hover:border-brand-accent hover:shadow-soft flex min-h-[260px] flex-col items-center justify-center gap-5 rounded-4xl border-2 border-dashed transition-all hover:bg-white"
            >
                <div className="shadow-soft ring-brand-neutral-soft/5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white ring-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90">
                    <Plus className="text-brand-neutral group-hover:text-brand-ink h-10 w-10 transition-colors" />
                </div>
                <span className="text-brand-neutral group-hover:text-brand-ink font-bold tracking-tight transition-colors">
                    Add New Table
                </span>
            </button>
        </div>
    );
}
