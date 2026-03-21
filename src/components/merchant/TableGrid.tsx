'use client';

import React from 'react';
import { Edit2, Plus, QrCode, RefreshCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const getStatusColor = (status: TableGridRow['status']) => {
    switch (status) {
        case 'available':
            return 'bg-green-50 text-green-600';
        case 'occupied':
            return 'bg-orange-50 text-orange-600';
        case 'reserved':
            return 'bg-blue-50 text-blue-600';
        case 'bill_requested':
            return 'bg-purple-50 text-purple-600';
        default:
            return 'bg-gray-50 text-gray-600';
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
                        className="min-h-[240px] animate-pulse rounded-[2.5rem] bg-white p-6 shadow-sm"
                    >
                        <div className="h-6 w-20 rounded-full bg-gray-100" />
                        <div className="mx-auto mt-10 h-16 w-20 rounded-xl bg-gray-100" />
                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <div className="h-10 rounded-xl bg-gray-100" />
                            <div className="h-10 rounded-xl bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!isLoading && tables.length === 0) {
        return (
            <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                <p className="text-base font-semibold text-gray-700">No tables found.</p>
                <p className="mt-1 text-sm text-gray-500">
                    Create your first table to start seating guests.
                </p>
                <button
                    onClick={onAddTable}
                    className="bg-brand-crimson mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors hover:bg-[#a0151e]"
                >
                    <Plus className="h-4 w-4" />
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
                    className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                    <div className="relative z-10 flex items-start justify-between">
                        <span
                            className={cn(
                                'rounded-full px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-sm',
                                getStatusColor(table.status)
                            )}
                        >
                            {table.status.replace('_', ' ')}
                        </span>

                        <div className="flex items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
                            <button
                                onClick={() => onEditTable(table)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all hover:bg-gray-100 hover:text-black"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDeleteTable(table)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10 my-4 flex flex-col items-center justify-center">
                        <span className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                            Table
                        </span>
                        <div
                            className="text-6xl font-black tracking-tighter text-gray-900"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {table.table_number}
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto grid grid-cols-2 gap-3 border-t border-gray-50 pt-4">
                        <button
                            onClick={() => onShowQR(table)}
                            className="bg-brand-crimson flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-black/10 transition-all group-hover:scale-[1.02] hover:bg-[#a0151e]"
                        >
                            <QrCode className="h-3 w-3" />
                            QR Code
                        </button>
                        <button
                            onClick={() => onRefreshTable(table)}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 transition-all group-hover:scale-[1.02] hover:bg-gray-200"
                            title="Refresh Status"
                        >
                            <RefreshCcw className="h-3 w-3" />
                            Status
                        </button>
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
            ))}

            <button
                onClick={onAddTable}
                className="group flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all hover:border-black/20 hover:bg-gray-100"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
                    <Plus className="h-8 w-8 text-gray-400 group-hover:text-black" />
                </div>
                <span className="font-bold text-gray-400 transition-colors group-hover:text-black">
                    Add New Table
                </span>
            </button>
        </div>
    );
}
