import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export default function KDSLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['kitchen', 'bar', 'admin', 'manager', 'owner']}>
            <div className="font-manrope flex h-dvh w-screen min-h-0 flex-col overflow-hidden bg-gray-50 text-gray-900">
                <main className="relative flex-1 min-h-0 bg-gray-50">{children}</main>
            </div>
        </RoleGuard>
    );
}
