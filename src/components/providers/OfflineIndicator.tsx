'use client';

import { useEffect, useState, useCallback } from 'react';
import { WifiOff, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
    /**
     * Position of the indicator on screen
     * @default 'top'
     */
    position?: 'top' | 'bottom';
    /**
     * Whether to show sync status
     * @default true
     */
    showSyncStatus?: boolean;
    /**
     * Custom className for styling
     */
    className?: string;
    /**
     * Pending operations count (from offline queue)
     */
    pendingCount?: number;
    /**
     * Callback when user clicks retry
     */
    onRetry?: () => void;
    /**
     * Whether sync is in progress
     */
    isSyncing?: boolean;
    /**
     * Last sync timestamp
     */
    lastSyncAt?: Date | null;
}

interface NetworkStatus {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt: Date | null;
    syncError: string | null;
}

/**
 * OfflineIndicator - Shows network status and sync progress
 *
 * Part of PWA offline-first implementation
 * Integrates with Dexie.js offline queue for pending operations
 */
export function OfflineIndicator({
    position = 'top',
    showSyncStatus = true,
    className,
    pendingCount: initialPendingCount = 0,
    onRetry,
    isSyncing: initialIsSyncing = false,
    lastSyncAt: initialLastSyncAt = null,
}: OfflineIndicatorProps) {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: true,
        isSyncing: initialIsSyncing,
        pendingCount: initialPendingCount,
        lastSyncAt: initialLastSyncAt,
        syncError: null,
    });

    // Listen for online/offline events
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkServerReachable = async () => {
            try {
                // Ping the health route to confirm if server is actually reachable
                const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
                return res.ok;
            } catch {
                return false;
            }
        };

        const handleOnline = () => {
            setStatus(prev => ({ ...prev, isOnline: true, syncError: null }));
            // Trigger sync when back online
            if (onRetry) {
                onRetry();
            }
        };

        const handleOffline = async () => {
            // navigator.onLine may be false on local networks without global internet
            const isReachable = await checkServerReachable();
            if (isReachable) {
                setStatus(prev => ({ ...prev, isOnline: true, syncError: null }));
            } else {
                setStatus(prev => ({ ...prev, isOnline: false }));
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial state
        const initializeStatus = async () => {
            if (navigator.onLine) {
                setStatus(prev => ({ ...prev, isOnline: true }));
            } else {
                const isReachable = await checkServerReachable();
                setStatus(prev => ({ ...prev, isOnline: isReachable }));
            }
        };

        initializeStatus();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [onRetry]);

    // Poll for pending sync operations
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkPendingOperations = async () => {
            try {
                // Try to get pending count from Dexie offline queue
                const { getPendingOrders } = await import('@/lib/offlineQueue');
                const pending = await getPendingOrders();
                setStatus(prev => ({
                    ...prev,
                    pendingCount: pending.length,
                }));
            } catch {
                // Dexie might not be available, ignore
            }
        };

        // Initial check
        checkPendingOperations();

        // Poll every 10 seconds
        const interval = setInterval(checkPendingOperations, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleRetry = useCallback(() => {
        if (!status.isOnline || status.isSyncing) return;

        setStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));

        // Trigger sync
        if (onRetry) {
            onRetry();
        }

        // Simulate sync completion (in real implementation, this would be event-driven)
        setTimeout(() => {
            setStatus(prev => ({
                ...prev,
                isSyncing: false,
                lastSyncAt: new Date(),
                pendingCount: 0,
            }));
        }, 2000);
    }, [status.isOnline, status.isSyncing, onRetry]);

    // Don't show anything if online and no pending operations
    if (status.isOnline && status.pendingCount === 0 && !status.isSyncing) {
        return null;
    }

    const isOffline = !status.isOnline;
    const hasPendingOps = status.pendingCount > 0;
    const hasError = status.syncError !== null;

    return (
        <div
            className={cn(
                'fixed right-0 left-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 transition-all duration-300',
                position === 'top' ? 'top-0' : 'bottom-0',
                isOffline
                    ? 'bg-amber-500/90 text-white'
                    : hasError
                      ? 'bg-red-500/90 text-white'
                      : status.isSyncing
                        ? 'bg-blue-500/90 text-white'
                        : hasPendingOps
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-green-500/90 text-white',
                className
            )}
        >
            {isOffline ? (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">You're offline</span>
                    {showSyncStatus && hasPendingOps && (
                        <span className="text-sm opacity-90">
                            ({status.pendingCount} pending{' '}
                            {status.pendingCount === 1 ? 'operation' : 'operations'})
                        </span>
                    )}
                </>
            ) : status.isSyncing ? (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Syncing...</span>
                    {showSyncStatus && hasPendingOps && (
                        <span className="text-sm opacity-90">
                            ({status.pendingCount} remaining)
                        </span>
                    )}
                </>
            ) : hasError ? (
                <>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Sync failed</span>
                    <button
                        onClick={handleRetry}
                        className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-medium hover:bg-white/30"
                    >
                        Retry
                    </button>
                </>
            ) : hasPendingOps ? (
                <>
                    <CloudOff className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        {status.pendingCount}{' '}
                        {status.pendingCount === 1 ? 'operation' : 'operations'} pending sync
                    </span>
                    <button
                        onClick={handleRetry}
                        disabled={!status.isOnline}
                        className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-medium hover:bg-white/30 disabled:opacity-50"
                    >
                        Sync Now
                    </button>
                </>
            ) : (
                <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">All synced</span>
                </>
            )}
        </div>
    );
}

/**
 * Hook for managing offline/online state with sync integration
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkServerReachable = async () => {
            try {
                const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
                return res.ok;
            } catch {
                return false;
            }
        };

        const initializeStatus = async () => {
            if (navigator.onLine) {
                setIsOnline(true);
            } else {
                const isReachable = await checkServerReachable();
                setIsOnline(isReachable);
            }
        };

        initializeStatus();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = async () => {
            const isReachable = await checkServerReachable();
            setIsOnline(isReachable);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Check for pending operations periodically
    useEffect(() => {
        const checkPending = async () => {
            try {
                const { getPendingOrders } = await import('@/lib/offlineQueue');
                const pending = await getPendingOrders();
                setPendingCount(pending.length);
            } catch {
                // Dexie might not be available
            }
        };

        checkPending();
        const interval = setInterval(checkPending, 10000);

        return () => clearInterval(interval);
    }, []);

    const triggerSync = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);

        try {
            // Trigger sync via service worker or direct
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SYNC_PENDING_OPERATIONS',
                });
            }

            // Note: The actual sync is handled by the service worker or the sync module
            // The offlineQueue module is deprecated - use @/lib/sync for new implementations
            // For now, we just trigger the service worker message above
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
            // Refresh pending count after a short delay
            setTimeout(async () => {
                try {
                    const { getPendingOrders } = await import('@/lib/offlineQueue');
                    const pending = await getPendingOrders();
                    setPendingCount(pending.length);
                } catch {
                    // Dexie might not be available
                }
            }, 1000);
        }
    }, [isOnline, isSyncing]);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        triggerSync,
    };
}

/**
 * Composable hook that combines offline indicator with sync functionality
 */
export function useOfflineSync() {
    const { isOnline, isSyncing, pendingCount, triggerSync } = useNetworkStatus();

    return {
        isOffline: !isOnline,
        isOnline,
        isSyncing,
        pendingCount,
        triggerSync,
        hasPendingOperations: pendingCount > 0,
    };
}
