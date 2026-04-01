'use client';

import React from 'react';
import { X } from 'lucide-react';

type TableSessionState = {
    id: string;
    status: string;
    guest_count: number | null;
    opened_at: string | null;
    closed_at: string | null;
    assigned_staff_id: string | null;
    notes: string | null;
};

interface TableSessionDrawerProps {
    open: boolean;
    tableNumber: string | null;
    loading: boolean;
    session: TableSessionState | null;
    onClose: () => void;
}

const formatTimestamp = (value: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
};

export function TableSessionDrawer({
    open,
    tableNumber,
    loading,
    session,
    onClose,
}: TableSessionDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Table Session</h3>
                        <p className="text-sm text-gray-500">Table {tableNumber ?? 'N/A'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-brand-accent flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 shadow-sm transition-colors hover:text-black"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4 shadow-inner">
                    {loading && <p className="text-sm text-gray-500">Loading session state...</p>}

                    {!loading && !session && (
                        <p className="text-sm text-gray-600">
                            No session records found for this table.
                        </p>
                    )}

                    {!loading && session && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Session ID</span>
                                <span className="font-medium text-gray-900">{session.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className="font-medium text-gray-900">{session.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Guest Count</span>
                                <span className="font-medium text-gray-900">
                                    {session.guest_count ?? 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Opened At</span>
                                <span className="font-medium text-gray-900">
                                    {formatTimestamp(session.opened_at)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Closed At</span>
                                <span className="font-medium text-gray-900">
                                    {formatTimestamp(session.closed_at)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Assigned Staff</span>
                                <span className="font-medium text-gray-900">
                                    {session.assigned_staff_id ?? 'N/A'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="text-gray-500">Notes</p>
                                <p className="mt-1 text-gray-800">{session.notes ?? 'No notes.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
