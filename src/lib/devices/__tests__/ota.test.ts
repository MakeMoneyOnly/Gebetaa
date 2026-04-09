import { describe, expect, it } from 'vitest';
import { normalizeAppVersion, resolveOtaStatus } from '@/lib/devices/ota';

describe('device OTA helpers', () => {
    describe('normalizeAppVersion', () => {
        it('normalizes blank versions to null', () => {
            expect(normalizeAppVersion('   ')).toBeNull();
        });

        it('returns null for undefined', () => {
            expect(normalizeAppVersion(undefined)).toBeNull();
        });

        it('returns null for null', () => {
            expect(normalizeAppVersion(null)).toBeNull();
        });

        it('returns null for empty string', () => {
            expect(normalizeAppVersion('')).toBeNull();
        });

        it('trims whitespace from valid version', () => {
            expect(normalizeAppVersion('  1.2.3  ')).toBe('1.2.3');
        });

        it('returns valid version unchanged', () => {
            expect(normalizeAppVersion('1.4.2')).toBe('1.4.2');
        });
    });

    describe('resolveOtaStatus', () => {
        it('marks the device current when the reported version matches the target', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.2',
                    targetVersion: '1.4.2',
                    existingStatus: 'queued',
                })
            ).toBe('current');
        });

        it('keeps an update in installing state while the target version is still pending', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                    existingStatus: 'queued',
                })
            ).toBe('installing');
        });

        // Branch: no targetVersion + currentVersion exists → 'current'
        it('returns current when no target version and device has a current version', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.2',
                    targetVersion: null,
                })
            ).toBe('current');
        });

        it('returns current when no target version and target is undefined', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.2',
                })
            ).toBe('current');
        });

        // Branch: no targetVersion + no currentVersion + existingStatus → existingStatus
        it('returns existing status when no target and no current version with existing status', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: null,
                    existingStatus: 'queued',
                })
            ).toBe('queued');
        });

        // Branch: no targetVersion + no currentVersion + no existingStatus → 'current'
        it('returns current when no target, no current, and no existing status', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: null,
                })
            ).toBe('current');
        });

        it('returns current when no target, no current, and existingStatus is null', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: null,
                    existingStatus: null,
                })
            ).toBe('current');
        });

        // Branch: no currentVersion + existingStatus === 'failed' → 'failed'
        it('returns failed when no current version and existing status is failed', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: '1.4.2',
                    existingStatus: 'failed',
                })
            ).toBe('failed');
        });

        // Branch: no currentVersion + existingStatus !== 'failed' → 'queued'
        it('returns queued when no current version and existing status is not failed', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: '1.4.2',
                    existingStatus: 'current',
                })
            ).toBe('queued');
        });

        it('returns queued when no current version and no existing status', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: null,
                    targetVersion: '1.4.2',
                })
            ).toBe('queued');
        });

        // Branch: currentVersion === targetVersion → 'current' (already tested above)

        // Branch: existingStatus === 'failed' → 'failed'
        it('returns failed when versions differ and existing status is failed', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                    existingStatus: 'failed',
                })
            ).toBe('failed');
        });

        // Branch: existingStatus === 'queued' → 'installing' (already tested above)
        // Branch: existingStatus === 'installing' → 'installing'
        it('returns installing when versions differ and existing status is installing', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                    existingStatus: 'installing',
                })
            ).toBe('installing');
        });

        // Branch: default → 'outdated'
        it('returns outdated when versions differ and no special existing status', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                    existingStatus: 'current',
                })
            ).toBe('outdated');
        });

        it('returns outdated when versions differ and existing status is null', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                    existingStatus: null,
                })
            ).toBe('outdated');
        });

        it('returns outdated when versions differ and no existing status', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.1',
                    targetVersion: '1.4.2',
                })
            ).toBe('outdated');
        });

        // Edge case: whitespace-only versions
        it('treats whitespace-only currentVersion as null', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '   ',
                    targetVersion: '1.4.2',
                })
            ).toBe('queued');
        });

        it('treats whitespace-only targetVersion as null', () => {
            expect(
                resolveOtaStatus({
                    currentVersion: '1.4.2',
                    targetVersion: '   ',
                })
            ).toBe('current');
        });
    });
});
