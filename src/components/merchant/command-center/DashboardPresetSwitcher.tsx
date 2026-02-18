'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export type DashboardPreset = 'owner' | 'manager' | 'kitchen_lead';

export function DashboardPresetSwitcher({
    onPresetResolved,
}: {
    onPresetResolved: (preset: DashboardPreset) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preset, setPreset] = useState<DashboardPreset>('owner');
    const [recommendedPreset, setRecommendedPreset] = useState<DashboardPreset>('owner');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/merchant/dashboard-presets', { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error ?? 'Failed to load dashboard preset.');
                }

                const resolved = (payload?.data?.current_preset ?? payload?.data?.recommended_preset ?? 'owner') as DashboardPreset;
                setPreset(resolved);
                setRecommendedPreset((payload?.data?.recommended_preset ?? 'owner') as DashboardPreset);
                onPresetResolved(resolved);
            } catch {
                const fallback: DashboardPreset = 'owner';
                setPreset(fallback);
                setRecommendedPreset(fallback);
                onPresetResolved(fallback);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [onPresetResolved]);

    const persistPreset = async (nextPreset: DashboardPreset) => {
        setPreset(nextPreset);
        onPresetResolved(nextPreset);
        setSaving(true);

        try {
            const response = await fetch('/api/merchant/dashboard-presets', {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ preset: nextPreset }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to save dashboard preset.');
            }

            toast.success('Dashboard preset updated.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save dashboard preset.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1">
            <span className="px-2 text-xs font-semibold text-gray-500">Preset</span>
            <select
                disabled={loading || saving}
                value={preset}
                onChange={(event) => {
                    void persistPreset(event.target.value as DashboardPreset);
                }}
                className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-700"
            >
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="kitchen_lead">Kitchen Lead</option>
            </select>
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Recommended: {recommendedPreset.replace('_', ' ')}
            </span>
        </div>
    );
}
