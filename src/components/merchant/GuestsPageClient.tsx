'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { GuestsPageData, GuestSummary } from '@/lib/services/dashboardDataService';

interface GuestsPageClientProps {
    initialData: GuestsPageData | null;
}

export function GuestsPageClient({ initialData }: GuestsPageClientProps) {
    const { markLoaded } = usePageLoadGuard('guests');

    const [guests, setGuests] = useState<GuestSummary[]>(initialData?.guests ?? []);
    const [totalCount, setTotalCount] = useState(initialData?.total_count ?? 0);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuest, setSelectedGuest] = useState<GuestSummary | null>(null);

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
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);

            const response = await fetch(`/api/guests?${params}`);
            const result = await response.json();
            if (response.ok) {
                setGuests(result.data?.guests ?? []);
                setTotalCount(result.data?.total_count ?? 0);
            }
        } catch (error) {
            console.error('Failed to refresh guests:', error);
            toast.error('Failed to refresh guests');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId, searchQuery]);

    const handleToggleVip = useCallback(async (guestId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setGuests(prev => prev.map(g => (g.id === guestId ? { ...g, is_vip: newStatus } : g)));

        try {
            const response = await fetch(`/api/guests/${guestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_vip: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update guest');
            toast.success(newStatus ? 'Marked as VIP' : 'Removed VIP status');
        } catch (error) {
            setGuests(prev =>
                prev.map(g => (g.id === guestId ? { ...g, is_vip: currentStatus } : g))
            );
            toast.error('Failed to update guest');
        }
    }, []);

    const filteredGuests = searchQuery
        ? guests.filter(
              g =>
                  g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  g.phone?.includes(searchQuery)
          )
        : guests;

    const stats = {
        total: totalCount,
        vip: guests.filter(g => g.is_vip).length,
        newThisMonth: guests.filter(g => {
            if (!g.first_seen_at) return false;
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(g.first_seen_at) > monthAgo;
        }).length,
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Guests</h1>
                    <p className="font-medium text-gray-500">
                        Manage your guest directory and profiles.
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Guests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-sm font-medium text-amber-600">VIP Guests</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.vip}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">New This Month</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.newThisMonth}</p>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none"
                />
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50/60">
                            <tr className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                                <th className="px-5 py-4">Name</th>
                                <th className="px-5 py-4">Phone</th>
                                <th className="px-5 py-4">Visits</th>
                                <th className="px-5 py-4">Lifetime Value</th>
                                <th className="px-5 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                        No guests found
                                    </td>
                                </tr>
                            ) : (
                                filteredGuests.map(guest => (
                                    <tr
                                        key={guest.id}
                                        onClick={() => setSelectedGuest(guest)}
                                        className="cursor-pointer border-b border-gray-50 transition-colors duration-150 last:border-0 hover:bg-gray-50/50"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-gray-900">
                                                {guest.name ?? 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-600">
                                                {guest.phone ?? 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {guest.visit_count}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-gray-900">
                                                {guest.lifetime_value.toLocaleString()} ETB
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleToggleVip(guest.id, guest.is_vip);
                                                }}
                                                className={cn(
                                                    'rounded-full px-3 py-1 text-[11px] font-bold uppercase',
                                                    guest.is_vip
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                )}
                                            >
                                                {guest.is_vip ? 'VIP' : 'Regular'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
