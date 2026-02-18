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
        <div className="sticky bottom-4 z-30 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-gray-200/80">
            <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                    {selectedCount} selected
                </span>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(event) => onStatusChange(event.target.value as BulkStatus)}
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold capitalize text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
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
                            'h-10 rounded-xl bg-black px-4 text-xs font-bold text-white transition-all duration-200',
                            loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-800 shadow-sm'
                        )}
                    >
                        Apply Status
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedStaffId}
                        onChange={(event) => onStaffChange(event.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
                    >
                        <option value="">Assign staff…</option>
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
                            'h-10 rounded-xl bg-gray-100 px-4 text-xs font-bold text-gray-700 transition-all duration-200 ring-1 ring-gray-200/80',
                            loading || !selectedStaffId
                                ? 'opacity-60 cursor-not-allowed'
                                : 'hover:bg-gray-200 hover:text-gray-900'
                        )}
                    >
                        <Users className="mr-1.5 inline h-3.5 w-3.5" />
                        Assign
                    </button>
                </div>

                <button
                    onClick={onClearSelection}
                    className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
                >
                    <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />
                    Clear
                </button>
            </div>
        </div>
    );
}
