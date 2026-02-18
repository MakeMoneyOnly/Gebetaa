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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="min-h-[240px] rounded-[2.5rem] bg-white p-6 shadow-sm animate-pulse">
                        <div className="h-6 w-20 rounded-full bg-gray-100" />
                        <div className="mt-10 h-16 w-20 rounded-xl bg-gray-100 mx-auto" />
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
                <p className="mt-1 text-sm text-gray-500">Create your first table to start seating guests.</p>
                <button
                    onClick={onAddTable}
                    className="mt-5 h-11 px-5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Table
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map((table) => (
                <div key={table.id} className="group relative bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[240px] overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <span
                            className={cn(
                                'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm',
                                getStatusColor(table.status)
                            )}
                        >
                            {table.status.replace('_', ' ')}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEditTable(table)}
                                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 flex items-center justify-center transition-all"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDeleteTable(table)}
                                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center my-4 relative z-10">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Table</span>
                        <div className="text-6xl font-black text-gray-900 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {table.table_number}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto relative z-10 pt-4 border-t border-gray-50">
                        <button
                            onClick={() => onShowQR(table)}
                            className="h-10 rounded-xl bg-black text-white flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 text-xs font-bold group-hover:scale-[1.02]"
                        >
                            <QrCode className="h-3 w-3" />
                            QR Code
                        </button>
                        <button
                            onClick={() => onRefreshTable(table)}
                            className="h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-xs font-bold group-hover:scale-[1.02]"
                            title="Refresh Status"
                        >
                            <RefreshCcw className="h-3 w-3" />
                            Status
                        </button>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
            ))}

            <button
                onClick={onAddTable}
                className="group min-h-[240px] rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-black/20 bg-gray-50/50 flex flex-col items-center justify-center gap-4 hover:bg-gray-100 transition-all"
            >
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="h-8 w-8 text-gray-400 group-hover:text-black" />
                </div>
                <span className="font-bold text-gray-400 group-hover:text-black transition-colors">Add New Table</span>
            </button>
        </div>
    );
}
