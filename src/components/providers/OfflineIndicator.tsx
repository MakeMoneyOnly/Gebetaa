'use client';

import { AlertCircle, CheckCircle2, CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback } from 'react';
import { useSyncStatus } from '@/lib/sync/usePowerSync';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
    position?: 'top' | 'bottom';
    showSyncStatus?: boolean;
    className?: string;
}

const MODE_STYLES = {
    online: {
        icon: CheckCircle2,
        title: 'Online',
        detail: 'Gateway + cloud healthy.',
        tone: 'bg-emerald-500/90 text-white',
    },
    degraded: {
        icon: AlertCircle,
        title: 'Degraded',
        detail: 'Local store active. Cloud/bootstrap degraded.',
        tone: 'bg-amber-500/90 text-white',
    },
    'offline-local': {
        icon: WifiOff,
        title: 'Offline Local',
        detail: 'Store running on LAN only.',
        tone: 'bg-orange-600/90 text-white',
    },
    reconciling: {
        icon: RefreshCw,
        title: 'Reconciling',
        detail: 'Replaying local journal upstream.',
        tone: 'bg-blue-500/90 text-white',
    },
} as const;

export function OfflineIndicator({
    position = 'top',
    showSyncStatus = true,
    className,
}: OfflineIndicatorProps) {
    const { operatingMode, pendingCount, isSyncing, lastSyncAt, sync, bootstrapStatus } =
        useSyncStatus();
    const mode = MODE_STYLES[operatingMode];
    const Icon = mode.icon;

    const handleRetry = useCallback(() => {
        void sync();
    }, [sync]);

    return (
        <div
            className={cn(
                'fixed right-0 left-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2 transition-all duration-300',
                position === 'top' ? 'top-0' : 'bottom-0',
                mode.tone,
                className
            )}
        >
            <Icon className={cn('h-4 w-4', operatingMode === 'reconciling' && 'animate-spin')} />
            <span className="text-sm font-black tracking-[0.16em] uppercase">{mode.title}</span>
            <span className="text-sm font-medium opacity-95">{mode.detail}</span>
            {showSyncStatus && pendingCount > 0 ? (
                <span className="text-sm font-medium opacity-90">
                    {pendingCount} pending {pendingCount === 1 ? 'write' : 'writes'}
                </span>
            ) : null}
            {showSyncStatus && lastSyncAt ? (
                <span className="text-sm opacity-80">
                    Last sync{' '}
                    {lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            ) : null}
            {operatingMode !== 'online' ? (
                <button
                    onClick={handleRetry}
                    disabled={isSyncing}
                    className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold hover:bg-white/30 disabled:opacity-50"
                >
                    {operatingMode === 'reconciling' ? 'Syncing' : 'Retry'}
                </button>
            ) : null}
            {operatingMode === 'degraded' && bootstrapStatus.message ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                    <CloudOff className="h-3 w-3" />
                    {bootstrapStatus.message}
                </span>
            ) : null}
        </div>
    );
}

export function useNetworkStatus() {
    const { isOnline, isSyncing, pendingCount, sync, operatingMode } = useSyncStatus();

    return {
        isOnline,
        isSyncing,
        pendingCount,
        operatingMode,
        triggerSync: sync,
    };
}

export function useOfflineSync() {
    const { isOnline, isSyncing, pendingCount, sync, operatingMode } = useSyncStatus();

    return {
        isOffline: operatingMode === 'offline-local',
        isOnline,
        isSyncing,
        pendingCount,
        operatingMode,
        triggerSync: sync,
        hasPendingOperations: pendingCount > 0,
    };
}
