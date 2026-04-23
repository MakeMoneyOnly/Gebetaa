import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardLayoutClient } from '@/components/merchant/DashboardLayoutClient';

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

            <DashboardLayoutClient>
                <RoleGuard allowedRoles={['owner', 'admin', 'manager']}>{children}</RoleGuard>
            </DashboardLayoutClient>
        </div>
    );
}
