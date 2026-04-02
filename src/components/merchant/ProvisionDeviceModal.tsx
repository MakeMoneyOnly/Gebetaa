'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Tablet, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
    getDeviceProfileLabel,
    getPaymentOptionsForSurface,
    resolveDeviceTypeForProfile,
    type DeviceProfile,
    type HardwareDeviceMetadata,
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
        device_profile?: DeviceProfile;
        device_type?: 'pos' | 'kds' | 'kiosk' | 'digital_menu' | 'terminal';
        assigned_zones?: string[];
        metadata?: HardwareDeviceMetadata;
    }) => Promise<ProvisionedDeviceResult | null>;
}

interface ProvisionedDeviceResult {
    pairing_code: string;
    device_profile?: DeviceProfile | null;
    pairing_code_expires_at?: string | null;
}

const PROFILE_OPTIONS: Array<{
    profile: DeviceProfile;
    title: string;
    description: string;
}> = [
    {
        profile: 'waiter',
        title: 'Waiter',
        description: 'Mobile order taking and kitchen dispatch.',
    },
    {
        profile: 'cashier',
        title: 'Cashier',
        description: 'Checkout, receipt printing, and split settlement.',
    },
    {
        profile: 'kds',
        title: 'KDS',
        description: 'Kitchen board and order completion workflow.',
    },
    {
        profile: 'kiosk',
        title: 'Kiosk',
        description: 'Self-service guest ordering and payment.',
    },
];

