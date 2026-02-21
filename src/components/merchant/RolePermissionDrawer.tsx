'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar' | 'runner';

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
    { value: 'runner', description: 'Helping floor staff with food delivery.' },
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

    const selectedOption = ROLE_OPTIONS.find(option => option.value === role);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Role & Permissions</h3>
                        <p className="mt-1 text-sm text-gray-500">ID: {staff.id?.slice(0, 8)}</p>
                    </div>
                    <button
                        className="hover:bg-brand-crimson flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 space-y-3">
                    <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={event => setRole(event.target.value as StaffRole)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    >
                        {ROLE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.value}
                            </option>
                        ))}
                    </select>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-700">Permission Summary</p>
                        <p className="mt-1 text-sm text-gray-600">{selectedOption?.description}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onSave(staff.id, role)}
                        className="bg-brand-crimson h-10 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}
