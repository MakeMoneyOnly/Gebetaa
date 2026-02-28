import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Sidebar } from '@/components/merchant/Sidebar';
import { RightPanel } from '@/components/merchant/RightPanel';
import { CommandBarShell } from '@/components/merchant/CommandBarShell';
import { MobileBottomNav } from '@/components/merchant/MobileBottomNav';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>
            {/* data-lenis-prevent tells Lenis to not control scrolling in this container */}
            <div className="font-manrope flex h-screen overflow-hidden bg-white" data-lenis-prevent>
                {/* 1. Sidebar (Fixed Left) */}
                <Sidebar />

                {/* 2. Main Content (Center Scrollable area) */}
                {/* 
                    - md:ml-[280px] accounts for Sidebar width 
                    - xl:mr-[380px] accounts for RightPanel width 
                    - overflow-y-auto makes this section independently scrollable
                    - h-screen ensures it takes full viewport height
                */}
                <main className="h-screen flex-1 overflow-y-auto bg-white transition-all duration-300 md:ml-[280px] xl:mr-[380px]">
                    <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6 md:pb-8 lg:p-12">
                        {children}
                    </div>
                </main>

                {/* 3. Right Panel (Fixed Right - Hidden on smaller screens) */}
                {/* The RightPanel component already has its own overflow-y-auto */}
                <RightPanel />
                <MobileBottomNav />
                <CommandBarShell />
            </div>
        </RoleGuard>
    );
}
