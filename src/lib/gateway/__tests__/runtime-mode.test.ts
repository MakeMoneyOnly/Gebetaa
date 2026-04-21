import { describe, expect, it } from 'vitest';
import { resolveStoreOperatingMode } from '@/lib/gateway/runtime-mode';

describe('resolveStoreOperatingMode', () => {
    it('returns offline-local when offline', () => {
        expect(
            resolveStoreOperatingMode({
                isOnline: false,
                isInitialized: true,
                bootstrapState: 'ready',
                pendingCount: 0,
                isSyncing: false,
            })
        ).toBe('offline-local');
    });

    it('returns degraded when bootstrap broken', () => {
        expect(
            resolveStoreOperatingMode({
                isOnline: true,
                isInitialized: false,
                bootstrapState: 'missing_runtime_adapter',
                pendingCount: 0,
                isSyncing: false,
            })
        ).toBe('degraded');
    });

    it('returns reconciling when pending work exists', () => {
        expect(
            resolveStoreOperatingMode({
                isOnline: true,
                isInitialized: true,
                bootstrapState: 'ready',
                pendingCount: 2,
                isSyncing: false,
            })
        ).toBe('reconciling');
    });
});
