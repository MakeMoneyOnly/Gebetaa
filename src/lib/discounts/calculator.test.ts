import { describe, expect, it } from 'vitest';
import { calculateDiscount } from '@/lib/discounts/calculator';
import type { DiscountRecord } from '@/lib/discounts/types';

const items = [
    {
        id: 'item-1',
        category_id: 'cat-1',
        price: 100,
        quantity: 2,
    },
    {
        id: 'item-2',
        category_id: 'cat-2',
        price: 50,
        quantity: 2,
    },
];

function createDiscount(overrides: Partial<DiscountRecord>): DiscountRecord {
    return {
        id: 'discount-1',
        restaurant_id: 'restaurant-1',
        name: 'Promo',
        name_am: null,
        type: 'percentage',
        value: 1000,
        applies_to: 'order',
        target_menu_item_id: null,
        target_category_id: null,
        requires_manager_pin: false,
        max_uses_per_day: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
        ...overrides,
    };
}

describe('calculateDiscount', () => {
    it('applies percentage discounts across the order subtotal', () => {
        const result = calculateDiscount(
            items,
            createDiscount({ type: 'percentage', value: 1000, applies_to: 'order' })
        );

        expect(result.subtotal).toBe(300);
        expect(result.discountAmount).toBe(30);
        expect(result.total).toBe(270);
    });

    it('caps fixed discounts at the eligible subtotal', () => {
        const result = calculateDiscount(
            items,
            createDiscount({ type: 'fixed_amount', value: 500, applies_to: 'category', target_category_id: 'cat-2' })
        );

        expect(result.discountAmount).toBe(100);
        expect(result.total).toBe(200);
    });

    it('calculates bogo using the cheapest eligible units as the free items', () => {
        const result = calculateDiscount(
            items,
            createDiscount({ type: 'bogo', applies_to: 'item', target_menu_item_id: 'item-1' })
        );

        expect(result.discountAmount).toBe(100);
        expect(result.total).toBe(200);
    });

    it('supports item override pricing', () => {
        const result = calculateDiscount(
            items,
            createDiscount({
                type: 'item_override',
                applies_to: 'item',
                target_menu_item_id: 'item-1',
                value: 60,
            })
        );

        expect(result.discountAmount).toBe(80);
        expect(result.total).toBe(220);
    });
});
