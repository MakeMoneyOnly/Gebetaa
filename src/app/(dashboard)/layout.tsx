import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Sidebar } from '@/components/merchant/Sidebar';
import { RightPanel } from '@/components/merchant/RightPanel';
import { CommandBarShell } from '@/components/merchant/CommandBarShell';
import { MobileBottomNav } from '@/components/merchant/MobileBottomNav';
import { MerchantHeader } from '@/components/merchant/MerchantHeader';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
            Skip to main content
        </a>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-inter flex h-screen overflow-hidden bg-white" data-lenis-prevent>
            <SkipLink />

            {/* 1. Sidebar (Fixed Left) */}
            <Sidebar />

            {/* 2. Main Space (Center area containing its own Header and Scrollable Content) */}
            <div className="flex flex-1 flex-col overflow-hidden md:ml-[280px] xl:mr-[380px]">
                {/* Global Header (ONLY fits in the center) */}
                <MerchantHeader />

                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto bg-white transition-all duration-300"
                    tabIndex={-1}
                >
                    <div className="w-full px-4 sm:px-6 lg:px-6 pt-2 pb-24 sm:pb-8">
                        <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>{children}</RoleGuard>
                    </div>
                </main>
            </div>

            {/* 3. Right Panel (Full height) */}
            <RightPanel />
            
            <MobileBottomNav />
            <CommandBarShell />
        </div>
    );
}
