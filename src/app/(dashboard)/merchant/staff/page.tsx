'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, MoreHorizontal, Plus, Shield, UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { InviteStaffModal } from '@/components/merchant/InviteStaffModal';
import { RolePermissionDrawer } from '@/components/merchant/RolePermissionDrawer';

type StaffMember = {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean | null;
    created_at: string | null;
};

const ROLE_BADGE: Record<string, string> = {
    owner: 'bg-purple-50 text-purple-600',
    admin: 'bg-indigo-50 text-indigo-600',
    manager: 'bg-blue-50 text-blue-600',
    kitchen: 'bg-orange-50 text-orange-600',
    waiter: 'bg-green-50 text-green-600',
    bar: 'bg-pink-50 text-pink-600',
};

type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter' | 'bar';

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
    const [roleSaving, setRoleSaving] = useState(false);
    const [activeUpdatingId, setActiveUpdatingId] = useState<string | null>(null);

    const fetchStaff = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/staff', { method: 'GET' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to fetch staff.');
            }
            setStaff((payload?.data?.staff ?? []) as StaffMember[]);
        } catch (fetchError) {
            console.error(fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch staff.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchStaff();
    }, [fetchStaff]);

    const totalStaff = staff.length;
    const activeStaff = useMemo(
        () => staff.filter((member) => member.is_active !== false).length,
        [staff]
    );
    const inactiveStaff = totalStaff - activeStaff;
    const activeRate = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

    const handleInvite = async (payload: { email: string | null; role: StaffRole }) => {
        try {
            setInviteLoading(true);
            const response = await fetch('/api/staff/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create invite.');
            }
            setInviteUrl(result?.data?.invite_url ?? null);
            toast.success('Staff invite created.');
        } catch (inviteError) {
            toast.error(inviteError instanceof Error ? inviteError.message : 'Failed to create invite.');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRoleUpdate = async (staffId: string, role: StaffRole) => {
        try {
            setRoleSaving(true);
            const response = await fetch(`/api/staff/${staffId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to update role.');
            }

            setStaff((previous) =>
                previous.map((member) => (member.id === staffId ? { ...member, role } : member))
            );
            setRoleDrawerOpen(false);
            setSelectedStaff(null);
            toast.success('Role updated.');
        } catch (roleError) {
            toast.error(roleError instanceof Error ? roleError.message : 'Failed to update role.');
        } finally {
            setRoleSaving(false);
        }
    };

    const handleActiveToggle = async (member: StaffMember) => {
        try {
            const nextValue = member.is_active === false;
            setActiveUpdatingId(member.id);
            const response = await fetch(`/api/staff/${member.id}/active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: nextValue }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to update active status.');
            }

            setStaff((previous) =>
                previous.map((staffMember) =>
                    staffMember.id === member.id ? { ...staffMember, is_active: nextValue } : staffMember
                )
            );
            toast.success(nextValue ? 'Staff activated.' : 'Staff deactivated.');
        } catch (activeError) {
            toast.error(activeError instanceof Error ? activeError.message : 'Failed to update active status.');
        } finally {
            setActiveUpdatingId(null);
        }
    };

    return (
        <div className="space-y-8 pb-20 min-h-screen">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 font-medium">Manage your team and permissions.</p>
                    {error && <p className="text-xs mt-2 text-amber-700 font-semibold">{error}</p>}
                </div>
                <button
                    onClick={() => {
                        setInviteUrl(null);
                        setInviteOpen(true);
                    }}
                    className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-[2rem] h-[180px] shadow-sm">
                    <div className="flex justify-between items-start">
                        <Users className="h-4 w-4 text-gray-700" />
                        <h3 className="text-4xl font-bold text-gray-900">{totalStaff}</h3>
                    </div>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Total Staff</p>
                    <p className="text-xs text-gray-500">Live staff directory count</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] h-[180px] shadow-sm">
                    <div className="flex justify-between items-start">
                        <UserCheck className="h-4 w-4 text-green-700" />
                        <h3 className="text-4xl font-bold text-gray-900">{activeStaff}</h3>
                    </div>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Active</p>
                    <p className="text-xs text-gray-500">Staff currently enabled</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] h-[180px] shadow-sm">
                    <div className="flex justify-between items-start">
                        <Shield className="h-4 w-4 text-blue-700" />
                        <h3 className="text-4xl font-bold text-gray-900">{inactiveStaff}</h3>
                    </div>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Inactive</p>
                    <p className="text-xs text-gray-500">Staff currently disabled</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] h-[180px] shadow-sm">
                    <div className="flex justify-between items-start">
                        <CheckCircle className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-4xl font-bold text-gray-900">{activeRate}%</h3>
                    </div>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Activation Rate</p>
                    <p className="text-xs text-gray-500">Enabled accounts ratio</p>
                </div>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white p-6 rounded-[2.5rem] shadow-sm min-h-[260px] animate-pulse">
                            <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                            <div className="mt-5 h-4 w-28 rounded bg-gray-100" />
                            <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
                            <div className="mt-8 h-9 w-full rounded-xl bg-gray-100" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && staff.length === 0 && (
                <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                    <p className="text-base font-semibold text-gray-700">No staff records found.</p>
                    <p className="text-sm mt-1 text-gray-500">Invite your first team member to start operations.</p>
                    <button
                        onClick={() => {
                            setInviteUrl(null);
                            setInviteOpen(true);
                        }}
                        className="mt-4 h-11 px-5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                        Invite Staff
                    </button>
                </div>
            )}

            {!loading && staff.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {staff.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col gap-6 relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-bold shadow-sm bg-gray-100 text-gray-700">
                                    {member.user_id.slice(0, 2).toUpperCase()}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedStaff(member);
                                        setRoleDrawerOpen(true);
                                    }}
                                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors"
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Staff {member.user_id.slice(0, 8)}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className={cn(
                                            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                                            ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'
                                        )}
                                    >
                                        {member.role}
                                    </span>
                                    <span
                                        className={cn(
                                            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                                            member.is_active === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                                        )}
                                    >
                                        {member.is_active === false ? 'inactive' : 'active'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-dashed border-gray-100 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStaff(member);
                                        setRoleDrawerOpen(true);
                                    }}
                                    className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Edit Role
                                </button>
                                <button
                                    type="button"
                                    disabled={activeUpdatingId === member.id}
                                    onClick={() => {
                                        void handleActiveToggle(member);
                                    }}
                                    className={cn(
                                        'h-10 px-3 rounded-xl text-xs font-semibold disabled:opacity-50',
                                        member.is_active === false
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )}
                                >
                                    {activeUpdatingId === member.id
                                        ? 'Updating...'
                                        : member.is_active === false
                                        ? 'Activate'
                                        : 'Deactivate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <InviteStaffModal
                open={inviteOpen}
                loading={inviteLoading}
                inviteUrl={inviteUrl}
                onClose={() => setInviteOpen(false)}
                onInvite={handleInvite}
            />

            <RolePermissionDrawer
                open={roleDrawerOpen}
                loading={roleSaving}
                staff={selectedStaff}
                onClose={() => {
                    setRoleDrawerOpen(false);
                    setSelectedStaff(null);
                }}
                onSave={handleRoleUpdate}
            />
        </div>
    );
}
