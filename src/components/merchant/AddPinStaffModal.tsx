'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type StaffRole = 'kitchen' | 'waiter' | 'bar' | 'runner';

interface AddPinStaffModalProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onAdd: (payload: {
        name: string;
        role: StaffRole;
        pin_code: string;
        assigned_zones?: string[];
    }) => Promise<void>;
}

const ROLE_OPTIONS: StaffRole[] = ['waiter', 'kitchen', 'bar', 'runner'];

export function AddPinStaffModal({ open, loading, onClose, onAdd }: AddPinStaffModalProps) {
    const [name, setName] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [role, setRole] = useState<StaffRole>('waiter');
    const [zones, setZones] = useState(''); // Comma separated for now
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Please enter a name.');
            return;
        }

        if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
            setError('PIN must be exactly 4 digits.');
            return;
        }

        const assigned_zones = zones
            .split(',')
            .map(z => z.trim())
            .filter(Boolean);

        await onAdd({
            name: trimmedName,
            role,
            pin_code: pinCode,
            assigned_zones: assigned_zones.length > 0 ? assigned_zones : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Add Staff Member</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Create a PIN-based profile for hardware terminal login.
                        </p>
                    </div>
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-black hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
                        <input
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="e.g. David Smith"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold outline-none focus:border-gray-400 focus:bg-white"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Role</label>
                            <select
                                value={role}
                                onChange={event => setRole(event.target.value as StaffRole)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold outline-none focus:border-gray-400 focus:bg-white"
                            >
                                {ROLE_OPTIONS.map(roleOption => (
                                    <option key={roleOption} value={roleOption} className="capitalize">
                                        {roleOption}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="mb-1 block text-sm font-semibold text-gray-700">PIN Code (4-digit)</label>
                            <input
                                value={pinCode}
                                onChange={event => setPinCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="e.g. 1234"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold tracking-widest outline-none focus:border-gray-400 focus:bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Assigned Zones</label>
                        <input
                            value={zones}
                            onChange={event => setZones(event.target.value)}
                            placeholder="e.g. patio, bar, main (comma separated)"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold outline-none focus:border-gray-400 focus:bg-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">Leave blank to view all tables/alerts natively.</p>
                    </div>

                    {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 rounded-xl bg-black px-6 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
