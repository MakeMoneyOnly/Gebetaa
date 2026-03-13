/**
 * Sync Worker
 *
 * CRIT-05: Offline sync consolidation
 * Handles background sync between local PowerSync and server
 */

import {
    getPendingSyncOperations,
    markSyncOperationCompleted,
    markSyncOperationFailed,
    getSyncQueueStatus,
} from './idempotency';

/**
 * Sync worker configuration
 */
export interface SyncWorkerConfig {
    /** Interval in ms for checking pending operations */
    syncIntervalMs: number;
    /** Maximum operations per sync batch */
    batchSize: number;
    /** Enable printer queue processing */
    enablePrinterQueue: boolean;
    /** Callback for sync events */
    onSyncProgress?: (stats: SyncProgress) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
}

/**
 * Sync progress statistics
 */
export interface SyncProgress {
    pendingOperations: number;
    completedOperations: number;
    failedOperations: number;
    printerJobsProcessed: number;
    printerJobsSucceeded: number;
    printerJobsFailed: number;
    lastSyncAt: string | null;
    isOnline: boolean;
}

const DEFAULT_CONFIG: SyncWorkerConfig = {
    syncIntervalMs: 5000, // 5 seconds
    batchSize: 20,
    enablePrinterQueue: true,
};

/**
 * Create a sync worker
 */
export function createSyncWorker(config: Partial<SyncWorkerConfig> = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    let isRunning = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastSyncAt: string | null = null;

    /**
     * Process pending sync operations
     */
    async function processSyncOperations(): Promise<{
        processed: number;
        succeeded: number;
        failed: number;
    }> {
        const operations = await getPendingSyncOperations(cfg.batchSize);

        let processed = 0;
        let succeeded = 0;
        let failed = 0;

        for (const op of operations) {
            processed++;

            try {
                // TODO: Replace with actual API calls to server
                // For now, simulate successful sync
                console.log(
                    `[SyncWorker] Processing ${op.operation} on ${op.table_name}/${op.record_id}`
                );

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 100));

                await markSyncOperationCompleted(op.id);
                succeeded++;
            } catch (error) {
                console.error(`[SyncWorker] Failed to sync operation ${op.id}:`, error);
                await markSyncOperationFailed(op.id, String(error));
                failed++;
                cfg.onError?.(new Error(String(error)));
            }
        }

        return { processed, succeeded, failed };
    }

    /**
     * Process pending print jobs
     */
    async function processPrinterQueue(): Promise<{
        processed: number;
        succeeded: number;
        failed: number;
    }> {
        // This would integrate with the actual printer system
        // For now, just return zeros as we can't print from server
        return { processed: 0, succeeded: 0, failed: 0 };
    }

    /**
     * Get current sync status
     */
    async function getStatus(): Promise<SyncProgress> {
        const queueStats = await getSyncQueueStatus();

        return {
            pendingOperations: queueStats.pending,
            completedOperations: queueStats.completed,
            failedOperations: queueStats.failed,
            printerJobsProcessed: 0,
            printerJobsSucceeded: 0,
            printerJobsFailed: 0,
            lastSyncAt,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        };
    }

    /**
     * Run one sync cycle
     */
    async function syncOnce(): Promise<SyncProgress> {
        if (!navigator.onLine) {
            console.log('[SyncWorker] Offline - skipping sync');
            return getStatus();
        }

        console.log('[SyncWorker] Starting sync cycle');

        const syncResult = await processSyncOperations();

        let _printerResult = { processed: 0, succeeded: 0, failed: 0 };
        if (cfg.enablePrinterQueue) {
            _printerResult = await processPrinterQueue();
        }

        lastSyncAt = new Date().toISOString();

        const status = await getStatus();
        cfg.onSyncProgress?.(status);

        console.log(
            `[SyncWorker] Sync complete: ${syncResult.succeeded} succeeded, ${syncResult.failed} failed`
        );

        return status;
    }

    /**
     * Start the sync worker
     */
    function start() {
        if (isRunning) return;

        isRunning = true;
        intervalId = setInterval(syncOnce, cfg.syncIntervalMs);

        // Run immediately on start
        syncOnce();

        console.log('[SyncWorker] Started');
    }

    /**
     * Stop the sync worker
     */
    function stop() {
        if (!isRunning) return;

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        isRunning = false;
        console.log('[SyncWorker] Stopped');
    }

    return {
        start,
        stop,
        syncOnce,
        getStatus,
        get isRunning() {
            return isRunning;
        },
    };
}

/**
 * Singleton sync worker instance
 */
let syncWorker: ReturnType<typeof createSyncWorker> | null = null;

/**
 * Get the sync worker instance
 */
export function getSyncWorker() {
    if (!syncWorker) {
        syncWorker = createSyncWorker();
    }
    return syncWorker;
}

/**
 * Start the global sync worker
 */
export function startGlobalSync() {
    const worker = getSyncWorker();
    worker.start();
}

/**
 * Stop the global sync worker
 */
export function stopGlobalSync() {
    const worker = getSyncWorker();
    worker.stop();
}

/**
 * Trigger a manual sync
 */
export async function triggerSync(): Promise<SyncProgress> {
    const worker = getSyncWorker();
    return worker.syncOnce();
}
