'use client';

import React, { useState } from 'react';
import { Tablet, Copy, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
    getPaymentOptionsForSurface,
    type HardwareDeviceMetadata,
    type HardwareDeviceType,
    type SupportedPaymentMethod,
    type TerminalReceiptMode,
    type TerminalSettlementMode,
} from '@/lib/devices/config';

interface ProvisionDeviceModalProps {
    open: boolean;
    loading: boolean;
    availableZones?: string[];
    restaurantSlug?: string | null;
    onClose: () => void;
    onProvision: (payload: {
        name: string;
        device_type: HardwareDeviceType;
        assigned_zones?: string[];
        metadata?: HardwareDeviceMetadata;
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
    const [deviceType, setDeviceType] = useState<HardwareDeviceType>('pos');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [newDevice, setNewDevice] = useState<any | null>(null);
    const [stationName, setStationName] = useState('');
    const [settlementMode, setSettlementMode] = useState<TerminalSettlementMode>('cashier');
    const [receiptMode, setReceiptMode] = useState<TerminalReceiptMode>('prompt');
    const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<SupportedPaymentMethod[]>([
        'cash',
        'chapa',
    ]);

    const terminalPaymentOptions = getPaymentOptionsForSurface('terminal').filter(
        option => option.method !== 'card'
    );

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const device = await onProvision({
            name: name.trim(),
            device_type: deviceType,
            assigned_zones: selectedZones.length > 0 ? selectedZones : undefined,
            metadata:
                deviceType === 'terminal'
                    ? {
                          station_name: stationName.trim() || undefined,
                          settlement_mode: settlementMode,
                          allowed_payment_methods: allowedPaymentMethods,
                          receipt_mode: receiptMode,
                          managed_mode: 'dedicated',
                          kiosk_required: true,
                      }
                    : undefined,
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

    const togglePaymentMethod = (method: SupportedPaymentMethod) => {
        setAllowedPaymentMethods(prev => {
            if (prev.includes(method)) {
                return prev.length === 1 ? prev : prev.filter(entry => entry !== method);
            }

            return [...prev, method];
        });
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
                                    onChange={e =>
                                        setDeviceType(e.target.value as HardwareDeviceType)
                                    }
                                    className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 capitalize shadow-sm transition-all outline-none focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                                >
                                    <option value="pos">POS Terminal (Waiters)</option>
                                    <option value="kds">Kitchen Display (KDS)</option>
                                    <option value="terminal">Cashier Terminal</option>
                                </select>
                            </div>
                            {deviceType === 'terminal' && (
                                <div className="space-y-4 rounded-2xl bg-emerald-50/60 p-4 shadow-inner">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                            Station Name
                                        </label>
                                        <input
                                            value={stationName}
                                            onChange={e => setStationName(e.target.value)}
                                            placeholder="e.g. Front Cashier"
                                            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:shadow-md focus:ring-4 focus:ring-black/5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                Settlement Mode
                                            </label>
                                            <select
                                                value={settlementMode}
                                                onChange={e =>
                                                    setSettlementMode(
                                                        e.target.value as TerminalSettlementMode
                                                    )
                                                }
                                                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none focus:shadow-md focus:ring-4 focus:ring-black/5"
                                            >
                                                <option value="cashier">Cashier</option>
                                                <option value="counter">Counter</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                Receipt Mode
                                            </label>
                                            <select
                                                value={receiptMode}
                                                onChange={e =>
                                                    setReceiptMode(
                                                        e.target.value as TerminalReceiptMode
                                                    )
                                                }
                                                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none focus:shadow-md focus:ring-4 focus:ring-black/5"
                                            >
                                                <option value="prompt">Prompt Staff</option>
                                                <option value="auto">Auto Prompt</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                            Allowed Payment Methods
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {terminalPaymentOptions.map(option => (
                                                <button
                                                    key={option.method}
                                                    type="button"
                                                    onClick={() =>
                                                        togglePaymentMethod(option.method)
                                                    }
                                                    className={cn(
                                                        'rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                                                        allowedPaymentMethods.includes(
                                                            option.method
                                                        )
                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                            : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100'
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-[11px] font-semibold text-gray-500">
                                            Defaults follow Gebeta&apos;s current cashier setup:
                                            cash and Chapa.
                                        </p>
                                    </div>
                                </div>
                            )}
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
                            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-[11px] font-semibold text-gray-500">
                                Staff devices should be installed as a PWA and locked to kiosk mode
                                on managed Android tablets for enterprise-grade operation.
                            </div>
                            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-[11px] font-semibold text-amber-700">
                                Customer kiosk provisioning is temporarily hidden until the
                                dedicated self-order kiosk UI is implemented. Today the supported
                                managed device types are Waiter POS, KDS, and Cashier Terminal.
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
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-xl shadow-green-100/50">
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
