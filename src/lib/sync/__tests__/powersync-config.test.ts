import { afterEach, describe, expect, it } from 'vitest';
import {
    getPowerSyncBootstrapStatus,
    getPowerSyncConfig,
    powerSyncSchema,
} from '@/lib/sync/powersync-config';

describe('powersync-config', () => {
    const originalEndpoint = process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT;
    const originalToken = process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN;
    const originalApiKey = process.env.NEXT_PUBLIC_POWERSYNC_API_KEY;
    const originalDevToken = process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN;

    afterEach(() => {
        process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT = originalEndpoint;
        process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN = originalToken;
        process.env.NEXT_PUBLIC_POWERSYNC_API_KEY = originalApiKey;
        process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN = originalDevToken;
    });

    it('uses explicit endpoint env and dev token env', () => {
        process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT = 'https://sync.example.com';
        process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN = 'dev-token';
        delete process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN;
        delete process.env.NEXT_PUBLIC_POWERSYNC_API_KEY;

        expect(getPowerSyncConfig()).toMatchObject({
            endpoint: 'https://sync.example.com',
            accessToken: 'dev-token',
        });
    });

    it('uses bundled instance URL when endpoint env missing', () => {
        delete process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT;
        process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN = 'dev-token';
        delete process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN;
        delete process.env.NEXT_PUBLIC_POWERSYNC_API_KEY;

        expect(getPowerSyncConfig()).toMatchObject({
            endpoint: 'https://69b2c04ad42a43395101a793.powersync.journeyapps.com',
            accessToken: 'dev-token',
        });
    });

    it('reports not configured status when endpoint missing', () => {
        process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT = '';
        delete process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN;
        delete process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN;
        delete process.env.NEXT_PUBLIC_POWERSYNC_API_KEY;

        getPowerSyncConfig();

        expect(getPowerSyncBootstrapStatus().state).toBe('not_configured');
    });

    it('includes local_journal and conflict tables in schema', () => {
        expect(powerSyncSchema).toContain('CREATE TABLE IF NOT EXISTS local_journal');
        expect(powerSyncSchema).toContain('CREATE TABLE IF NOT EXISTS audit_logs');
        expect(powerSyncSchema).toContain('CREATE TABLE IF NOT EXISTS sync_conflict_logs');
    });
});
