import { afterEach, describe, expect, it } from 'vitest';
import { getAppDatabaseConfig } from '../app';
import { getInfraDatabaseConfig } from '../admin';

describe('database connection lanes', () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    it('accepts pooler URL for app lane', () => {
        process.env = {
            ...originalEnv,
            DATABASE_URL: 'postgresql://postgres:pw@pooler.example.supabase.co:6543/postgres',
        };

        expect(getAppDatabaseConfig()).toMatchObject({
            lane: 'app',
            mode: 'pooler',
            source: 'DATABASE_URL',
        });
    });

    it('rejects direct URL for app lane', () => {
        process.env = {
            ...originalEnv,
            DATABASE_URL: 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres',
        };

        expect(() => getAppDatabaseConfig()).toThrow('App lane must use Supabase pooler URL only.');
    });

    it('accepts direct URL for infra lane', () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'development',
            DATABASE_DIRECT_URL: 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres',
        };

        expect(getInfraDatabaseConfig()).toMatchObject({
            lane: 'infra',
            mode: 'direct',
            source: 'DATABASE_DIRECT_URL',
        });
    });

    it('rejects pooler URL for infra lane', () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'development',
            DATABASE_DIRECT_URL:
                'postgresql://postgres:pw@pooler.example.supabase.co:6543/postgres',
        };

        expect(() => getInfraDatabaseConfig()).toThrow(
            'Infra lane must use direct Postgres URL only.'
        );
    });

    it('blocks direct lane in production serverless runtime by default', () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'production',
            VERCEL: '1',
            DATABASE_DIRECT_URL: 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres',
        };

        expect(() => getInfraDatabaseConfig()).toThrow(
            'Direct database lane is blocked in production serverless or edge runtime.'
        );
    });

    it('allows explicit infra override for serverless-controlled tooling', () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'production',
            VERCEL: '1',
            DATABASE_DIRECT_URL: 'postgresql://postgres:pw@db.example.supabase.co:5432/postgres',
        };

        expect(getInfraDatabaseConfig({ allowServerless: true })).toMatchObject({
            lane: 'infra',
            mode: 'direct',
        });
    });
});
