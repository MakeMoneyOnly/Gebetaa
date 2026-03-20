import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDataLoaders, DataLoaders } from '../dataloaders';

// Mock the repositories
vi.mock('@/domains/menu/repository', () => ({
    menuRepository: {
        getMenuItemsByIds: vi.fn(),
        getModifierGroupsByMenuItemIds: vi.fn(),
        getModifierOptionsByGroupIds: vi.fn(),
        getCategoriesByIds: vi.fn(),
    },
}));

vi.mock('@/domains/orders/repository', () => ({
    ordersRepository: {
        getItemsByOrderIds: vi.fn(),
    },
}));

import { menuRepository } from '@/domains/menu/repository';
import { ordersRepository } from '@/domains/orders/repository';

describe('DataLoaders', () => {
    let loaders: DataLoaders;

    beforeEach(() => {
        vi.clearAllMocks();
        loaders = createDataLoaders();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('createDataLoaders', () => {
        it('should create all loaders', () => {
            expect(loaders.menuItems).toBeDefined();
            expect(loaders.modifierGroups).toBeDefined();
            expect(loaders.modifierOptions).toBeDefined();
            expect(loaders.orderItems).toBeDefined();
            expect(loaders.categories).toBeDefined();
        });

        it('should create DataLoader instances with load method', () => {
            expect(typeof loaders.menuItems.load).toBe('function');
            expect(typeof loaders.modifierGroups.load).toBe('function');
            expect(typeof loaders.modifierOptions.load).toBe('function');
            expect(typeof loaders.orderItems.load).toBe('function');
            expect(typeof loaders.categories.load).toBe('function');
        });

        it('should create DataLoader instances with loadMany method', () => {
            expect(typeof loaders.menuItems.loadMany).toBe('function');
            expect(typeof loaders.modifierGroups.loadMany).toBe('function');
            expect(typeof loaders.modifierOptions.loadMany).toBe('function');
            expect(typeof loaders.orderItems.loadMany).toBe('function');
            expect(typeof loaders.categories.loadMany).toBe('function');
        });

        it('should create new DataLoader instances on each call', () => {
            const loaders1 = createDataLoaders();
            const loaders2 = createDataLoaders();

            expect(loaders1.menuItems).not.toBe(loaders2.menuItems);
        });
    });

    describe('menuItems loader', () => {
        it('should batch multiple load calls', async () => {
            const mockItems = [
                { id: 'item-1', name: 'Item 1' },
                { id: 'item-2', name: 'Item 2' },
            ];

            vi.mocked(menuRepository.getMenuItemsByIds).mockResolvedValue(mockItems);

            // Load multiple items in the same tick (simulates batching)
            const [result1, result2] = await Promise.all([
                loaders.menuItems.load('item-1'),
                loaders.menuItems.load('item-2'),
            ]);

            // Should only call the repository once with all IDs
            expect(menuRepository.getMenuItemsByIds).toHaveBeenCalledTimes(1);
            expect(menuRepository.getMenuItemsByIds).toHaveBeenCalledWith(['item-1', 'item-2']);

            expect(result1).toEqual({ id: 'item-1', name: 'Item 1' });
            expect(result2).toEqual({ id: 'item-2', name: 'Item 2' });
        });

        it('should return null for missing items', async () => {
            vi.mocked(menuRepository.getMenuItemsByIds).mockResolvedValue([
                { id: 'item-1', name: 'Item 1' },
            ]);

            const result = await loaders.menuItems.load('missing-item');

            expect(result).toBeNull();
        });

        it('should handle empty results', async () => {
            vi.mocked(menuRepository.getMenuItemsByIds).mockResolvedValue([]);

            const result = await loaders.menuItems.load('any-id');

            expect(result).toBeNull();
        });
    });

    describe('modifierGroups loader', () => {
        it('should batch multiple load calls', async () => {
            const mockGroups = [
                { id: 'group-1', menu_item_id: 'item-1', name: 'Group 1' },
                { id: 'group-2', menu_item_id: 'item-1', name: 'Group 2' },
                { id: 'group-3', menu_item_id: 'item-2', name: 'Group 3' },
            ];

            vi.mocked(menuRepository.getModifierGroupsByMenuItemIds).mockResolvedValue(mockGroups);

            const [result1, result2] = await Promise.all([
                loaders.modifierGroups.load('item-1'),
                loaders.modifierGroups.load('item-2'),
            ]);

            expect(menuRepository.getModifierGroupsByMenuItemIds).toHaveBeenCalledTimes(1);
            expect(menuRepository.getModifierGroupsByMenuItemIds).toHaveBeenCalledWith([
                'item-1',
                'item-2',
            ]);

            expect(result1).toHaveLength(2);
            expect(result2).toHaveLength(1);
        });

        it('should return empty array for items without groups', async () => {
            vi.mocked(menuRepository.getModifierGroupsByMenuItemIds).mockResolvedValue([]);

            const result = await loaders.modifierGroups.load('item-no-groups');

            expect(result).toEqual([]);
        });

        it('should group results by menu_item_id', async () => {
            const mockGroups = [
                { id: 'group-1', menu_item_id: 'item-1', name: 'Group 1' },
                { id: 'group-2', menu_item_id: 'item-1', name: 'Group 2' },
            ];

            vi.mocked(menuRepository.getModifierGroupsByMenuItemIds).mockResolvedValue(mockGroups);

            const result = await loaders.modifierGroups.load('item-1');

            expect(result).toHaveLength(2);
            expect(result).toEqual(mockGroups);
        });
    });

    describe('modifierOptions loader', () => {
        it('should batch multiple load calls', async () => {
            const mockOptions = [
                { id: 'opt-1', modifier_group_id: 'group-1', name: 'Option 1' },
                { id: 'opt-2', modifier_group_id: 'group-1', name: 'Option 2' },
                { id: 'opt-3', modifier_group_id: 'group-2', name: 'Option 3' },
            ];

            vi.mocked(menuRepository.getModifierOptionsByGroupIds).mockResolvedValue(mockOptions);

            const [result1, result2] = await Promise.all([
                loaders.modifierOptions.load('group-1'),
                loaders.modifierOptions.load('group-2'),
            ]);

            expect(menuRepository.getModifierOptionsByGroupIds).toHaveBeenCalledTimes(1);
            expect(menuRepository.getModifierOptionsByGroupIds).toHaveBeenCalledWith([
                'group-1',
                'group-2',
            ]);

            expect(result1).toHaveLength(2);
            expect(result2).toHaveLength(1);
        });

        it('should return empty array for groups without options', async () => {
            vi.mocked(menuRepository.getModifierOptionsByGroupIds).mockResolvedValue([]);

            const result = await loaders.modifierOptions.load('group-no-options');

            expect(result).toEqual([]);
        });
    });

    describe('orderItems loader', () => {
        it('should batch multiple load calls', async () => {
            const mockOrderItems = [
                {
                    id: 'oi-1',
                    order_id: 'order-1',
                    item_id: 'item-1',
                    quantity: 2,
                    name: 'Item 1',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: 'main',
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 100,
                    special_request: null,
                },
                {
                    id: 'oi-2',
                    order_id: 'order-1',
                    item_id: 'item-2',
                    quantity: 1,
                    name: 'Item 2',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: 'main',
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 200,
                    special_request: null,
                },
                {
                    id: 'oi-3',
                    order_id: 'order-2',
                    item_id: 'item-3',
                    quantity: 3,
                    name: 'Item 3',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: 'main',
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 300,
                    special_request: null,
                },
            ] as unknown as Awaited<ReturnType<typeof ordersRepository.getItemsByOrderIds>>;

            vi.mocked(ordersRepository.getItemsByOrderIds).mockResolvedValue(mockOrderItems);

            const [result1, result2] = await Promise.all([
                loaders.orderItems.load('order-1'),
                loaders.orderItems.load('order-2'),
            ]);

            expect(ordersRepository.getItemsByOrderIds).toHaveBeenCalledTimes(1);
            expect(ordersRepository.getItemsByOrderIds).toHaveBeenCalledWith([
                'order-1',
                'order-2',
            ]);

            expect(result1).toHaveLength(2);
            expect(result2).toHaveLength(1);
        });

        it('should return empty array for orders without items', async () => {
            vi.mocked(ordersRepository.getItemsByOrderIds).mockResolvedValue([]);

            const result = await loaders.orderItems.load('order-no-items');

            expect(result).toEqual([]);
        });

        it('should group items by order_id', async () => {
            const mockOrderItems = [
                {
                    id: 'oi-1',
                    order_id: 'order-1',
                    item_id: 'item-1',
                    quantity: 2,
                    name: 'Item 1',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: 'main',
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 100,
                    special_request: null,
                },
                {
                    id: 'oi-2',
                    order_id: 'order-1',
                    item_id: 'item-2',
                    quantity: 1,
                    name: 'Item 2',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: 'main',
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 200,
                    special_request: null,
                },
            ] as unknown as Awaited<ReturnType<typeof ordersRepository.getItemsByOrderIds>>;

            vi.mocked(ordersRepository.getItemsByOrderIds).mockResolvedValue(mockOrderItems);

            const result = await loaders.orderItems.load('order-1');

            expect(result).toHaveLength(2);
            expect(result).toEqual(mockOrderItems);
        });
    });

    describe('categories loader', () => {
        it('should batch multiple load calls', async () => {
            const mockCategories = [
                { id: 'cat-1', name: 'Category 1' },
                { id: 'cat-2', name: 'Category 2' },
            ];

            vi.mocked(menuRepository.getCategoriesByIds).mockResolvedValue(mockCategories);

            const [result1, result2] = await Promise.all([
                loaders.categories.load('cat-1'),
                loaders.categories.load('cat-2'),
            ]);

            expect(menuRepository.getCategoriesByIds).toHaveBeenCalledTimes(1);
            expect(menuRepository.getCategoriesByIds).toHaveBeenCalledWith(['cat-1', 'cat-2']);

            expect(result1).toEqual({ id: 'cat-1', name: 'Category 1' });
            expect(result2).toEqual({ id: 'cat-2', name: 'Category 2' });
        });

        it('should return null for missing categories', async () => {
            vi.mocked(menuRepository.getCategoriesByIds).mockResolvedValue([
                { id: 'cat-1', name: 'Category 1' },
            ]);

            const result = await loaders.categories.load('missing-cat');

            expect(result).toBeNull();
        });

        it('should handle empty results', async () => {
            vi.mocked(menuRepository.getCategoriesByIds).mockResolvedValue([]);

            const result = await loaders.categories.load('any-id');

            expect(result).toBeNull();
        });
    });

    describe('DataLoader caching behavior', () => {
        it('should cache results within the same loader instance', async () => {
            vi.mocked(menuRepository.getMenuItemsByIds).mockResolvedValue([
                { id: 'item-1', name: 'Item 1' },
            ]);

            // First load
            const result1 = await loaders.menuItems.load('item-1');

            // Second load of same ID should use cache
            const result2 = await loaders.menuItems.load('item-1');

            // Repository should only be called once due to caching
            expect(menuRepository.getMenuItemsByIds).toHaveBeenCalledTimes(1);
            expect(result1).toEqual(result2);
        });

        it('should not cache across different loader instances', async () => {
            vi.mocked(menuRepository.getMenuItemsByIds).mockResolvedValue([
                { id: 'item-1', name: 'Item 1' },
            ]);

            const loaders1 = createDataLoaders();
            const loaders2 = createDataLoaders();

            await loaders1.menuItems.load('item-1');
            await loaders2.menuItems.load('item-1');

            // Each loader instance should call the repository independently
            expect(menuRepository.getMenuItemsByIds).toHaveBeenCalledTimes(2);
        });
    });
});
