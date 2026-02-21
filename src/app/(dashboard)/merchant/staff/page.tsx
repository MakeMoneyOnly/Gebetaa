'use client';

import React, { useMemo, useState } from 'react';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { useStaff, StaffMember } from '@/hooks/useStaff';
import { InviteStaffModal } from '@/components/merchant/InviteStaffModal';
import { RolePermissionDrawer } from '@/components/merchant/RolePermissionDrawer';
import { MetricCard } from '@/components/merchant/MetricCard';
import { Users, UserCheck, Shield, CheckCircle } from 'lucide-react';
import { StaffHeader, ViewMode } from '@/components/merchant/StaffHeader';
import { StaffGrid } from '@/components/merchant/StaffGrid';
import { StaffTable } from '@/components/merchant/StaffTable';

export default function StaffPage() {
    const {
        staff,
        loading: dataLoading,
        activeUpdatingId,
        handleRoleUpdate,
        handleActiveToggle,
        inviteLoading,
        inviteUrl,
        setInviteUrl,
        handleInvite,
    } = useStaff();

    // We use the page load guard to ensure skeleton is shown on first meaningful paint
    const { loading: pageLoading, markLoaded } = usePageLoadGuard('staff');

    // Sync data loading with page guard
    React.useEffect(() => {
        if (!dataLoading) {
            markLoaded();
        }
    }, [dataLoading, markLoaded]);

    const displayLoading = dataLoading || pageLoading;

    // Local UI State
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [inviteOpen, setInviteOpen] = useState(false);
    const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [roleSaving, setRoleSaving] = useState(false);

    // Derived State
    const totalStaff = staff.length;
    const activeStaff = useMemo(
        () => staff.filter(member => member.is_active !== false).length,
        [staff]
    );
    const inactiveStaff = totalStaff - activeStaff;
    const activeRate = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

    const onRoleSaveWrapper = async (staffId: string, role: any) => {
        setRoleSaving(true);
        const success = await handleRoleUpdate(staffId, role);
        setRoleSaving(false);
        if (success) {
            setRoleDrawerOpen(false);
            setSelectedStaff(null);
        }
    };

    return (
        <div className="min-h-screen space-y-8 pb-20">
            <StaffHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onInvite={() => {
                    setInviteUrl(null);
                    setInviteOpen(true);
                }}
            />

            {/* Metrics Section */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={Users}
                    chip="TOTAL"
                    value={totalStaff}
                    label="Provisioned Profiles"
                    subLabel="Active access identities"
                    tone="purple"
                    progress={Math.min(20, Math.max(1, totalStaff))}
                    targetLabel="Target: -"
                    currentLabel={`${totalStaff} Profiles`}
                />
                <MetricCard
                    icon={UserCheck}
                    chip="ACTIVE"
                    value={activeStaff}
                    label="Enabled"
                    subLabel="Profiles currently enabled"
                    tone="blue"
                    progress={Math.min(
                        20,
                        Math.max(1, Math.round((activeStaff / (totalStaff || 1)) * 20))
                    )}
                    targetLabel={`Total: ${totalStaff}`}
                    currentLabel={`Active: ${activeStaff}`}
                />
                <MetricCard
                    icon={Shield}
                    chip="INACTIVE"
                    value={inactiveStaff}
                    label="Disabled"
                    subLabel="Profiles currently disabled"
                    tone="amber"
                    progress={Math.min(
                        20,
                        Math.max(0, Math.round((inactiveStaff / (totalStaff || 1)) * 20))
                    )}
                    targetLabel={`Total: ${totalStaff}`}
                    currentLabel={`Inactive: ${inactiveStaff}`}
                />
                <MetricCard
                    icon={CheckCircle}
                    chip="RATE"
                    value={`${activeRate}%`}
                    label="Enablement Rate"
                    subLabel="Enabled profile ratio"
                    tone="green"
                    progress={Math.min(20, Math.max(1, Math.round((activeRate / 100) * 20)))}
                    targetLabel="Target: 100%"
                    currentLabel={`Current: ${activeRate}%`}
                />
            </div>

            {/* Content Section */}
            {displayLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="min-h-[260px] animate-pulse rounded-[2.5rem] bg-white p-6 shadow-sm"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                            <div className="mt-5 h-4 w-28 rounded bg-gray-100" />
                            <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
                            <div className="mt-8 h-9 w-full rounded-xl bg-gray-100" />
                        </div>
                    ))}
                </div>
            ) : staff.length === 0 ? (
                <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                    <p className="text-base font-semibold text-gray-700">
                        No access profiles found.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first provisioning link for Kitchen, Waiter, or Manager access.
                    </p>
                    <button
                        onClick={() => {
                            setInviteUrl(null);
                            setInviteOpen(true);
                        }}
                        className="mt-4 h-11 rounded-xl bg-black px-5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                    >
                        Create Provisioning Link
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <StaffTable
                            staff={staff}
                            onEditRole={member => {
                                setSelectedStaff(member);
                                setRoleDrawerOpen(true);
                            }}
                            onToggleActive={handleActiveToggle}
                            updatingId={activeUpdatingId}
                        />
                    ) : (
                        <StaffGrid
                            staff={staff}
                            onEditRole={member => {
                                setSelectedStaff(member);
                                setRoleDrawerOpen(true);
                            }}
                            onToggleActive={handleActiveToggle}
                            updatingId={activeUpdatingId}
                        />
                    )}
                </>
            )}

            <InviteStaffModal
                open={inviteOpen}
                loading={inviteLoading}
                inviteUrl={inviteUrl}
                onClose={() => setInviteOpen(false)}
                onInvite={async payload => {
                    await handleInvite(payload);
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
