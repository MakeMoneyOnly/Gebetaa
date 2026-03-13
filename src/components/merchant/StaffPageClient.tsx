'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { StaffPageData, StaffMemberSummary } from '@/lib/services/dashboardDataService';

interface StaffPageClientProps {
    initialData: StaffPageData | null;
}

export function StaffPageClient({ initialData }: StaffPageClientProps) {
    const { markLoaded } = usePageLoadGuard('staff');

    const [staff, setStaff] = useState<StaffMemberSummary[]>(initialData?.staff ?? []);
    const [refreshing, setRefreshing] = useState(false);

    const restaurantId = initialData?.restaurant_id;

    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    const refreshData = useCallback(async () => {
        if (!restaurantId) return;
        setRefreshing(true);
        try {
            const response = await fetch('/api/staff');
            const result = await response.json();
            if (response.ok) {
                setStaff(result.data?.staff ?? []);
            }
        } catch (error) {
            console.error('Failed to refresh staff:', error);
            toast.error('Failed to refresh staff');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId]);

    const handleToggleActive = useCallback(async (staffId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setStaff(prev =>
            prev.map(s => (s.id === staffId ? { ...s, is_active: newStatus } : s))
        );

        try {
            const response = await fetch(`/api/staff/${staffId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update staff member');
            toast.success(newStatus ? 'Staff member activated' : 'Staff member deactivated');
        } catch (error) {
            setStaff(prev =>
                prev.map(s => (s.id === staffId ? { ...s, is_active: currentStatus } : s))
            );
            toast.error('Failed to update staff member');
        }
    }, []);

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.is_active).length,
        byRole: staff.reduce((acc, s) => {
            const role = s.role ?? 'unknown';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Staff</h1>
                    <p className="font-medium text-gray-500">Manage your restaurant staff.</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">Active</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">By Role</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(stats.byRole).map(([role, count]) => (
                            <span key={role} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">
                                {role}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map(member => (
                    <div
                        key={member.id}
                        className={cn(
                            'rounded-2xl p-6 ring-1',
                            member.is_active
                                ? 'bg-white ring-gray-100'
                                : 'bg-gray-50 ring-gray-200 opacity-60'
                        )}
                    >
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{member.name ?? 'Unknown'}</h3>
                                <p className="text-sm text-gray-500 capitalize">{(member.role ?? 'unknown').replace('_', ' ')}</p>
                            </div>
                            <button
                                onClick={() => handleToggleActive(member.id, member.is_active)}
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-bold',
                                    member.is_active
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-200 text-gray-600'
                                )}
                            >
                                {member.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                        {member.email && (
                            <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}