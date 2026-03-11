import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    validateOrderItems,
    checkRateLimit,
    checkDuplicateOrder,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from './orderService';

// Mock the queries module
vi.mock('@/lib/supabase/queries', () => ({
    getOrderByIdempotencyKey: vi.fn(),
    insertOrder: vi.fn(),
    fetchItemsForValidation: vi.fn(),
}));

import { fetchItemsForValidation, getOrderByIdempotencyKey } from '@/lib/supabase/queries';

const mockSupabaseFrom = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
});

const makeSupabase = (fromOverride?: Record<string, unknown>) => ({
    from: vi.fn().mockReturnValue({ ...mockSupabaseFrom(), ...(fromOverride ?? {}) }),
    auth: { getUser: vi.fn() },
});

describe('orderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateGuestFingerprint', () => {
        it('generates fingerprint from ip and user agent', () => {
            const fp = generateGuestFingerprint('192.168.1.1', 'Mozilla/5.0');
            expect(fp).toBe('192.168.1.1-Mozilla/5.0');
        });

        it('uses "unknown" when user agent is null', () => {
            const fp = generateGuestFingerprint('10.0.0.1', null);
            expect(fp).toBe('10.0.0.1-unknown');
        });

        it('uses "unknown" when user agent is empty string', () => {
            const fp = generateGuestFingerprint('10.0.0.1', '');
            expect(fp).toBe('10.0.0.1-unknown');
        });
    });

    describe('generateIdempotencyKey', () => {
        it('returns a UUID string', () => {
            const key = generateIdempotencyKey();
            expect(key).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
            );
        });

        it('generates unique keys', () => {
            const key1 = generateIdempotencyKey();
            const key2 = generateIdempotencyKey();
            expect(key1).not.toBe(key2);
        });
    });

    describe('validateOrderItems', () => {
        const items = [
            { id: 'item-1', name: 'Injera', quantity: 2, price: 50 },
            { id: 'item-2', name: 'Tibs', quantity: 1, price: 150 },
        ];

        it('returns invalid when fetchItemsForValidation errors', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: null,
                error: { message: 'DB error' } as any,
            });

            const result = await validateOrderItems(
                {} as any,
                items,
                250 // total = 2*50 + 1*150
            );
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Failed to validate items');
        });

        it('returns invalid when items are not found in DB', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [{ id: 'item-1', price: 50, is_available: true, station: 'kitchen', course: 'main' }],
                error: null,
            });

            const result = await validateOrderItems({} as any, items, 250);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Items not found');
        });

        it('returns invalid when an item is unavailable', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [
                    { id: 'item-1', price: 50, is_available: false, station: 'kitchen', course: 'main' },
                    { id: 'item-2', price: 150, is_available: true, station: 'kitchen', course: 'main' },
                ],
                error: null,
            });

            const result = await validateOrderItems({} as any, items, 250);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('sold out');
        });

        it('returns invalid when total price does not match', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [
                    { id: 'item-1', price: 50, is_available: true, station: 'kitchen', course: 'main' },
                    { id: 'item-2', price: 150, is_available: true, station: 'kitchen', course: 'main' },
                ],
                error: null,
            });

            const result = await validateOrderItems({} as any, items, 999); // wrong total
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Price mismatch');
        });

        it('returns valid when all items exist and total matches', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [
                    { id: 'item-1', price: 50, is_available: true, station: 'kitchen', course: 'main' },
                    { id: 'item-2', price: 150, is_available: true, station: 'kitchen', course: 'main' },
                ],
                error: null,
            });

            const result = await validateOrderItems(
                {} as any,
                items,
                250 // 2*50 + 1*150 = 250
            );
            expect(result.isValid).toBe(true);
            expect(result.calculatedTotal).toBe(250);
            expect(result.enrichedItems).toHaveLength(2);
        });

        it('accounts for discount amount in total validation', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [
                    { id: 'item-1', price: 50, is_available: true, station: 'kitchen', course: 'main' },
                    { id: 'item-2', price: 150, is_available: true, station: 'kitchen', course: 'main' },
                ],
                error: null,
            });

            const result = await validateOrderItems(
                {} as any,
                items,
                225, // 250 - 25 discount
                25
            );
            expect(result.isValid).toBe(true);
        });

        it('adds default station and course if missing', async () => {
            vi.mocked(fetchItemsForValidation).mockResolvedValue({
                data: [
                    { id: 'item-1', price: 50, is_available: true, station: null, course: null },
                ],
                error: null,
            });

            const result = await validateOrderItems(
                {} as any,
                [{ id: 'item-1', name: 'Injera', quantity: 2, price: 50 }],
                100
            );
            expect(result.isValid).toBe(true);
            expect(result.enrichedItems?.[0].station).toBe('kitchen');
            expect(result.enrichedItems?.[0].course).toBe('main');
        });
    });

    describe('checkRateLimit', () => {
        it('returns allowed=true when count is below max', async () => {
            const supabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    gt: vi.fn().mockResolvedValue({ count: 2, error: null }),
                }),
            };

            const result = await checkRateLimit(supabase as any, 'fp-1');
            expect(result.allowed).toBe(true);
            expect(result.remainingOrders).toBe(3);
        });

        it('returns allowed=false when at or above max orders', async () => {
            const supabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    gt: vi.fn().mockResolvedValue({ count: 5, error: null }),
                }),
            };

            const result = await checkRateLimit(supabase as any, 'fp-1');
            expect(result.allowed).toBe(false);
            expect(result.remainingOrders).toBe(0);
        });

        it('fails open when database errors', async () => {
            const supabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    gt: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
                }),
            };

            const result = await checkRateLimit(supabase as any, 'fp-1');
            expect(result.allowed).toBe(true);
        });

        it('respects custom maxOrders and windowMinutes', async () => {
            const supabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    gt: vi.fn().mockResolvedValue({ count: 3, error: null }),
                }),
            };

            const result = await checkRateLimit(supabase as any, 'fp-1', 10, 30);
            expect(result.allowed).toBe(true);
            expect(result.remainingOrders).toBe(7);
        });

        it('returns a resetTime', async () => {
            const supabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    gt: vi.fn().mockResolvedValue({ count: 0, error: null }),
                }),
            };

            const result = await checkRateLimit(supabase as any, 'fp-1');
            expect(result.resetTime).toBeInstanceOf(Date);
        });
    });

    describe('checkDuplicateOrder', () => {
        it('returns null when no duplicate found', async () => {
            vi.mocked(getOrderByIdempotencyKey).mockResolvedValue({ data: null, error: null });

            const result = await checkDuplicateOrder({} as any, 'idem-key-1');
            expect(result).toBeNull();
        });

        it('returns order data when duplicate found', async () => {
            vi.mocked(getOrderByIdempotencyKey).mockResolvedValue({
                data: { id: 'order-1', status: 'pending' },
                error: null,
            });

            const result = await checkDuplicateOrder({} as any, 'idem-key-1');
            expect(result).toEqual({ id: 'order-1', status: 'pending' });
        });

        it('returns null when query errors', async () => {
            vi.mocked(getOrderByIdempotencyKey).mockResolvedValue({
                data: null,
                error: { message: 'DB error' } as any,
            });

            const result = await checkDuplicateOrder({} as any, 'idem-key-1');
            expect(result).toBeNull();
        });
    });
});
