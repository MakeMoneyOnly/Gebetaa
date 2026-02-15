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
            <div className="flex bg-white min-h-screen font-manrope">
                {/* 1. Sidebar (Fixed Left) */}
                <Sidebar />

                {/* 2. Main Content (Center Scrollable area) */}
                {/* 
                    - md:ml-[280px] accounts for Sidebar width 
                    - xl:mr-[380px] accounts for RightPanel width 
                */}
                <main className="flex-1 md:ml-[280px] xl:mr-[380px] min-h-screen transition-all duration-300 bg-white">
                    <div className="mx-auto max-w-7xl p-8 lg:p-12">
                        {children}
                    </div>
                </main>

                {/* 3. Right Panel (Fixed Right - Hidden on smaller screens) */}
                <RightPanel />
            </div>
        </RoleGuard>
    );
}
