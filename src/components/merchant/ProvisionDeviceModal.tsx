'use client';

import React, { useState } from 'react';
import { Tablet, Copy, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ProvisionDeviceModalProps {
    open: boolean;
    loading: boolean;
    availableZones?: string[];
    restaurantSlug?: string | null;
    onClose: () => void;
    onProvision: (payload: {
        name: string;
        device_type: 'pos' | 'kds' | 'kiosk' | 'digital_menu';
        assigned_zones?: string[];
    }) => Promise<any>;
}

export function ProvisionDeviceModal({
    open,
    loading,
    availableZones = [],
    restaurantSlug,
    onClose,
    onProvision,
}: ProvisionDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState<'pos' | 'kds' | 'kiosk' | 'digital_menu'>('pos');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [newDevice, setNewDevice] = useState<any | null>(null);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const device = await onProvision({
            name: name.trim(),
            device_type: deviceType,
            assigned_zones: selectedZones.length > 0 ? selectedZones : undefined,
        });

        if (device) {
            setNewDevice(device);
        }
    };

    const toggleZone = (zone: string) => {
        setSelectedZones(prev =>
            prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
        );
    };

    const handleCopy = () => {
        if (!newDevice?.pairing_code) return;
        navigator.clipboard.writeText(newDevice.pairing_code);
        toast.success('Pairing code copied!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 backdrop-blur">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                {!newDevice ? (
                    <>
                        <div className="mb-2 flex items-start justify-between xl:-mr-1">
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-gray-900">
                                    Provision Device
                                </h3>
                                <p className="mt-0.5 text-xs font-semibold text-gray-500">
                                    Register a new hardware terminal.
                                </p>
                            </div>
                            <button
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-black"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Device Name
                                </label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Patio POS 1"
                                    className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Device Type
                                </label>
                                <select
                                    value={deviceType}
                                    onChange={e => setDeviceType(e.target.value as any)}
                                    className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 capitalize shadow-sm transition-all outline-none focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                                >
                                    <option value="pos">POS Terminal (Waiters)</option>
                                    <option value="kds">Kitchen Display (KDS)</option>
                                    <option value="kiosk">Customer Kiosk</option>
                                </select>
                            </div>
                            <div className="pt-2">
                                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Zone Restriction
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
                                    Optional: Restrict device to specific zones
                                </p>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="bg-brand-crimson flex-1 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-[#a0151e] disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'Generating...' : 'Generate Code'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in flex flex-col items-center text-center duration-500">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-xl ring-1 shadow-green-100/50 ring-green-100">
                            <Tablet className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-gray-900">
                            Pairing Code Ready!
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-gray-500">
                            Navigate to the setup link on the new device and enter the 4-digit code.
                        </p>

                        <div className="mt-8 w-full space-y-4">
                            {/* Setup Link Section */}
                            <div className="group relative flex flex-col items-start rounded-2xl bg-gray-50 p-4 shadow-sm transition-all hover:shadow">
                                <span className="mb-1 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                    Setup URL
                                </span>
                                <div className="flex w-full items-center justify-between gap-3">
                                    <span className="truncate text-sm font-bold text-gray-900">
                                        {window.location.origin}/{restaurantSlug || 'setup'}/setup
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/${restaurantSlug || 'setup'}/setup`
                                            );
                                            toast.success('Setup link copied!');
                                        }}
                                        className="hover:bg-brand-crimson flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm transition-all hover:text-white hover:shadow-md"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Pairing Code Section */}
                            <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-gray-50 p-6 shadow-inner">
                                <span className="mb-1 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                    Pairing Code
                                </span>
                                <span className="font-mono text-5xl font-black tracking-widest text-black">
                                    {newDevice.pairing_code}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex w-full gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-900 hover:bg-gray-200"
                            >
                                <Copy className="h-4 w-4" />
                                Copy Code
                            </button>
                            <button
                                onClick={() => {
                                    setNewDevice(null);
                                    onClose();
                                }}
                                className="bg-brand-crimson flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-[#a0151e]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
