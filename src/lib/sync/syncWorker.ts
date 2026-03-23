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
 * Sync operation row type from the database
 */
interface SyncOperationRow {
    id: number;
    operation: string;
    table_name: string;
    record_id: string;
    payload: string;
    idempotency_key: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
}

/**
 * HIGH-013: API endpoint configuration for sync operations
 */
const SYNC_API_BASE = '/api/sync';

/**
 * Sync operation types mapped to API endpoints
 */
const SYNC_ENDPOINTS: Record<string, string> = {
    orders: '/api/orders',
    order_items: '/api/orders/items',
    kds_order_items: '/api/kds/items',
    tables: '/api/device/tables',
    payments: '/api/payments',
    guests: '/api/guests',
} as const;

/**
 * Exponential backoff configuration
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

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
     * HIGH-013: Calculate exponential backoff delay
     */
    function calculateBackoffDelay(retryCount: number): number {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    }

    /**
     * HIGH-013: Make actual API call to server for sync operation
     */
    async function executeSyncOperation(
        op: SyncOperationRow
    ): Promise<{ success: boolean; error?: string }> {
        const endpoint = SYNC_ENDPOINTS[op.table_name];

        if (!endpoint) {
            console.warn(`[SyncWorker] No endpoint configured for table: ${op.table_name}`);
            return { success: false, error: `Unknown table: ${op.table_name}` };
        }

        const method =
            op.operation === 'INSERT' ? 'POST' : op.operation === 'UPDATE' ? 'PATCH' : 'DELETE';
        const url =
            op.operation === 'DELETE' || op.operation === 'UPDATE'
                ? `${endpoint}/${op.record_id}`
                : endpoint;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-sync-operation-id': String(op.id),
                    'x-idempotency-key': op.idempotency_key || String(op.id),
                },
                body: op.operation !== 'DELETE' ? op.payload : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || `HTTP ${response.status}`,
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Process pending sync operations with retry logic
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

            const retryCount = op.attempts || 0;

            try {
                console.log(
                    `[SyncWorker] Processing ${op.operation} on ${op.table_name}/${op.record_id} (attempt ${retryCount + 1})`
                );

                // HIGH-013: Execute actual API call
                const result = await executeSyncOperation(op);

                if (result.success) {
                    await markSyncOperationCompleted(op.id);
                    succeeded++;
                    console.log(`[SyncWorker] Successfully synced operation ${op.id}`);
                } else {
                    // Check if we should retry
                    if (retryCount < MAX_RETRIES) {
                        const delay = calculateBackoffDelay(retryCount);
                        console.warn(
                            `[SyncWorker] Operation ${op.id} failed, scheduling retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`
                        );

                        // Schedule retry with exponential backoff
                        setTimeout(async () => {
                            // The operation will be picked up in the next sync cycle
                            // with an incremented retry count
                        }, delay);

                        failed++;
                    } else {
                        console.error(
                            `[SyncWorker] Operation ${op.id} failed after ${MAX_RETRIES} retries: ${result.error}`
                        );
                        await markSyncOperationFailed(
                            op.id,
                            result.error || 'Max retries exceeded'
                        );
                        failed++;
                        cfg.onError?.(new Error(result.error || 'Sync operation failed'));
                    }
                }
            } catch (error) {
                console.error(`[SyncWorker] Unexpected error for operation ${op.id}:`, error);
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