export function ProvisionDeviceModal({
    open,
    loading,
    availableZones = [],
    restaurantSlug,
    onClose,
    onProvision,
}: ProvisionDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>('waiter');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [newDevice, setNewDevice] = useState<ProvisionedDeviceResult | null>(null);
    const [stationName, setStationName] = useState('');
    const [settlementMode, setSettlementMode] = useState<TerminalSettlementMode>('cashier');
    const [receiptMode, setReceiptMode] = useState<TerminalReceiptMode>('auto');
    const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<SupportedPaymentMethod[]>([
        'cash',
        'chapa',
    ]);

    const deviceType = useMemo(() => resolveDeviceTypeForProfile(deviceProfile), [deviceProfile]);
    const terminalPaymentOptions = getPaymentOptionsForSurface('terminal').filter(
        option => option.method !== 'card'
    );

    if (!open) {
        return null;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const device = await onProvision({
            name: name.trim(),
            device_profile: deviceProfile,
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
                          fiscal: {
                              mode: 'mor_pending',
                          },
                      }
                    : {
                          managed_mode: deviceProfile === 'kiosk' ? 'dedicated' : 'pwa',
                      },
        });

        if (device) {
            setNewDevice(device);
        }
    };

    const toggleZone = (zone: string) => {
        setSelectedZones(current =>
            current.includes(zone) ? current.filter(entry => entry !== zone) : [...current, zone]
        );
    };

    const togglePaymentMethod = (method: SupportedPaymentMethod) => {
        setAllowedPaymentMethods(current => {
            if (current.includes(method)) {
                return current.length === 1 ? current : current.filter(entry => entry !== method);
            }

            return [...current, method];
        });
    };

    const handleCopy = () => {
        if (!newDevice?.pairing_code) {
            return;
        }

        navigator.clipboard.writeText(newDevice.pairing_code);
        toast.success('Pairing code copied!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_28px_80px_rgba(0,0,0,0.12)]">
                {!newDevice ? (
                    <>
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black tracking-[0.24em] text-[#A81818]/80 uppercase">
                                    Managed Hardware
                                </p>
                                <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
                                    Provision Device Shell
                                </h3>
                                <p className="mt-1 text-sm font-medium text-gray-500">
                                    Generate a six-character pairing code and assign the correct
                                    device role before installation.
                                </p>
                            </div>
                            <button
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-black"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Device Name
                                </label>
                                <input
                                    value={name}
                                    onChange={event => setName(event.target.value)}
                                    placeholder="e.g. Front Counter Tablet"
                                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-black/5"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Device Profile
                                </label>
                                <div className="grid gap-2 md:grid-cols-2">
                                    {PROFILE_OPTIONS.map(option => (
                                        <button
                                            key={option.profile}
                                            type="button"
                                            onClick={() => setDeviceProfile(option.profile)}
                                            className={cn(
                                                'rounded-2xl border px-4 py-4 text-left transition-all',
                                                deviceProfile === option.profile
                                                    ? 'border-[#F2C94C] bg-[#fff8dd] shadow-md'
                                                    : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm'
                                            )}
                                        >
                                            <p className="text-sm font-black text-black">
                                                {option.title}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-gray-500">
                                                {option.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {deviceType === 'terminal' && (
                                <div className="space-y-4 rounded-2xl bg-emerald-50/70 p-4 shadow-inner">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                            Station Name
                                        </label>
                                        <input
                                            value={stationName}
                                            onChange={event => setStationName(event.target.value)}
                                            placeholder="e.g. Front Cashier"
                                            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:shadow-md focus:ring-4 focus:ring-black/5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                Settlement Mode
                                            </label>
                                            <select
                                                value={settlementMode}
                                                onChange={event =>
                                                    setSettlementMode(
                                                        event.target.value as TerminalSettlementMode
                                                    )
                                                }
                                                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none focus:shadow-md focus:ring-4 focus:ring-black/5"
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
                                                onChange={event =>
                                                    setReceiptMode(
                                                        event.target.value as TerminalReceiptMode
                                                    )
                                                }
                                                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all outline-none focus:shadow-md focus:ring-4 focus:ring-black/5"
                                            >
                                                <option value="auto">Silent Auto Print</option>
                                                <option value="prompt">Prompt Staff</option>
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
                                    </div>
                                </div>
                            )}

                            <div>
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
                                                    'rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                                                    selectedZones.includes(zone)
                                                        ? 'bg-black text-white shadow-md shadow-black/10'
                                                        : 'bg-gray-100 text-gray-600 shadow-sm hover:bg-gray-200'
                                                )}
                                            >
                                                {zone}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-xs font-semibold text-gray-400 italic">
                                            No zones defined yet.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-[11px] font-semibold text-gray-500">
                                Managed Android devices are provisioned under Gebeta platform fleet
                                control. Merchants only assign operational role and zone scope here.
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="bg-brand-accent flex-1 rounded-xl px-6 py-3 text-sm font-bold text-black shadow-lg shadow-black/10 transition-all hover:brightness-105 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'Generating...' : 'Generate Pairing Code'}
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
                            Pairing Code Ready
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-gray-500">
                            Open the device welcome screen in the APK and enter the six-character
                            code below.
                        </p>

                        <div className="mt-8 w-full space-y-4">
                            <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-gray-50 p-6 shadow-inner">
                                <span className="mb-1 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                    Pairing Code
                                </span>
                                <span className="font-mono text-5xl font-black tracking-widest text-black">
                                    {newDevice.pairing_code}
                                </span>
                                <p className="text-[11px] font-semibold text-gray-500">
                                    {getDeviceProfileLabel(newDevice.device_profile)}
                                    {newDevice.pairing_code_expires_at
                                        ? ` · expires ${new Date(newDevice.pairing_code_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        : ''}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <span className="mb-1 block text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                    Welcome Screen
                                </span>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="truncate text-sm font-bold text-gray-900">
                                        {window.location.origin}/{restaurantSlug || 'setup'}/setup
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/${restaurantSlug || 'setup'}/setup`
                                            );
                                            toast.success('Welcome screen link copied!');
                                        }}
                                        className="hover:bg-brand-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 shadow-sm transition-all hover:text-black hover:shadow-md"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
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
                                className="bg-brand-accent flex-1 rounded-xl py-3 text-sm font-bold text-black shadow-lg shadow-black/10 hover:brightness-105"
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
