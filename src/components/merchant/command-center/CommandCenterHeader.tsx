'use client';

import { RotateCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { CommandCenterRange } from './types';

interface CommandCenterHeaderProps {
    range: CommandCenterRange;
    onRangeChange: (range: CommandCenterRange) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    syncGeneratedAt?: string;
    syncSource?: string;
    isStale?: boolean;
    error?: string | null;
}

const RANGE_OPTIONS: CommandCenterRange[] = ['today', 'week', 'month'];

function toReadableTime(value?: string) {
    if (!value) return 'Never';
    return new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function CommandCenterHeader({
    range,
    onRangeChange,
    onRefresh,
    isRefreshing,
    syncGeneratedAt,
    syncSource,
    isStale = false,
    error,
}: CommandCenterHeaderProps) {
    const hasSyncError = Boolean(error);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-black">Command Center</h1>
                    <p className="pt-1 text-sm font-medium text-gray-500">
                        Live operations view for orders, requests, alerts, and sync health.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={range}
                        onChange={event => onRangeChange(event.target.value as CommandCenterRange)}
                        className="focus:ring-brand-crimson h-10 rounded-xl bg-white px-3 text-sm font-semibold text-gray-700 capitalize shadow-sm outline-none focus:ring-2"
                    >
                        {RANGE_OPTIONS.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="bg-brand-crimson inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-white transition hover:bg-[#a0151e] disabled:opacity-60"
                    >
                        <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${
                        hasSyncError
                            ? 'bg-rose-100 text-rose-700'
                            : isStale
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                    {hasSyncError ? (
                        <WifiOff className="h-3.5 w-3.5" />
                    ) : isStale ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                        <Wifi className="h-3.5 w-3.5" />
                    )}
                    {hasSyncError ? 'Sync Failed' : isStale ? 'Stale Data' : 'In Sync'}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                    Last sync: {toReadableTime(syncGeneratedAt)} via {syncSource ?? 'unknown'}
                </span>
                {error && (
                    <details className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700 shadow-sm">
                        <summary className="cursor-pointer font-semibold">Diagnostics</summary>
                        <p className="pt-1 text-xs">{error}</p>
                    </details>
                )}
            </div>
        </div>
    );
}
