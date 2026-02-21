import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function KDSLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['kitchen', 'admin', 'manager', 'owner']}>
            <div className="font-manrope flex h-screen w-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
                <main className="relative flex-1 overflow-hidden bg-gray-50">{children}</main>
            </div>
        </RoleGuard>
    );
}
