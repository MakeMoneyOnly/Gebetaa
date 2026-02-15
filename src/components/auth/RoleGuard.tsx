'use client';

import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    restaurantId?: string; // We need context, usually from URL or global state
    fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, restaurantId, fallback }: RoleGuardProps) {
    const { role, loading } = useRole(restaurantId ?? null);
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!role || !allowedRoles.includes(role))) {
            // Optional: Redirect logic here if strictly enforcing
            // router.push('/unauthorized'); // Or login
        }
    }, [role, loading, allowedRoles, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-surface-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-crimson border-t-transparent"></div>
            </div>
        );
    }

    if (!role || !allowedRoles.includes(role)) {
        return fallback || (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-surface-50 p-6 text-center">
                <h2 className="text-2xl font-bold text-text-primary">Access Denied</h2>
                <p className="mt-2 text-text-secondary">You do not have permission to view this page.</p>
                <div className="mt-6">
                    <button
                        onClick={() => router.push('/')}
                        className="rounded-lg bg-brand-crimson px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-brand-crimson-hover"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
