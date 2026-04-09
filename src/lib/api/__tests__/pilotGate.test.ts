import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

// Mock the config module to read from process.env dynamically
vi.mock('@/lib/config/pilotRollout', () => ({
    isPilotRolloutEnabled: (phase: string) => {
        if (phase === 'p2') {
            return (
                String(process.env.ENABLE_P2_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true' ||
                String(process.env.ENABLE_P1_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true' ||
                String(process.env.ENABLE_P0_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true'
            );
        }
        if (phase === 'p1') {
            return (
                String(process.env.ENABLE_P1_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true' ||
                String(process.env.ENABLE_P0_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true'
            );
        }
        return String(process.env.ENABLE_P0_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true';
    },
    isPilotMutationBlockEnabled: () => {
        return String(process.env.PILOT_BLOCK_MUTATIONS ?? 'false').toLowerCase() === 'true';
    },
    isRestaurantInPilotCohort: (restaurantId: string) => {
        const allowlist = new Set(
            (process.env.PILOT_RESTAURANT_IDS ?? '')
                .split(',')
                .map(item => item.trim())
                .filter(Boolean)
        );
        return allowlist.has(restaurantId);
    },
}));

describe('pilot gate phase controls', () => {
    beforeEach(() => {
        vi.resetModules();
        // Reset all pilot-related env vars
        delete process.env.ENABLE_P0_PILOT_ROLLOUT;
        delete process.env.ENABLE_P1_PILOT_ROLLOUT;
        delete process.env.ENABLE_P2_PILOT_ROLLOUT;
        delete process.env.PILOT_RESTAURANT_IDS;
        delete process.env.PILOT_BLOCK_MUTATIONS;
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it('does not enforce p1 cohort when p1 rollout is disabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'false';
        process.env.PILOT_RESTAURANT_IDS = '';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const { enforcePilotAccess } = await import('@/lib/api/pilotGate');
        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p1' });
        expect(response).toBeNull();
    }, 10000);

    it('blocks non-allowlisted restaurant when p1 rollout is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-2';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const { enforcePilotAccess } = await import('@/lib/api/pilotGate');
        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p1' });

        expect(response?.status).toBe(403);
        // Response has nested error object: { error: { code, message, requestId } }
        await expect(response?.json()).resolves.toMatchObject({
            error: {
                code: 'FEATURE_NOT_ENABLED_FOR_RESTAURANT',
            },
        });
    });

    it('blocks p1 mutation when pilot mutation block is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-1';
        process.env.PILOT_BLOCK_MUTATIONS = 'true';

        const { enforcePilotAccess } = await import('@/lib/api/pilotGate');
        const response = enforcePilotAccess('rest-1', 'PATCH', { phase: 'p1' });

        expect(response?.status).toBe(503);
        // Response has nested error object: { error: { code, message, requestId } }
        await expect(response?.json()).resolves.toMatchObject({
            error: {
                code: 'PILOT_MUTATION_BLOCK_ENABLED',
            },
        });
    });

    it('blocks non-allowlisted restaurant when p2 rollout is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P2_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-2';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const { enforcePilotAccess } = await import('@/lib/api/pilotGate');
        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p2' });

        expect(response?.status).toBe(403);
        // Response has nested error object: { error: { code, message, requestId } }
        await expect(response?.json()).resolves.toMatchObject({
            error: {
                code: 'FEATURE_NOT_ENABLED_FOR_RESTAURANT',
            },
        });
    });
});
