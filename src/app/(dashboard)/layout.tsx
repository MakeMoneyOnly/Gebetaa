import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Sidebar } from '@/components/merchant/Sidebar';
import { RightPanel } from '@/components/merchant/RightPanel';
import { CommandBarShell } from '@/components/merchant/CommandBarShell';
import { MobileBottomNav } from '@/components/merchant/MobileBottomNav';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

/**
 * Skip Link Component for Accessibility
 * Allows keyboard users to skip directly to main content
 */
function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            Skip to main content
        </a>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-manrope flex h-screen overflow-hidden bg-white" data-lenis-prevent>
            {/* Skip Link for Accessibility */}
            <SkipLink />

            {/* 1. Sidebar (Fixed Left) */}
            <Sidebar />

            {/* 2. Main Content (Center Scrollable area) */}
            <main
                id="main-content"
                className="h-screen flex-1 overflow-y-auto bg-white transition-all duration-300 md:ml-[280px] xl:mr-[380px]"
                tabIndex={-1}
            >
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
