'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GuestDirectory, type GuestDirectoryRow } from '@/components/merchant/GuestDirectory';
import { GuestProfileDrawer } from '@/components/merchant/GuestProfileDrawer';

type Segment = 'all' | 'vip' | 'returning' | 'new';

type GuestDetail = {
    id: string;
    name: string | null;
    language: string;
    tags: string[];
    is_vip: boolean;
    notes: string | null;
    visit_count: number;
    lifetime_value: number;
    first_seen_at: string;
    last_seen_at: string;
};

type GuestVisit = {
    id: string;
    channel: string;
    visited_at: string;
    spend: number;
    order_id: string | null;
    metadata: Record<string, unknown>;
};

export default function GuestsPage() {
    const [guests, setGuests] = useState<GuestDirectoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [segment, setSegment] = useState<Segment>('all');
    const [tagFilter, setTagFilter] = useState('');
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
    const [selectedGuest, setSelectedGuest] = useState<GuestDetail | null>(null);
    const [guestVisits, setGuestVisits] = useState<GuestVisit[]>([]);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);

    const fetchGuests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (query.trim().length > 0) params.set('query', query.trim());
            if (segment !== 'all') params.set('segment', segment);
            if (tagFilter.trim().length > 0) params.set('tag', tagFilter.trim());
            params.set('limit', '100');

            const response = await fetch(`/api/guests?${params.toString()}`, { method: 'GET', cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load guests.');
            }
            setGuests((payload?.data?.guests ?? []) as GuestDirectoryRow[]);
        } catch (fetchError) {
            console.error(fetchError);
            setGuests([]);
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load guests.');
        } finally {
            setLoading(false);
        }
    }, [query, segment, tagFilter]);

    const fetchGuestDrawerData = useCallback(async (guestId: string) => {
        try {
            setDrawerLoading(true);
            const [guestRes, visitsRes] = await Promise.all([
                fetch(`/api/guests/${guestId}`, { method: 'GET', cache: 'no-store' }),
                fetch(`/api/guests/${guestId}/visits?limit=20`, { method: 'GET', cache: 'no-store' }),
            ]);

            const [guestPayload, visitsPayload] = await Promise.all([guestRes.json(), visitsRes.json()]);

            if (!guestRes.ok) {
                throw new Error(guestPayload?.error ?? 'Failed to load guest profile.');
            }
            if (!visitsRes.ok) {
                throw new Error(visitsPayload?.error ?? 'Failed to load guest visits.');
            }

            setSelectedGuest((guestPayload?.data ?? null) as GuestDetail | null);
            setGuestVisits((visitsPayload?.data?.visits ?? []) as GuestVisit[]);
        } catch (drawerError) {
            console.error(drawerError);
            toast.error(drawerError instanceof Error ? drawerError.message : 'Failed to load guest details.');
            setSelectedGuest(null);
            setGuestVisits([]);
        } finally {
            setDrawerLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchGuests();
        }, 250);
        return () => window.clearTimeout(timer);
    }, [fetchGuests, refreshToken]);

    useEffect(() => {
        if (!selectedGuestId) return;
        void fetchGuestDrawerData(selectedGuestId);
    }, [selectedGuestId, fetchGuestDrawerData, refreshToken]);

    const openGuest = async (guestId: string) => {
        setSelectedGuestId(guestId);
    };

    const closeDrawer = () => {
        setSelectedGuestId(null);
        setSelectedGuest(null);
        setGuestVisits([]);
    };

    const handleGuestSave = async (payload: {
        guestId: string;
        name?: string;
        language?: 'en' | 'am';
        tags?: string[];
        is_vip?: boolean;
        notes?: string | null;
    }) => {
        try {
            setDrawerSaving(true);
            const response = await fetch(`/api/guests/${payload.guestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(payload.name !== undefined ? { name: payload.name } : {}),
                    ...(payload.language !== undefined ? { language: payload.language } : {}),
                    ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
                    ...(payload.is_vip !== undefined ? { is_vip: payload.is_vip } : {}),
                    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to save guest profile.');
            }

            toast.success('Guest profile updated.');
            setRefreshToken((value) => value + 1);
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : 'Failed to save guest profile.');
        } finally {
            setDrawerSaving(false);
        }
    };

    const stats = useMemo(() => {
        const totalGuests = guests.length;
        const vipCount = guests.filter((guest) => guest.is_vip).length;
        const returningCount = guests.filter((guest) => guest.visit_count >= 2).length;
        const ltvTotal = guests.reduce((sum, guest) => sum + Number(guest.lifetime_value ?? 0), 0);
        return { totalGuests, vipCount, returningCount, ltvTotal };
    }, [guests]);

    return (
        <div className="min-h-screen space-y-8 pb-20">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">Guests</h1>
                    <p className="font-medium text-gray-500">CRM starter with profiles, tags, and visit history.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="h-[160px] rounded-[2rem] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <Users className="h-4 w-4 text-gray-700" />
                        <h3 className="text-4xl font-bold text-gray-900">{stats.totalGuests}</h3>
                    </div>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Guests in Segment</p>
                </div>
                <div className="h-[160px] rounded-[2rem] bg-white p-5 shadow-sm">
                    <h3 className="text-4xl font-bold text-gray-900">{stats.vipCount}</h3>
                    <p className="mt-6 text-sm font-semibold text-gray-900">VIP Guests</p>
                </div>
                <div className="h-[160px] rounded-[2rem] bg-white p-5 shadow-sm">
                    <h3 className="text-4xl font-bold text-gray-900">{stats.returningCount}</h3>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Returning Guests</p>
                </div>
                <div className="h-[160px] rounded-[2rem] bg-white p-5 shadow-sm">
                    <h3 className="text-4xl font-bold text-gray-900">{stats.ltvTotal.toFixed(2)}</h3>
                    <p className="mt-6 text-sm font-semibold text-gray-900">Visible LTV (ETB)</p>
                </div>
            </div>

            <GuestDirectory
                guests={guests}
                loading={loading}
                error={error}
                query={query}
                onQueryChange={setQuery}
                segment={segment}
                onSegmentChange={setSegment}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                onOpenGuest={openGuest}
            />

            <GuestProfileDrawer
                open={selectedGuestId !== null}
                guest={selectedGuest}
                visits={guestVisits}
                loading={drawerLoading}
                saving={drawerSaving}
                onClose={closeDrawer}
                onSave={handleGuestSave}
            />
        </div>
    );
}
