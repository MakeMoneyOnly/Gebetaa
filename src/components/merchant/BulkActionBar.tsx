'use client';

import { Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type BulkStatus = 'acknowledged' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

type StaffOption = {
    id: string;
    role: string | null;
    user_id: string;
};

interface BulkActionBarProps {
    selectedCount: number;
    selectedStatus: BulkStatus;
    onStatusChange: (status: BulkStatus) => void;
    onApplyStatus: () => void;
    selectedStaffId: string;
    onStaffChange: (staffId: string) => void;
    onApplyAssign: () => void;
    onClearSelection: () => void;
    staffOptions: StaffOption[];
    loading?: boolean;
}

const STATUS_OPTIONS: BulkStatus[] = [
    'acknowledged',
    'preparing',
    'ready',
    'served',
    'completed',
    'cancelled',
];

export function BulkActionBar({
    selectedCount,
    selectedStatus,
    onStatusChange,
    onApplyStatus,
    selectedStaffId,
    onStaffChange,
    onApplyAssign,
    onClearSelection,
    staffOptions,
    loading = false,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="sticky bottom-4 z-30 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                    {selectedCount} selected
                </span>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(event) => onStatusChange(event.target.value as BulkStatus)}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold capitalize text-gray-700 outline-none"
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={onApplyStatus}
                        disabled={loading}
                        className={cn(
                            'h-10 rounded-xl bg-black px-3 text-xs font-bold text-white',
                            loading ? 'opacity-60' : 'hover:bg-gray-800'
                        )}
                    >
                        Apply Status
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedStaffId}
                        onChange={(event) => onStaffChange(event.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
                    >
                        <option value="">Assign staff...</option>
                        {staffOptions.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.role ?? 'staff'} · {staff.user_id.slice(0, 8)}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={onApplyAssign}
                        disabled={loading || !selectedStaffId}
                        className={cn(
                            'h-10 rounded-xl bg-gray-100 px-3 text-xs font-bold text-gray-900',
                            loading || !selectedStaffId ? 'opacity-60' : 'hover:bg-gray-200'
                        )}
                    >
                        <Users className="mr-1 inline h-3.5 w-3.5" />
                        Assign
                    </button>
                </div>

                <button
                    onClick={onClearSelection}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
                    Clear
                </button>
            </div>
        </div>
    );
}
