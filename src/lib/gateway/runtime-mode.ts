import type { PowerSyncBootstrapState } from '@/lib/sync/powersync-config';
import type { StoreOperatingMode } from '@/lib/gateway/config';

export interface StoreRuntimeModeInput {
    isOnline: boolean;
    isInitialized: boolean;
    bootstrapState: PowerSyncBootstrapState;
    pendingCount: number;
    isSyncing: boolean;
}

export function resolveStoreOperatingMode(input: StoreRuntimeModeInput): StoreOperatingMode {
    if (!input.isOnline) {
        return 'offline-local';
    }

    if (
        input.bootstrapState === 'error' ||
        input.bootstrapState === 'missing_runtime_adapter' ||
        input.bootstrapState === 'not_configured'
    ) {
        return 'degraded';
    }

    if (input.isSyncing || input.pendingCount > 0) {
        return 'reconciling';
    }

    if (input.isInitialized) {
        return 'online';
    }

    return 'degraded';
}
