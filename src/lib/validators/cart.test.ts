/**
 * Cart Validator Tests
 *
 * Tests for src/lib/validators/cart.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    CartItemSchema,
    CartStorageSchema,
    OrderHistoryStorageSchema,
    safeParseCartStorage,
    safeParseOrderHistoryStorage,
    safeGetLocalStorage,
    safeSetLocalStorage,
    type ValidatedCartItem,
} from '@/lib/validators/cart';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
});

describe('cart validators', () => {
    describe('CartItemSchema', () => {
        it('should validate a valid cart item', () => {
            const validItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                price: 500, // 5 ETB in santim
                quantity: 2,
            };

            const result = CartItemSchema.safeParse(validItem);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            const invalidItem = {
                id: 'not-a-uuid',
                name: 'Coffee',
                price: 500,
                quantity: 1,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should reject empty name', () => {
            const invalidItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: '',
                price: 500,
                quantity: 1,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should reject negative price', () => {
            const invalidItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                price: -100,
                quantity: 1,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should reject zero price', () => {
            const invalidItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                price: 0,
                quantity: 1,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should reject non-integer price', () => {
            const invalidItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                price: 5.5, // Decimal not allowed
                quantity: 1,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should reject zero quantity', () => {
            const invalidItem = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                price: 500,
                quantity: 0,
            };

            const result = CartItemSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });

        it('should accept optional fields', () => {
            const itemWithOptionals = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Coffee',
                name_am: 'ቡና',
                price: 500,
                quantity: 1,
                image_url: 'https://example.com/coffee.jpg',
                station: 'coffee' as const,
                notes: 'No sugar',
                modifiers: 'Extra milk',
            };

            const result = CartItemSchema.safeParse(itemWithOptionals);
            expect(result.success).toBe(true);
        });

        it('should accept all station types', () => {
            const stations = ['kitchen', 'bar', 'dessert', 'coffee'] as const;

            stations.forEach(station => {
                const item = {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Item',
                    price: 500,
                    quantity: 1,
                    station,
                };

                const result = CartItemSchema.safeParse(item);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CartStorageSchema', () => {
        it('should validate valid cart storage', () => {
            const validCart = {
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Coffee',
                        price: 500,
                        quantity: 1,
                    },
                ],
                restaurantSlug: 'my-restaurant',
                tableNumber: 'T1',
            };

            const result = CartStorageSchema.safeParse(validCart);
            expect(result.success).toBe(true);
        });

        it('should allow null tableNumber', () => {
            const validCart = {
                items: [],
                restaurantSlug: 'my-restaurant',
                tableNumber: null,
            };

            const result = CartStorageSchema.safeParse(validCart);
            expect(result.success).toBe(true);
        });

        it('should reject missing items', () => {
            const invalidCart = {
                restaurantSlug: 'my-restaurant',
                tableNumber: 'T1',
            };

            const result = CartStorageSchema.safeParse(invalidCart);
            expect(result.success).toBe(false);
        });

        it('should reject empty restaurant slug', () => {
            const invalidCart = {
                items: [],
                restaurantSlug: '',
                tableNumber: 'T1',
            };

            const result = CartStorageSchema.safeParse(invalidCart);
            expect(result.success).toBe(false);
        });
    });

    describe('OrderHistoryStorageSchema', () => {
        it('should validate valid order history', () => {
            const validHistory = {
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Coffee',
                        price: 500,
                        quantity: 1,
                    },
                ],
                restaurantSlug: 'my-restaurant',
            };

            const result = OrderHistoryStorageSchema.safeParse(validHistory);
            expect(result.success).toBe(true);
        });

        it('should not require tableNumber', () => {
            const validHistory = {
                items: [],
                restaurantSlug: 'my-restaurant',
            };

            const result = OrderHistoryStorageSchema.safeParse(validHistory);
            expect(result.success).toBe(true);
        });
    });

    describe('safeParseCartStorage', () => {
        it('should return parsed data for valid input', () => {
            const validData = {
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Coffee',
                        price: 500,
                        quantity: 1,
                    },
                ],
                restaurantSlug: 'my-restaurant',
                tableNumber: 'T1',
            };

            const result = safeParseCartStorage(validData);
            expect(result).not.toBeNull();
            expect(result?.items).toHaveLength(1);
            expect(result?.restaurantSlug).toBe('my-restaurant');
        });

        it('should return null for invalid input', () => {
            const invalidData = {
                items: 'not-an-array',
                restaurantSlug: '',
            };

            const result = safeParseCartStorage(invalidData);
            expect(result).toBeNull();
        });

        it('should return null for missing data', () => {
            const result = safeParseCartStorage(null);
            expect(result).toBeNull();
        });
    });

    describe('safeParseOrderHistoryStorage', () => {
        it('should return parsed data for valid input', () => {
            const validData = {
                items: [],
                restaurantSlug: 'my-restaurant',
            };

            const result = safeParseOrderHistoryStorage(validData);
            expect(result).not.toBeNull();
        });

        it('should return null for invalid input', () => {
            const result = safeParseOrderHistoryStorage(undefined);
            expect(result).toBeNull();
        });
    });

    describe('safeGetLocalStorage', () => {
        beforeEach(() => {
            localStorageMock.clear();
        });

        it('should return parsed data for valid JSON', () => {
            localStorageMock.getItem = vi.fn().mockReturnValue('{"key":"value"}');

            const result = safeGetLocalStorage<{ key: string }>('test-key');
            expect(result).toEqual({ key: 'value' });
        });

        it('should return null for missing key', () => {
            localStorageMock.getItem = vi.fn().mockReturnValue(null);

            const result = safeGetLocalStorage('missing-key');
            expect(result).toBeNull();
        });

        it('should return null for invalid JSON', () => {
            localStorageMock.getItem = vi.fn().mockReturnValue('not valid json');

            const result = safeGetLocalStorage('test-key');
            expect(result).toBeNull();
        });
    });

    describe('safeSetLocalStorage', () => {
        beforeEach(() => {
            localStorageMock.clear();
        });

        it('should return true for successful storage', () => {
            const result = safeSetLocalStorage('test-key', { key: 'value' });
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should return false when localStorage is full', () => {
            localStorageMock.setItem = vi.fn().mockImplementation(() => {
                throw new Error('Quota exceeded');
            });

            const result = safeSetLocalStorage('test-key', { key: 'value' });
            expect(result).toBe(false);
        });
    });
});
