import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function KDSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['kitchen', 'admin', 'manager', 'owner']}>
            <div className="h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-manrope flex flex-col">
                <main className="flex-1 overflow-hidden relative bg-gray-50">
                    {children}
                </main>
            </div>
        </RoleGuard>
    );
}
