import { describe, expect, it } from 'vitest';

describe('course pacing', () => {
    it('advances auto-fire orders inside headless domain core', async () => {
        const { resolveCoursePacing } = await import('../course-pacing');

        const result = resolveCoursePacing({
            currentStatus: 'pending',
            existingFireMode: 'auto',
            existingCourse: 'appetizer',
        });

        expect(result).toEqual({
            fireMode: 'auto',
            currentCourse: 'main',
            nextOrderStatus: 'acknowledged',
        });
    });

    it('prevents backwards course movement offline', async () => {
        const { resolveCoursePacing } = await import('../course-pacing');

        expect(() =>
            resolveCoursePacing({
                currentStatus: 'acknowledged',
                existingFireMode: 'manual',
                existingCourse: 'main',
                requestedCourse: 'appetizer',
            })
        ).toThrow('Course pacing cannot move backwards offline.');
    });
});
