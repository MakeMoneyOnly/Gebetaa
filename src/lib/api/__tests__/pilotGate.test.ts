import { afterEach, describe, expect, it } from 'vitest';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

const ORIGINAL_ENV = { ...process.env };

describe('pilot gate phase controls', () => {
    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it('does not enforce p1 cohort when p1 rollout is disabled', () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'false';
        process.env.PILOT_RESTAURANT_IDS = '';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p1' });
        expect(response).toBeNull();
    });

    it('blocks non-allowlisted restaurant when p1 rollout is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-2';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p1' });

        expect(response?.status).toBe(403);
        await expect(response?.json()).resolves.toMatchObject({
            code: 'FEATURE_NOT_ENABLED_FOR_RESTAURANT',
        });
    });

    it('blocks p1 mutation when pilot mutation block is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-1';
        process.env.PILOT_BLOCK_MUTATIONS = 'true';

        const response = enforcePilotAccess('rest-1', 'PATCH', { phase: 'p1' });

        expect(response?.status).toBe(503);
        await expect(response?.json()).resolves.toMatchObject({
            code: 'PILOT_MUTATION_BLOCK_ENABLED',
        });
    });

    it('blocks non-allowlisted restaurant when p2 rollout is enabled', async () => {
        process.env.ENABLE_P0_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P1_PILOT_ROLLOUT = 'false';
        process.env.ENABLE_P2_PILOT_ROLLOUT = 'true';
        process.env.PILOT_RESTAURANT_IDS = 'rest-2';
        process.env.PILOT_BLOCK_MUTATIONS = 'false';

        const response = enforcePilotAccess('rest-1', 'GET', { phase: 'p2' });

        expect(response?.status).toBe(403);
        await expect(response?.json()).resolves.toMatchObject({
            code: 'FEATURE_NOT_ENABLED_FOR_RESTAURANT',
        });
    });
});
