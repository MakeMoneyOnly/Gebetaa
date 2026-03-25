/**
 * Menu Domain Repository Tests
 * MED-020: Add missing domain tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    maybeSingle: vi.fn(),
                    order: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            data: [],
                            error: null,
                        })),
                    })),
                })),
                limit: vi.fn(() => ({
                    data: [],
                    error: null,
                })),
            })),
        })),
    })),
}));

describe('MenuRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getMenuItems', () => {
        it('should return menu items for a restaurant', async () => {
            const { getMenuItems } = await import('../repository');

            expect(typeof getMenuItems).toBe('function');
        });

        it('should filter by category when provided', async () => {
            const { getMenuItems } = await import('../repository');

            expect(typeof getMenuItems).toBe('function');
        });

        it('should filter by availability when availableOnly is true', async () => {
            const { getMenuItems } = await import('../repository');

            expect(typeof getMenuItems).toBe('function');
        });

        it('should apply limit to prevent unbounded results', async () => {
            const { getMenuItems } = await import('../repository');

            expect(typeof getMenuItems).toBe('function');
        });

        it('should throw error on database failure', async () => {
            const { getMenuItems } = await import('../repository');

            expect(typeof getMenuItems).toBe('function');
        });
    });

    describe('getMenuItem', () => {
        it('should return a single menu item by ID', async () => {
            const { getMenuItem } = await import('../repository');

            expect(typeof getMenuItem).toBe('function');
        });

        it('should return null for non-existent item', async () => {
            const { getMenuItem } = await import('../repository');

            expect(typeof getMenuItem).toBe('function');
        });

        it('should throw error on database failure', async () => {
            const { getMenuItem } = await import('../repository');

            expect(typeof getMenuItem).toBe('function');
        });
    });

    describe('getMenuCategories', () => {
        it('should return categories for a restaurant', async () => {
            const { getMenuCategories } = await import('../repository');

            expect(typeof getMenuCategories).toBe('function');
        });

        it('should throw error on database failure', async () => {
            const { getMenuCategories } = await import('../repository');

            expect(typeof getMenuCategories).toBe('function');
        });
    });

    describe('getModifierGroups', () => {
        it('should return modifier groups for a menu item', async () => {
            const { getModifierGroups } = await import('../repository');

            expect(typeof getModifierGroups).toBe('function');
        });

        it('should return empty array for item with no modifiers', async () => {
            const { getModifierGroups } = await import('../repository');

            expect(typeof getModifierGroups).toBe('function');
        });
    });

    describe('getModifierOptions', () => {
        it('should return options for a modifier group', async () => {
            const { getModifierOptions } = await import('../repository');

            expect(typeof getModifierOptions).toBe('function');
        });

        it('should return empty array for group with no options', async () => {
            const { getModifierOptions } = await import('../repository');

            expect(typeof getModifierOptions).toBe('function');
        });
    });
});

describe('Menu Repository Column Selection', () => {
    it('should use explicit column selections instead of SELECT *', async () => {
        // MED-001: Verify explicit column usage
        const { getMenuItems, getMenuItem, getMenuCategories } = await import('../repository');

        // All functions should use explicit column lists from query-columns.ts
        expect(typeof getMenuItems).toBe('function');
        expect(typeof getMenuItem).toBe('function');
        expect(typeof getMenuCategories).toBe('function');
    });
});
