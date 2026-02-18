'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';

interface InviteStaffModalProps {
    open: boolean;
    loading: boolean;
    inviteUrl: string | null;
    onClose: () => void;
    onInvite: (payload: { email: string | null; role: StaffRole }) => Promise<void>;
}

const ROLE_OPTIONS: StaffRole[] = ['owner', 'admin', 'manager', 'kitchen', 'waiter', 'bar'];

export function InviteStaffModal({
    open,
    loading,
    inviteUrl,
    onClose,
    onInvite,
}: InviteStaffModalProps) {
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
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Invite Staff</h3>
                        <p className="text-sm text-gray-500 mt-1">Create an invite link with a role assignment.</p>
                    </div>
                    <button
                        className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email (optional)"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value as StaffRole)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    >
                        {ROLE_OPTIONS.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                                {roleOption}
                            </option>
                        ))}
                    </select>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    {inviteUrl && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs font-semibold text-emerald-700">Invite URL</p>
                            <p className="mt-1 text-xs break-all text-emerald-900">{inviteUrl}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? 'Inviting...' : 'Create Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
