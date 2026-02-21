'use client';

import React from 'react';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { useStaff } from '@/hooks/useStaff';
import { ScheduleCalendar } from '@/components/merchant/ScheduleCalendar';
import { StaffHeader } from '@/components/merchant/StaffHeader';
import { InviteStaffModal } from '@/components/merchant/InviteStaffModal';

export default function SchedulePage() {
    // We use the same hook so data is cached/consistent
    const {
        staff,
        loading: dataLoading,
        inviteLoading,
        inviteUrl,
        setInviteUrl,
        handleInvite,
    } = useStaff();

    const { loading: pageLoading, markLoaded } = usePageLoadGuard('schedule');

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

            {!displayLoading && <ScheduleCalendar staff={staff} />}

            {displayLoading && (
                <div className="min-h-[600px] animate-pulse rounded-[2.5rem] bg-white p-6 shadow-sm">
                    <div className="mb-4 h-8 w-48 rounded-lg bg-gray-100" />
                    <div className="mb-8 h-4 w-64 rounded bg-gray-100" />
                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-xl bg-gray-50" />
                        ))}
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
