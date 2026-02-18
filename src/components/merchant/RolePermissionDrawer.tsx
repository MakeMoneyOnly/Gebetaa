'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';

type StaffMember = {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean | null;
    created_at: string | null;
};

interface RolePermissionDrawerProps {
    open: boolean;
    loading: boolean;
    staff: StaffMember | null;
    onClose: () => void;
    onSave: (staffId: string, role: StaffRole) => Promise<void>;
}

const ROLE_OPTIONS: { value: StaffRole; description: string }[] = [
    { value: 'owner', description: 'Full ownership and all critical controls.' },
    { value: 'admin', description: 'Operational admin access including staff and settings.' },
    { value: 'manager', description: 'Shift and service operations management.' },
    { value: 'kitchen', description: 'Kitchen-focused operational controls.' },
    { value: 'waiter', description: 'Service-floor workflow operations.' },
    { value: 'bar', description: 'Bar station workflow operations.' },
];

export function RolePermissionDrawer({
    open,
    loading,
    staff,
    onClose,
    onSave,
}: RolePermissionDrawerProps) {
    const [role, setRole] = useState<StaffRole>('waiter');

    React.useEffect(() => {
        if (!staff) return;
        setRole((staff.role as StaffRole) ?? 'waiter');
    }, [staff]);

    if (!open || !staff) return null;

    const selectedOption = ROLE_OPTIONS.find((option) => option.value === role);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Role & Permissions</h3>
                        <p className="text-sm text-gray-500 mt-1">Staff {staff.user_id.slice(0, 8)}</p>
                    </div>
                    <button
                        className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value as StaffRole)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    >
                        {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.value}
                            </option>
                        ))}
                    </select>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-700">Permission Summary</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedOption?.description}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onSave(staff.id, role)}
                        className="h-10 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}
