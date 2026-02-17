import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Sidebar } from '@/components/merchant/Sidebar';
import { RightPanel } from '@/components/merchant/RightPanel';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>
            {/* data-lenis-prevent tells Lenis to not control scrolling in this container */}
            <div className="flex bg-white h-screen overflow-hidden font-manrope" data-lenis-prevent>
                {/* 1. Sidebar (Fixed Left) */}
                <Sidebar />

                {/* 2. Main Content (Center Scrollable area) */}
                {/* 
                    - md:ml-[280px] accounts for Sidebar width 
                    - xl:mr-[380px] accounts for RightPanel width 
                    - overflow-y-auto makes this section independently scrollable
                    - h-screen ensures it takes full viewport height
                */}
                <main className="flex-1 md:ml-[280px] xl:mr-[380px] h-screen overflow-y-auto transition-all duration-300 bg-white">
                    <div className="mx-auto max-w-7xl p-8 lg:p-12">
                        {children}
                    </div>
                </main>

                {/* 3. Right Panel (Fixed Right - Hidden on smaller screens) */}
                {/* The RightPanel component already has its own overflow-y-auto */}
                <RightPanel />
            </div>
        </RoleGuard>
    );
}
