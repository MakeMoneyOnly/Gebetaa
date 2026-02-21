'use client';

import React, { useState } from 'react';
import { Tablet, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProvisionDeviceModalProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onProvision: (payload: { name: string; device_type: 'pos' | 'kds' | 'kiosk' | 'digital_menu'; assigned_zones?: string[] }) => Promise<any>;
}

export function ProvisionDeviceModal({ open, loading, onClose, onProvision }: ProvisionDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState<'pos' | 'kds' | 'kiosk' | 'digital_menu'>('pos');
    const [zones, setZones] = useState('');
    const [newDevice, setNewDevice] = useState<any | null>(null);
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const assigned_zones = zones.split(',').map(z => z.trim()).filter(Boolean);
        const device = await onProvision({
            name: name.trim(),
            device_type: deviceType,
            assigned_zones: assigned_zones.length > 0 ? assigned_zones : undefined,
        });

        if (device) {
            setNewDevice(device);
        }
    };

    const handleCopy = () => {
        if (!newDevice?.pairing_code) return;
        navigator.clipboard.writeText(newDevice.pairing_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Pairing code copied!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
                {!newDevice ? (
                    <>
                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-black">
                                <Tablet className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Provision Device</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Register a new hardware terminal (iPad, Android tablet, etc).
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Device Name</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Patio POS 1"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-gray-400 focus:bg-white focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Device Type</label>
                                <select
                                    value={deviceType}
                                    onChange={e => setDeviceType(e.target.value as any)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold capitalize focus:border-gray-400 focus:bg-white focus:outline-none"
                                >
                                    <option value="pos">POS Terminal (Waiters)</option>
                                    <option value="kds">Kitchen Display (KDS)</option>
                                    <option value="kiosk">Customer Kiosk</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Zone Restriction</label>
                                <input
                                    value={zones}
                                    onChange={e => setZones(e.target.value)}
                                    placeholder="e.g. patio, main (comma separated)"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-gray-400 focus:bg-white focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">Optional: Restrict device to specific zones</p>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Code'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg">
                            <Tablet className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">Pairing Code Ready!</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Navigate to <strong>/setup</strong> on the new device and enter this 6-digit code.
                        </p>

                        <div className="my-8 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6">
                            <span className="font-mono text-5xl font-black tracking-[0.2em] text-black">
                                {newDevice.pairing_code}
                            </span>
                        </div>

                        <div className="flex w-full gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-900 hover:bg-gray-200"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                                onClick={() => {
                                    setNewDevice(null);
                                    onClose();
                                }}
                                className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-gray-800"
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
