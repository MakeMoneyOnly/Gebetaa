'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';

interface InviteStaffModalProps {
    open: boolean;
    loading: boolean;
    inviteUrl: string | null;
    onClose: () => void;
    onInvite: (payload: {
        email: string | null;
        role: StaffRole;
        label: string | null;
    }) => Promise<void>;
}

const ROLE_OPTIONS: StaffRole[] = ['admin', 'manager', 'kitchen', 'waiter', 'bar'];
const ROLE_TARGET: Record<StaffRole, string> = {
    owner: '/merchant',
    admin: '/merchant',
    manager: '/merchant',
    kitchen: '/kds',
    waiter: '/waiter',
    bar: '/bar',
};

export function InviteStaffModal({
    open,
    loading,
    inviteUrl,
    onClose,
    onInvite,
}: InviteStaffModalProps) {
    const [label, setLabel] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<StaffRole>('waiter');
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const trimmedEmail = email.trim();
        if (trimmedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        await onInvite({
            email: trimmedEmail.length > 0 ? trimmedEmail : null,
            role,
            label: label.trim().length > 0 ? label.trim() : null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Provision Access Key</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Create a setup link with role-based module access.
                        </p>
                    </div>
                    <button
                        className="hover:bg-brand-crimson flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <input
                        value={label}
                        onChange={event => setLabel(event.target.value)}
                        placeholder="Label (e.g. Kitchen Tablet, Waiter Phone)"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <input
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        placeholder="Email (optional, for person-specific invite)"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <select
                        value={role}
                        onChange={event => setRole(event.target.value as StaffRole)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    >
                        {ROLE_OPTIONS.map(roleOption => (
                            <option key={roleOption} value={roleOption}>
                                {roleOption}
                            </option>
                        ))}
                    </select>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs font-semibold text-blue-700">Target Module</p>
                        <p className="mt-1 text-xs text-blue-900">
                            After setup this key redirects to{' '}
                            <span className="font-semibold">{ROLE_TARGET[role]}</span>.
                        </p>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    {inviteUrl && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs font-semibold text-emerald-700">
                                Provisioning URL
                            </p>
                            <p className="mt-1 text-xs break-all text-emerald-900">{inviteUrl}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-crimson h-10 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:opacity-50"
                        >
                            {loading ? 'Provisioning...' : 'Create Provisioning Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
