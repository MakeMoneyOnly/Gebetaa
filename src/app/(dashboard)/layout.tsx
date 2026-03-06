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
        <div className="font-manrope flex h-screen overflow-hidden bg-white" data-lenis-prevent>
            {/* 1. Sidebar (Fixed Left) */}
            <Sidebar />

            {/* 2. Main Content (Center Scrollable area) */}
            <main className="h-screen flex-1 overflow-y-auto bg-white transition-all duration-300 md:ml-[280px] xl:mr-[380px]">
                <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6 md:pb-8 lg:p-12">
                    <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>{children}</RoleGuard>
                </div>
            </main>

            {/* 3. Right Panel (Fixed Right - Hidden on smaller screens) */}
            <RightPanel />
            <MobileBottomNav />
            <CommandBarShell />
        </div>
    );
}
