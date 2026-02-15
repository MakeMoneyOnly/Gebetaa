import React from 'react';
import { Card } from '@/components/ui/Card';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function KDSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['kitchen', 'admin', 'manager', 'owner']}>
            <div className="h-screen w-screen overflow-hidden bg-neutral-900 text-white font-mono flex flex-col">
                {/* KDS Header - High Contrast */}
                <header className="h-14 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-bold text-lg tracking-wider">KITCHEN DISPLAY</span>
                    </div>
                    <div className="flex gap-4 text-sm font-medium text-neutral-400">
                        <span>AVG TIME: 12:00</span>
                        <span>PENDING: 8</span>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative bg-neutral-900">
                    {children}
                </main>
            </div>
        </RoleGuard>
    );
}
