/**
 * Sync Module Index
 *
 * CRIT-05: Offline sync consolidation for POS and KDS
 * Replaces Dexie/localStorage with PowerSync-backed sync
 */

// Configuration
export {
    getPowerSyncConfig,
    initPowerSync,
    getPowerSync,
    closePowerSync,
    powerSyncSchema,
    type PowerSyncConfig,
} from './powersync-config';

// Idempotency
export {
    generateIdempotencyKey,
    isIdempotencyKeyUsed,
    markIdempotencyKeyCompleted,
    queueSyncOperation,
    getPendingSyncOperations,
    markSyncOperationFailed,
    markSyncOperationCompleted,
    getSyncQueueStatus,
    clearCompletedSyncOperations,
    type SyncOperation,
} from './idempotency';

// Order Sync
export {
    createOfflineOrder,
    getOfflineOrder,
    getPendingOfflineOrders,
    updateOfflineOrderStatus,
    deleteOfflineOrder,
    getOfflineOrdersByRestaurant,
    getOfflineOrdersCountByStatus,
    clearOfflineOrders,
    type OfflineOrder,
    type OfflineOrderItem,
    type OfflineOrderStatus,
} from './orderSync';

// KDS Sync
export {
    createKdsItem,
    getKdsItem,
    getKdsItemsByStation,
    getKdsItemsByOrder,
    executeKdsAction,
    getKdsStats,
    clearBumpedKdsItems,
    type OfflineKdsItem,
    type KdsItemStatus,
    type KdsAction,
} from './kdsSync';

// Printer Fallback
export {
    createPrintJob,
    getPrintJob,
    getPendingPrintJobs,
    getPrintJobsByOrder,
    startPrintJob,
    completePrintJob,
    failPrintJob,
    retryPrintJob,
    getPrinterQueueStats,
    clearOldPrintJobs,
    processPrintQueue,
    type PrinterJob,
    type PrinterJobStatus,
    type KdsPrintPayload,
} from './printerFallback';

// Sync Worker
export {
    createSyncWorker,
    getSyncWorker,
    startGlobalSync,
    stopGlobalSync,
    triggerSync,
    type SyncWorkerConfig,
    type SyncProgress,
} from './syncWorker';

// React Hooks
export { PowerSyncProvider, usePowerSync, useOfflineMode, useSyncStatus } from './usePowerSync';

// Migration
export {
    migrateDexieOrdersToPowerSync,
    migrateKdsLocalStorageToPowerSync,
    migrateCartLocalStorageToPowerSync,
    runAllMigrations,
    isMigrationNeeded,
    clearLegacyStorage,
} from './migrate';
