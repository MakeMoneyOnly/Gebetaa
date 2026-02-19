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
        handleInvite
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
        <div className="space-y-8 pb-20 min-h-screen">
            <StaffHeader 
                onInvite={() => {
                    setInviteUrl(null);
                    setInviteOpen(true);
                }}
            />

            {!displayLoading && (
                <ScheduleCalendar staff={staff} />
            )}

            {displayLoading && (
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm min-h-[600px] animate-pulse">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg mb-4" />
                    <div className="h-4 w-64 bg-gray-100 rounded mb-8" />
                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-96 bg-gray-50 rounded-xl" />
                        ))}
                    </div>
                </div>
            )}
            
             <InviteStaffModal
                open={inviteOpen}
                loading={inviteLoading}
                inviteUrl={inviteUrl}
                onClose={() => setInviteOpen(false)}
                onInvite={async (payload) => {
                    await handleInvite(payload);
                }}
            />
        </div>
    );
}
