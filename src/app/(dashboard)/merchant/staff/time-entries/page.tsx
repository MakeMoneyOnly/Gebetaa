'use client';

import React from 'react';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { useStaff } from '@/hooks/useStaff';
import { TimeClockPanel } from '@/components/merchant/TimeClockPanel';
import { StaffHeader } from '@/components/merchant/StaffHeader';
import { InviteStaffModal } from '@/components/merchant/InviteStaffModal';

export default function TimeClockPage() {
    const {
        staff,
        loading: dataLoading,
        inviteLoading,
        inviteUrl,
        setInviteUrl,
        handleInvite,
    } = useStaff();

    // We can add "time-clock" specific guard if needed, or reuse staff
    const { loading: pageLoading, markLoaded } = usePageLoadGuard('time-clock');

    React.useEffect(() => {
        if (!dataLoading) {
            markLoaded();
        }
    }, [dataLoading, markLoaded]);

    const displayLoading = dataLoading || pageLoading;
    const [inviteOpen, setInviteOpen] = React.useState(false);

    return (
        <div className="min-h-screen space-y-8 pb-20">
            <StaffHeader
                onInvite={() => {
                    setInviteUrl(null);
                    setInviteOpen(true);
                }}
            />

            {!displayLoading && <TimeClockPanel staff={staff} />}

            {displayLoading && (
                <div className="min-h-[600px] animate-pulse rounded-[2.5rem] bg-white p-6 shadow-sm">
                    <div className="mb-4 h-8 w-48 rounded-lg bg-gray-100" />
                    <div className="mb-8 h-4 w-64 rounded bg-gray-100" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-48 rounded-xl bg-gray-50" />
                        <div className="h-48 rounded-xl bg-gray-50" />
                    </div>
                </div>
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
        </div>
    );
}
