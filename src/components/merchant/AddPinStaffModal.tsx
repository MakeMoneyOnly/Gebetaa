'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaffRole } from '@/hooks/useStaff';

interface AddPinStaffModalProps {
    open: boolean;
    loading: boolean;
    availableZones?: string[];
    onClose: () => void;
    onAdd: (payload: {
        name: string;
        role: StaffRole;
        pin_code: string;
        assigned_zones?: string[];
    }) => Promise<void>;
}

const ROLE_OPTIONS: StaffRole[] = ['waiter', 'kitchen', 'bar', 'runner'];

export function AddPinStaffModal({
    open,
    loading,
    availableZones = [],
    onClose,
    onAdd,
}: AddPinStaffModalProps) {
    const [name, setName] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [role, setRole] = useState<StaffRole>('waiter');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
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

        await onAdd({
            name: trimmedName,
            role,
            pin_code: pinCode,
            assigned_zones: selectedZones.length > 0 ? selectedZones : undefined,
        });
    };

    const toggleZone = (zone: string) => {
        setSelectedZones(prev =>
            prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 backdrop-blur">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between xl:-mr-1">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-gray-900">
                            Add Staff Member
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-gray-500">
                            Create a PIN-based profile for hardware terminal login.
                        </p>
                    </div>
                    <button
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-black"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="e.g. David Smith"
                            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={event => setRole(event.target.value as StaffRole)}
                                className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 capitalize shadow-sm transition-all outline-none focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                            >
                                {ROLE_OPTIONS.map(roleOption => (
                                    <option key={roleOption} value={roleOption}>
                                        {roleOption}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                Login PIN
                            </label>
                            <p className="mb-1.5 text-[10px] font-semibold text-gray-400">
                                Staff use this to log in on the device
                            </p>
                            <input
                                value={pinCode}
                                onChange={event =>
                                    setPinCode(event.target.value.replace(/\D/g, '').slice(0, 4))
                                }
                                placeholder="e.g. 1234"
                                className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm font-black tracking-[0.3em] text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                            Assigned Zones
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableZones.length > 0 ? (
                                availableZones.map(zone => (
                                    <button
                                        key={zone}
                                        type="button"
                                        onClick={() => toggleZone(zone)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                                            selectedZones.includes(zone)
                                                ? 'bg-black text-white shadow-md shadow-black/10'
                                                : 'bg-gray-100 text-gray-600 shadow-sm hover:bg-gray-200 hover:shadow'
                                        )}
                                    >
                                        {zone}
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs font-semibold text-gray-400 italic">
                                    No zones defined in Tables & QR tab.
                                </p>
                            )}
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-gray-400">
                            Leave unselected to give access to all zones.
                        </p>
                    </div>

                    {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                    <div className="mt-8 flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-accent flex-1 rounded-xl px-6 py-3 text-sm font-bold text-black shadow-lg shadow-black/10 transition-all hover:brightness-105 disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? 'Adding...' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
