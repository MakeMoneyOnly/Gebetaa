/**
 * N+1 Query Detection Integration Tests
 *
 * HIGH-021: Verify that DataLoaders prevent N+1 query patterns
 * by batching database calls into a single query per entity type.
 *
 * These tests specifically track the number of database queries
 * made when resolving a list of entities with their relations,
 * ensuring that adding more entities does NOT increase query count
 * proportionally (which would indicate an N+1 problem).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDataLoaders, type TenantContext } from '../dataloaders';

const createMockSupabaseClient = vi.hoisted(() => {
    const createQuery = (resolver?: () => Promise<{ data: unknown[]; error: unknown }>) => {
        const query: Record<string, unknown> = {
            select: vi.fn(() => query),
            insert: vi.fn(() => query),
            update: vi.fn(() => query),
            delete: vi.fn(() => query),
            eq: vi.fn(() => query),
            neq: vi.fn(() => query),
            in: vi.fn(() => (resolver ? resolver() : Promise.resolve({ data: [], error: null }))),
            order: vi.fn(() => query),
            limit: vi.fn(() => query),
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
        return query;
    };

    let currentResolver: (() => Promise<{ data: unknown[]; error: unknown }>) | undefined;

    const clientFactory = vi.fn(() => ({
        from: vi.fn(() => createQuery(currentResolver)),
    }));

    return Object.assign(clientFactory, {
        setResolver(resolver: () => Promise<{ data: unknown[]; error: unknown }>) {
            currentResolver = resolver;
        },
        clearResolver() {
            currentResolver = undefined;
        },
    });
});

vi.mock('@/lib/supabase/service-role', () => ({
    createServiceRoleClient: createMockSupabaseClient,
}));

vi.mock('@/domains/menu/repository', () => ({
    menuRepository: {
        getMenuItemsByIds: vi.fn(),
        getModifierGroupsByMenuItemIds: vi.fn(),
        getModifierOptionsByGroupIds: vi.fn(),
        getCategoriesByIds: vi.fn(),
        getModifierGroupsByIds: vi.fn(),
        getModifierOptionsByIds: vi.fn(),
    },
}));

vi.mock('@/domains/orders/repository', () => ({
    ordersRepository: {
        getItemsByOrderIds: vi.fn(),
    },
}));

import { menuRepository } from '@/domains/menu/repository';
import { ordersRepository, type OrderItemRow } from '@/domains/orders/repository';

const mockMenuRepository = vi.mocked(menuRepository);
const mockOrdersRepository = vi.mocked(ordersRepository);

const TENANT_CONTEXT: TenantContext = {
    restaurantId: 'restaurant-1',
};

describe('N+1 Query Detection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createMockSupabaseClient.clearResolver();
    });

    describe('menuItems loader', () => {
        it('should make exactly 1 DB call for N menu item loads in same tick', async () => {
            mockMenuRepository.getMenuItemsByIds.mockResolvedValue([
                { id: 'item-1', restaurant_id: 'restaurant-1', name: 'Item 1' },
                { id: 'item-2', restaurant_id: 'restaurant-1', name: 'Item 2' },
                { id: 'item-3', restaurant_id: 'restaurant-1', name: 'Item 3' },
                { id: 'item-4', restaurant_id: 'restaurant-1', name: 'Item 4' },
                { id: 'item-5', restaurant_id: 'restaurant-1', name: 'Item 5' },
            ] as Record<string, unknown>[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            const [item1, item2, item3, item4, item5] = await Promise.all([
                loaders.menuItems.load('item-1'),
                loaders.menuItems.load('item-2'),
                loaders.menuItems.load('item-3'),
                loaders.menuItems.load('item-4'),
                loaders.menuItems.load('item-5'),
            ]);

            expect(mockMenuRepository.getMenuItemsByIds).toHaveBeenCalledTimes(1);
            expect(mockMenuRepository.getMenuItemsByIds).toHaveBeenCalledWith([
                'item-1',
                'item-2',
                'item-3',
                'item-4',
                'item-5',
            ]);
            expect(item1).not.toBeNull();
            expect(item5).not.toBeNull();
        });

        it('should NOT increase DB call count when loading more items', async () => {
            mockMenuRepository.getMenuItemsByIds.mockResolvedValue(
                Array.from({ length: 3 }, (_, i) => ({
                    id: `item-${i + 1}`,
                    restaurant_id: 'restaurant-1',
                    name: `Item ${i + 1}`,
                }))
            );

            const loaders1 = createDataLoaders(TENANT_CONTEXT);
            await Promise.all([
                loaders1.menuItems.load('item-1'),
                loaders1.menuItems.load('item-2'),
                loaders1.menuItems.load('item-3'),
            ]);
            const callsFor3 = mockMenuRepository.getMenuItemsByIds.mock.calls.length;

            vi.clearAllMocks();

            mockMenuRepository.getMenuItemsByIds.mockResolvedValue(
                Array.from({ length: 10 }, (_, i) => ({
                    id: `item-${i + 1}`,
                    restaurant_id: 'restaurant-1',
                    name: `Item ${i + 1}`,
                }))
            );

            const loaders2 = createDataLoaders(TENANT_CONTEXT);
            await Promise.all(
                Array.from({ length: 10 }, (_, i) => loaders2.menuItems.load(`item-${i + 1}`))
            );
            const callsFor10 = mockMenuRepository.getMenuItemsByIds.mock.calls.length;

            expect(callsFor3).toBe(1);
            expect(callsFor10).toBe(1);
        });
    });

    describe('orderItems loader', () => {
        it('should make exactly 1 DB call for N order item loads in same tick', async () => {
            mockOrdersRepository.getItemsByOrderIds.mockResolvedValue([
                {
                    id: 'oi-1',
                    order_id: 'order-1',
                    restaurant_id: 'restaurant-1',
                    item_id: 'item-1',
                    quantity: 1,
                    name: 'Item 1',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: null,
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 100,
                    special_request: null,
                },
                {
                    id: 'oi-2',
                    order_id: 'order-1',
                    restaurant_id: 'restaurant-1',
                    item_id: 'item-2',
                    quantity: 1,
                    name: 'Item 2',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: null,
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 200,
                    special_request: null,
                },
                {
                    id: 'oi-3',
                    order_id: 'order-2',
                    restaurant_id: 'restaurant-1',
                    item_id: 'item-3',
                    quantity: 1,
                    name: 'Item 3',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: null,
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 300,
                    special_request: null,
                },
                {
                    id: 'oi-4',
                    order_id: 'order-3',
                    restaurant_id: 'restaurant-1',
                    item_id: 'item-4',
                    quantity: 1,
                    name: 'Item 4',
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: null,
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: 400,
                    special_request: null,
                },
            ] as unknown as OrderItemRow[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            const [items1, items2, items3] = await Promise.all([
                loaders.orderItems.load('order-1'),
                loaders.orderItems.load('order-2'),
                loaders.orderItems.load('order-3'),
            ]);

            expect(mockOrdersRepository.getItemsByOrderIds).toHaveBeenCalledTimes(1);
            expect(mockOrdersRepository.getItemsByOrderIds).toHaveBeenCalledWith([
                'order-1',
                'order-2',
                'order-3',
            ]);
            expect(items1.length).toBeGreaterThan(0);
            expect(items2.length).toBeGreaterThan(0);
            expect(items3.length).toBeGreaterThan(0);
        });
    });

    describe('modifierGroups loader', () => {
        it('should make exactly 1 DB call for N modifier group loads in same tick', async () => {
            mockMenuRepository.getModifierGroupsByMenuItemIds.mockResolvedValue([
                { id: 'mg-1', menu_item_id: 'item-1', restaurant_id: 'restaurant-1' },
                { id: 'mg-2', menu_item_id: 'item-2', restaurant_id: 'restaurant-1' },
                { id: 'mg-3', menu_item_id: 'item-3', restaurant_id: 'restaurant-1' },
            ] as Record<string, unknown>[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([
                loaders.modifierGroups.load('item-1'),
                loaders.modifierGroups.load('item-2'),
                loaders.modifierGroups.load('item-3'),
            ]);

            expect(mockMenuRepository.getModifierGroupsByMenuItemIds).toHaveBeenCalledTimes(1);
            expect(mockMenuRepository.getModifierGroupsByMenuItemIds).toHaveBeenCalledWith([
                'item-1',
                'item-2',
                'item-3',
            ]);
        });
    });

    describe('categories loader', () => {
        it('should make exactly 1 DB call for N category loads in same tick', async () => {
            mockMenuRepository.getCategoriesByIds.mockResolvedValue([
                { id: 'cat-1', restaurant_id: 'restaurant-1', name: 'Cat 1' },
                { id: 'cat-2', restaurant_id: 'restaurant-1', name: 'Cat 2' },
                { id: 'cat-3', restaurant_id: 'restaurant-1', name: 'Cat 3' },
            ] as Record<string, unknown>[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([
                loaders.categories.load('cat-1'),
                loaders.categories.load('cat-2'),
                loaders.categories.load('cat-3'),
            ]);

            expect(mockMenuRepository.getCategoriesByIds).toHaveBeenCalledTimes(1);
            expect(mockMenuRepository.getCategoriesByIds).toHaveBeenCalledWith([
                'cat-1',
                'cat-2',
                'cat-3',
            ]);
        });
    });

    describe('HIGH-021: guests, payments, restaurants loaders', () => {
        it('should make exactly 1 DB call for N guest loads in same tick', async () => {
            const mockFrom = vi.fn();
            const mockSelect = vi.fn();

            createMockSupabaseClient.setResolver(() =>
                Promise.resolve({
                    data: [
                        {
                            id: 'guest-1',
                            restaurant_id: 'restaurant-1',
                            name: 'Guest 1',
                            identity_key: 'key1',
                            phone_hash: null,
                            email_hash: null,
                            language: 'en',
                            tags: [],
                            notes: null,
                            is_vip: false,
                            first_seen_at: '2024-01-01',
                            last_seen_at: '2024-01-01',
                            visit_count: 1,
                            lifetime_value: 0,
                            metadata: {},
                            created_at: '2024-01-01',
                            updated_at: '2024-01-01',
                        },
                        {
                            id: 'guest-2',
                            restaurant_id: 'restaurant-1',
                            name: 'Guest 2',
                            identity_key: 'key2',
                            phone_hash: null,
                            email_hash: null,
                            language: 'en',
                            tags: [],
                            notes: null,
                            is_vip: false,
                            first_seen_at: '2024-01-01',
                            last_seen_at: '2024-01-01',
                            visit_count: 1,
                            lifetime_value: 0,
                            metadata: {},
                            created_at: '2024-01-01',
                            updated_at: '2024-01-01',
                        },
                        {
                            id: 'guest-3',
                            restaurant_id: 'restaurant-1',
                            name: 'Guest 3',
                            identity_key: 'key3',
                            phone_hash: null,
                            email_hash: null,
                            language: 'en',
                            tags: [],
                            notes: null,
                            is_vip: false,
                            first_seen_at: '2024-01-01',
                            last_seen_at: '2024-01-01',
                            visit_count: 1,
                            lifetime_value: 0,
                            metadata: {},
                            created_at: '2024-01-01',
                            updated_at: '2024-01-01',
                        },
                    ],
                    error: null,
                })
            );

            const clientInstance = {
                from: mockFrom.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        in: vi.fn().mockResolvedValue({
                            data: [
                                {
                                    id: 'guest-1',
                                    restaurant_id: 'restaurant-1',
                                    name: 'Guest 1',
                                    identity_key: 'key1',
                                    phone_hash: null,
                                    email_hash: null,
                                    language: 'en',
                                    tags: [],
                                    notes: null,
                                    is_vip: false,
                                    first_seen_at: '2024-01-01',
                                    last_seen_at: '2024-01-01',
                                    visit_count: 1,
                                    lifetime_value: 0,
                                    metadata: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                                {
                                    id: 'guest-2',
                                    restaurant_id: 'restaurant-1',
                                    name: 'Guest 2',
                                    identity_key: 'key2',
                                    phone_hash: null,
                                    email_hash: null,
                                    language: 'en',
                                    tags: [],
                                    notes: null,
                                    is_vip: false,
                                    first_seen_at: '2024-01-01',
                                    last_seen_at: '2024-01-01',
                                    visit_count: 1,
                                    lifetime_value: 0,
                                    metadata: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                                {
                                    id: 'guest-3',
                                    restaurant_id: 'restaurant-1',
                                    name: 'Guest 3',
                                    identity_key: 'key3',
                                    phone_hash: null,
                                    email_hash: null,
                                    language: 'en',
                                    tags: [],
                                    notes: null,
                                    is_vip: false,
                                    first_seen_at: '2024-01-01',
                                    last_seen_at: '2024-01-01',
                                    visit_count: 1,
                                    lifetime_value: 0,
                                    metadata: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                            ],
                            error: null,
                        }),
                    }),
                }),
            };
            createMockSupabaseClient.mockReturnValue(
                clientInstance as unknown as ReturnType<
                    typeof createMockSupabaseClient extends vi.fn ? never : never
                >
            );

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([
                loaders.guests.load('guest-1'),
                loaders.guests.load('guest-2'),
                loaders.guests.load('guest-3'),
            ]);

            expect(mockFrom).toHaveBeenCalledWith('guests');
            expect(mockSelect).toHaveBeenCalledTimes(1);
        });

        it('should make exactly 1 DB call for N payment loads in same tick', async () => {
            const mockFrom = vi.fn();
            const mockSelect = vi.fn();

            const clientInstance = {
                from: mockFrom.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        in: vi.fn().mockResolvedValue({
                            data: [
                                {
                                    id: 'pay-1',
                                    restaurant_id: 'restaurant-1',
                                    order_id: 'order-1',
                                    amount: 1000,
                                    currency: 'ETB',
                                    status: 'captured',
                                    provider: 'cash',
                                    provider_tx_id: null,
                                    payment_session_id: null,
                                    split_id: null,
                                    metadata: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                                {
                                    id: 'pay-2',
                                    restaurant_id: 'restaurant-1',
                                    order_id: 'order-2',
                                    amount: 2000,
                                    currency: 'ETB',
                                    status: 'captured',
                                    provider: 'cash',
                                    provider_tx_id: null,
                                    payment_session_id: null,
                                    split_id: null,
                                    metadata: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                            ],
                            error: null,
                        }),
                    }),
                }),
            };
            createMockSupabaseClient.mockReturnValue(clientInstance as never);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([loaders.payments.load('pay-1'), loaders.payments.load('pay-2')]);

            expect(mockFrom).toHaveBeenCalledWith('payments');
            expect(mockSelect).toHaveBeenCalledTimes(1);
        });

        it('should make exactly 1 DB call for N restaurant loads in same tick', async () => {
            const mockFrom = vi.fn();
            const mockSelect = vi.fn();

            const clientInstance = {
                from: mockFrom.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        in: vi.fn().mockResolvedValue({
                            data: [
                                {
                                    id: 'rest-1',
                                    name: 'Restaurant 1',
                                    slug: 'rest-1',
                                    currency: 'ETB',
                                    timezone: 'Africa/Addis_Ababa',
                                    settings: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                                {
                                    id: 'rest-2',
                                    name: 'Restaurant 2',
                                    slug: 'rest-2',
                                    currency: 'ETB',
                                    timezone: 'Africa/Addis_Ababa',
                                    settings: {},
                                    created_at: '2024-01-01',
                                    updated_at: '2024-01-01',
                                },
                            ],
                            error: null,
                        }),
                    }),
                }),
            };
            createMockSupabaseClient.mockReturnValue(clientInstance as never);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([
                loaders.restaurants.load('rest-1'),
                loaders.restaurants.load('rest-2'),
            ]);

            expect(mockFrom).toHaveBeenCalledWith('restaurants');
            expect(mockSelect).toHaveBeenCalledTimes(1);
        });
    });

    describe('cross-loader N+1 prevention', () => {
        it('should batch loads across different loaders independently', async () => {
            mockMenuRepository.getMenuItemsByIds.mockResolvedValue([
                { id: 'item-1', restaurant_id: 'restaurant-1', name: 'Item 1' },
            ] as Record<string, unknown>[]);
            mockMenuRepository.getCategoriesByIds.mockResolvedValue([
                { id: 'cat-1', restaurant_id: 'restaurant-1', name: 'Cat 1' },
            ] as Record<string, unknown>[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([loaders.menuItems.load('item-1'), loaders.categories.load('cat-1')]);

            expect(mockMenuRepository.getMenuItemsByIds).toHaveBeenCalledTimes(1);
            expect(mockMenuRepository.getCategoriesByIds).toHaveBeenCalledTimes(1);
        });

        it('should prevent N+1 when loading nested relations (order -> items)', async () => {
            mockOrdersRepository.getItemsByOrderIds.mockResolvedValue(
                Array.from({ length: 10 }, (_, i) => ({
                    id: `oi-${i + 1}`,
                    order_id: `order-${Math.floor(i / 2) + 1}`,
                    restaurant_id: 'restaurant-1',
                    item_id: `item-${i + 1}`,
                    quantity: 1,
                    name: `Item ${i + 1}`,
                    modifiers: null,
                    notes: null,
                    status: null,
                    course: null,
                    created_at: null,
                    completed_at: null,
                    idempotency_key: null,
                    price: (i + 1) * 100,
                    special_request: null,
                })) as unknown as OrderItemRow[]
            );

            const loaders = createDataLoaders(TENANT_CONTEXT);

            const orderIds = ['order-1', 'order-2', 'order-3', 'order-4', 'order-5'];
            await Promise.all(orderIds.map(id => loaders.orderItems.load(id)));

            expect(mockOrdersRepository.getItemsByOrderIds).toHaveBeenCalledTimes(1);
            expect(mockOrdersRepository.getItemsByOrderIds).toHaveBeenCalledWith(orderIds);
        });
    });

    describe('query count regression detection', () => {
        it('should detect if DataLoader batching is broken (regression test)', async () => {
            mockMenuRepository.getMenuItemsByIds.mockResolvedValue([
                { id: 'item-1', restaurant_id: 'restaurant-1', name: 'Item 1' },
                { id: 'item-2', restaurant_id: 'restaurant-1', name: 'Item 2' },
            ] as Record<string, unknown>[]);

            const loaders = createDataLoaders(TENANT_CONTEXT);

            await Promise.all([loaders.menuItems.load('item-1'), loaders.menuItems.load('item-2')]);

            const calls = mockMenuRepository.getMenuItemsByIds.mock.calls;
            expect(calls.length).toBe(1);
            expect(calls[0][0]).toEqual(['item-1', 'item-2']);
        });
    });
});
