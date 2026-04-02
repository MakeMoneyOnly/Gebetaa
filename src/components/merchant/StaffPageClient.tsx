'use client';

import React, { useState, useEffect } from 'react';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { useStaff, StaffMember, ROLE_BADGE } from '@/hooks/useStaff';
import { useRole } from '@/hooks/useRole';
import { useDevices } from '@/hooks/useDevices';
import { RolePermissionDrawer } from '@/components/merchant/RolePermissionDrawer';
import { AddPinStaffModal } from '@/components/merchant/AddPinStaffModal';
import { ProvisionDeviceModal } from '@/components/merchant/ProvisionDeviceModal';
import { MetricCard } from '@/components/merchant/MetricCard';
import { Users, Tablet, Plus, MoreHorizontal, UserCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaffPageData } from '@/lib/services/dashboardDataService';

type SubTab = 'staff' | 'devices';

export function StaffPageClient({ initialData }: { initialData?: StaffPageData | null }) {
    const {
        staff,
        loading: staffDataLoading,
        activeUpdatingId,
        handleRoleUpdate,
        handleActiveToggle,
        handleAddPinStaff,
        handleDeleteStaff,
    } = useStaff(initialData?.staff as any);

    const { restaurantId } = useRole(null);
    const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);

    // Delete confirmation states
    const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
    const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

    const {
        devices,
        loading: devicesDataLoading,
        handleProvisionDevice,
        handleDeleteDevice,
    } = useDevices(initialData?.devices as any);

    const { loading: pageLoading, markLoaded } = usePageLoadGuard('staff');

    const [availableZones, setAvailableZones] = useState<string[]>([]);

    // Tab state
    const [activeTab, setActiveTab] = useState<SubTab>('staff');
    const [addStaffOpen, setAddStaffOpen] = useState(false);
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [roleSaving, setRoleSaving] = useState(false);

    const displayLoading = pageLoading || staffDataLoading || devicesDataLoading;

    useEffect(() => {
        if (!staffDataLoading && !devicesDataLoading) {
            markLoaded();
        }
    }, [staffDataLoading, devicesDataLoading, markLoaded]);

    // Fetch Zones
    useEffect(() => {
        const fetchZones = async () => {
            try {
                // 1. Fetch from centralized settings (primary)
                const settingsRes = await fetch('/api/restaurants/zones');
                const settingsResult = await settingsRes.json();

                // 2. Fetch from tables (discovery fallback)
                const tablesRes = await fetch('/api/tables');
                const tablesResult = await tablesRes.json();

                let combinedZones: string[] = [];

                if (
                    settingsRes.ok &&
                    settingsResult.data &&
                    Array.isArray(settingsResult.data.zones)
                ) {
                    combinedZones = [...settingsResult.data.zones];
                }

                if (tablesRes.ok && tablesResult.data && tablesResult.data.tables) {
                    const tableZones = tablesResult.data.tables
                        .map((t: any) => t.zone)
                        .filter(Boolean);
                    combinedZones = [...new Set([...combinedZones, ...tableZones])];
                }

                setAvailableZones(combinedZones);
            } catch (err) {
                console.error('Failed to fetch zones', err);
            }
        };
        fetchZones();
    }, []);

    // Fetch Restaurant Slug for Provisioning
    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!restaurantId) return;
            try {
                const response = await fetch('/api/merchant/activity');
                const result = await response.json();
                if (result.restaurant) {
                    setRestaurantSlug(result.restaurant.slug);
                }
            } catch (err) {
                console.error('Failed to fetch restaurant slug', err);
            }
        };
        fetchRestaurant();
    }, [restaurantId]);

    const onRoleSaveWrapper = async (staffId: string, role: string) => {
        setRoleSaving(true);
        try {
            await handleRoleUpdate(
                staffId,
                role as 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar' | 'runner'
            );
            setRoleDrawerOpen(false);
            setSelectedStaff(null);
        } finally {
            setRoleSaving(false);
        }
    };

    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.is_active !== false).length;

    return (
        <div className="min-h-screen space-y-8 pb-20">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Access & Devices
                    </h1>
                    <p className="font-medium text-gray-500">
                        Manage your team and hardware terminals.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAddDeviceOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-md transition-shadow hover:shadow-lg"
                    >
                        <Tablet className="h-4 w-4 text-gray-400" />
                        Add Device
                    </button>
                    <button
                        onClick={() => setAddStaffOpen(true)}
                        className="bg-brand-accent flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-black shadow-lg shadow-black/10 transition-colors hover:brightness-105"
                    >
                        <Plus className="h-4 w-4" />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={Users}
                    chip="TOTAL"
                    value={totalStaff}
                    label="Staff PINs"
                    subLabel="Total identities with PIN access"
                    tone="purple"
                    progress={Math.min(20, totalStaff)}
                    targetLabel="Target: -"
                    currentLabel={`${totalStaff} Profiles`}
                />
                <MetricCard
                    icon={UserCheck}
                    chip="ACTIVE"
                    value={activeStaff}
                    label="Enabled Accounts"
                    subLabel="Active PIN codes"
                    tone="blue"
                    progress={Math.min(20, Math.round((activeStaff / (totalStaff || 1)) * 20))}
                    targetLabel={`Total: ${totalStaff}`}
                    currentLabel={`Active: ${activeStaff}`}
                />
                <MetricCard
                    icon={Tablet}
                    chip="HARDWARE"
                    value={devices.length}
                    label="Hardware Terminals"
                    subLabel="Paired service devices"
                    tone="rose"
                    progress={Math.min(20, devices.length * 5)}
                    targetLabel="Target: -"
                    currentLabel={`${devices.length} Units`}
                />
                <MetricCard
                    icon={Tablet}
                    chip="CONNECTED"
                    value={devices.filter(d => Boolean(d.device_token)).length}
                    label="Paired Devices"
                    subLabel="Terminals actively connected"
                    tone="green"
                    progress={Math.min(20, devices.filter(d => Boolean(d.device_token)).length * 5)}
                    targetLabel={`Total: ${devices.length}`}
                    currentLabel={`Paired: ${devices.filter(d => Boolean(d.device_token)).length}`}
                />
            </div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex w-full overflow-hidden rounded-xl bg-gray-200/40 p-1 shadow-inner md:w-max">
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={cn(
                                'flex-1 rounded-xl px-8 py-3 text-sm font-bold transition-all md:flex-none',
                                activeTab === 'staff'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Staff PINs
                        </button>
                        <button
                            onClick={() => setActiveTab('devices')}
                            className={cn(
                                'flex-1 rounded-xl px-8 py-3 text-sm font-bold transition-all md:flex-none',
                                activeTab === 'devices'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Hardware Terminals
                        </button>
                    </div>
                </div>

                {displayLoading && staff.length === 0 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-5 rounded-[2.5rem] bg-white p-6 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 shadow-sm">
                                        <Skeleton className="h-14 w-14 rounded-2xl" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>

                                <div className="space-y-3">
                                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16 rounded-lg" />
                                        <Skeleton className="h-5 w-16 rounded-lg" />
                                    </div>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4 shadow-inner">
                                    <div className="flex justify-between pb-2">
                                        <Skeleton className="h-3 w-1/4 rounded" />
                                        <Skeleton className="h-4 w-1/3 rounded" />
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <Skeleton className="h-3 w-1/4 rounded" />
                                        <Skeleton className="h-4 w-1/3 rounded" />
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col gap-2 pt-2">
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                    <Skeleton className="h-8 w-full rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* STAFF TAB */}
                        {activeTab === 'staff' && (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {staff.map(member => (
                                    <div
                                        key={member.id}
                                        className="group relative flex flex-col gap-5 overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-xl font-bold text-gray-700 shadow-sm">
                                                {(member.name || member.email || 'US')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedStaff(member);
                                                    setRoleDrawerOpen(true);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-black"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight text-gray-900">
                                                {member?.name || member?.email || 'Unnamed Staff'}
                                            </h3>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                                                        ROLE_BADGE[member.role] ??
                                                            'bg-gray-100 text-gray-600'
                                                    )}
                                                >
                                                    {member.role}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                                                        member?.is_active === false
                                                            ? 'border border-gray-100 bg-gray-50 text-gray-400'
                                                            : 'border border-gray-900 bg-gray-900 text-white'
                                                    )}
                                                >
                                                    {member?.is_active === false
                                                        ? 'inactive'
                                                        : 'active'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4 shadow-inner">
                                            <div className="flex justify-between pb-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Login PIN
                                                </span>
                                                {member.pin_code ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono text-base font-black tracking-[0.2em] text-black">
                                                            {member.pin_code}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-emerald-600">
                                                            POS Login PIN
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-400">
                                                        No PIN Set
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Assigned Zones
                                                </span>
                                                <span className="text-xs font-bold text-black capitalize">
                                                    {member.assigned_zones &&
                                                    member.assigned_zones.length > 0
                                                        ? member.assigned_zones.join(', ')
                                                        : 'All Zones'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-2 pt-2">
                                            {member.role === 'owner' ? (
                                                <div className="w-full rounded-xl bg-gray-50 py-3 text-center text-xs font-bold text-gray-400">
                                                    Protected Account
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        disabled={activeUpdatingId === member.id}
                                                        onClick={() => handleActiveToggle(member)}
                                                        className={cn(
                                                            'w-full rounded-xl py-3 text-xs font-bold shadow-sm transition-colors disabled:opacity-50',
                                                            member.is_active === false
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                : 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-600'
                                                        )}
                                                    >
                                                        {activeUpdatingId === member.id
                                                            ? 'Updating...'
                                                            : member.is_active === false
                                                              ? 'Activate Access'
                                                              : 'Deactivate Access'}
                                                    </button>

                                                    {deletingStaffId === member.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    setDeletingStaffId(null)
                                                                }
                                                                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    await handleDeleteStaff(
                                                                        member.id
                                                                    );
                                                                    setDeletingStaffId(null);
                                                                }}
                                                                className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600"
                                                            >
                                                                Confirm Remove
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                setDeletingStaffId(member.id)
                                                            }
                                                            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Remove Staff
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* DEVICES TAB */}
                        {activeTab === 'devices' && (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {devices.map(device => (
                                    <div
                                        key={device.id}
                                        className="group relative flex flex-col gap-5 overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-xl">
                                                <Tablet className="h-6 w-6" />
                                            </div>
                                            <div
                                                className={cn(
                                                    'mt-2 mr-2 h-3 w-3 rounded-full',
                                                    device.device_token
                                                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                        : 'animate-pulse bg-orange-400'
                                                )}
                                            ></div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight text-gray-900">
                                                {device.name}
                                            </h3>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-700 uppercase">
                                                    {device.device_profile || device.device_type}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4 shadow-inner">
                                            <div className="mb-2 flex justify-between pb-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Status
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-xs font-bold',
                                                        device.device_token
                                                            ? 'text-emerald-600'
                                                            : 'text-orange-500'
                                                    )}
                                                >
                                                    {device.device_token
                                                        ? 'Paired'
                                                        : 'Pending Pair'}
                                                </span>
                                            </div>
                                            <div className="mb-2 flex justify-between py-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Pairing Code
                                                </span>
                                                <span className="font-mono text-xs font-black tracking-widest text-black">
                                                    {device.pairing_code || '---'}
                                                </span>
                                            </div>
                                            <div className="mb-2 flex justify-between py-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Pairing State
                                                </span>
                                                <span className="text-xs font-bold text-black capitalize">
                                                    {device.pairing_state ||
                                                        (device.device_token ? 'paired' : 'ready')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-xs font-bold text-gray-400">
                                                    Zones
                                                </span>
                                                <span className="text-xs font-bold text-black capitalize">
                                                    {device.assigned_zones &&
                                                    device.assigned_zones.length > 0
                                                        ? device.assigned_zones.join(', ')
                                                        : 'All Zones'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete Device */}
                                        <div className="mt-2">
                                            {deletingDeviceId === device.id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setDeletingDeviceId(null)}
                                                        className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await handleDeleteDevice(device.id);
                                                            setDeletingDeviceId(null);
                                                        }}
                                                        className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600"
                                                    >
                                                        Confirm Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeletingDeviceId(device.id)}
                                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove Device
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {devices.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-10 text-center shadow-sm">
                                        <Tablet className="mb-3 h-10 w-10 text-gray-300" />
                                        <h3 className="text-lg font-bold text-black">
                                            No Devices Provisioned
                                        </h3>
                                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                                            Add an iPad or Android tablet to function as a POS
                                            terminal or Kitchen Display.
                                        </p>
                                        <button
                                            onClick={() => setAddDeviceOpen(true)}
                                            className="bg-brand-accent mt-5 rounded-xl px-5 py-3 text-sm font-bold text-black hover:brightness-105"
                                        >
                                            Provision First Device
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddPinStaffModal
                open={addStaffOpen}
                loading={false}
                availableZones={availableZones}
                onClose={() => setAddStaffOpen(false)}
                onAdd={async payload => {
                    const success = await handleAddPinStaff(payload);
                    if (success) setAddStaffOpen(false);
                }}
            />

            <ProvisionDeviceModal
                open={addDeviceOpen}
                loading={false}
                availableZones={availableZones}
                restaurantSlug={restaurantSlug}
                onClose={() => setAddDeviceOpen(false)}
                onProvision={async payload => {
                    const device = await handleProvisionDevice(payload);
                    return device;
                }}
            />

            <RolePermissionDrawer
                open={roleDrawerOpen}
                loading={roleSaving}
                staff={selectedStaff}
                onClose={() => {
                    setRoleDrawerOpen(false);
                    setSelectedStaff(null);
                }}
                onSave={onRoleSaveWrapper}
            />
        </div>
    );
}
