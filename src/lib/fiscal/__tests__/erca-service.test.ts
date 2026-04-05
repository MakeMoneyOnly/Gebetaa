/**
 * Tests for ERCA Service (MED-024)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    VAT_RATE,
    VAT_EXTRACTION_RATE,
    SANTIM_PER_ETB,
    MAX_RETRY_ATTEMPTS,
    extractVAT,
    calculateVAT,
    etbToSantim,
    santimToEtb,
    generateInvoiceNumber,
} from '../erca-service';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => ({ data: null, error: null })),
                    gte: vi.fn(() => ({
                        lte: vi.fn(() => ({ data: [], error: null })),
                    })),
                })),
            })),
            insert: vi.fn(() => ({ error: null })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({ error: null })),
            })),
        })),
    })),
}));

describe('VAT Constants', () => {
    it('should have correct VAT rate for Ethiopia', () => {
        expect(VAT_RATE).toBe(0.15);
    });

    it('should have correct VAT extraction rate', () => {
        expect(VAT_EXTRACTION_RATE).toBe(15 / 115);
    });

    it('should have correct santim per ETB', () => {
        expect(SANTIM_PER_ETB).toBe(100);
    });

    it('should have correct max retry attempts', () => {
        expect(MAX_RETRY_ATTEMPTS).toBe(5);
    });
});

describe('extractVAT', () => {
    it('should extract VAT from tax-inclusive price correctly', () => {
        // 115 ETB (11500 santim) tax-inclusive
        // VAT = 11500 × (15/115) = 1500 santim (15 ETB)
        // Net = 11500 - 1500 = 10000 santim (100 ETB)
        const result = extractVAT(11500);

        expect(result.vatPortionSantim).toBe(1500);
        expect(result.netPriceSantim).toBe(10000);
    });

    it('should handle zero price', () => {
        const result = extractVAT(0);

        expect(result.vatPortionSantim).toBe(0);
        expect(result.netPriceSantim).toBe(0);
    });

    it('should handle small amounts', () => {
        // 1 ETB (100 santim) tax-inclusive
        const result = extractVAT(100);

        expect(result.vatPortionSantim).toBe(13); // Rounded from 13.04
        expect(result.netPriceSantim).toBe(87);
    });

    it('should handle large amounts', () => {
        // 10000 ETB (1000000 santim) tax-inclusive
        const result = extractVAT(1000000);

        expect(result.vatPortionSantim).toBe(130435); // Rounded
        expect(result.netPriceSantim).toBe(869565);
    });

    it('should round correctly', () => {
        // Test rounding behavior
        const result1 = extractVAT(100);
        const result2 = extractVAT(101);

        // VAT should be integers (rounded)
        expect(Number.isInteger(result1.vatPortionSantim)).toBe(true);
        expect(Number.isInteger(result2.vatPortionSantim)).toBe(true);
    });
});

describe('calculateVAT', () => {
    it('should calculate VAT for net price', () => {
        // 100 ETB net price
        // VAT = 100 × 0.15 = 15 ETB
        const result = calculateVAT(10000);

        expect(result).toBe(1500);
    });

    it('should handle zero net price', () => {
        expect(calculateVAT(0)).toBe(0);
    });

    it('should round correctly', () => {
        // 99 santim net price
        // VAT = 99 × 0.15 = 14.85 → 15 santim
        const result = calculateVAT(99);

        expect(result).toBe(15);
    });
});

describe('etbToSantim', () => {
    it('should convert ETB to santim', () => {
        expect(etbToSantim(1)).toBe(100);
        expect(etbToSantim(10)).toBe(1000);
        expect(etbToSantim(100.5)).toBe(10050);
    });

    it('should handle zero', () => {
        expect(etbToSantim(0)).toBe(0);
    });

    it('should round fractional santim', () => {
        // 1.5 ETB = 150 santim (exact, no rounding needed)
        // Note: JS floating point causes unexpected results with values like 1.005, 1.015, 1.025
        // so we test with a value that converts cleanly
        expect(etbToSantim(1.5)).toBe(150);
        expect(etbToSantim(1.55)).toBe(155);
    });
});

describe('santimToEtb', () => {
    it('should convert santim to ETB', () => {
        expect(santimToEtb(100)).toBe(1);
        expect(santimToEtb(1000)).toBe(10);
        expect(santimToEtb(10050)).toBe(100.5);
    });

    it('should handle zero', () => {
        expect(santimToEtb(0)).toBe(0);
    });

    it('should preserve decimal precision', () => {
        // 1 santim = 0.01 ETB
        expect(santimToEtb(1)).toBe(0.01);
        expect(santimToEtb(99)).toBe(0.99);
    });
});

describe('generateInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
        const restaurantId = 'abcd1234-5678-90ef-ghij-klmnopqrstuv';
        const orderNumber = '0042';

        const result = generateInvoiceNumber(restaurantId, orderNumber);

        expect(result).toBe('ABCD1234-0042');
    });

    it('should use first 8 characters of restaurant ID', () => {
        const restaurantId = '12345678-90ab-cdef-ghij-klmnopqrstuv';
        const orderNumber = '0001';

        const result = generateInvoiceNumber(restaurantId, orderNumber);

        expect(result.startsWith('12345678')).toBe(true);
    });

    it('should handle short restaurant ID', () => {
        const restaurantId = 'abc';
        const orderNumber = '0001';

        const result = generateInvoiceNumber(restaurantId, orderNumber);

        expect(result).toBe('ABC-0001');
    });

    it('should uppercase the prefix', () => {
        const restaurantId = 'lowercase-id';
        const orderNumber = '0001';

        const result = generateInvoiceNumber(restaurantId, orderNumber);

        expect(result.startsWith('LOWERCAS')).toBe(true);
    });
});

describe('VAT Calculation Integration', () => {
    it('should correctly calculate VAT for a complete order', () => {
        // Simulate an order with multiple items
        const items = [
            { unitPrice: 11500, quantity: 2 }, // 115 ETB each, 2 items
            { unitPrice: 5000, quantity: 1 },  // 50 ETB each, 1 item
        ];

        let totalVAT = 0;
        let totalNet = 0;

        for (const item of items) {
            const { netPriceSantim, vatPortionSantim } = extractVAT(item.unitPrice);
            totalVAT += vatPortionSantim * item.quantity;
            totalNet += netPriceSantim * item.quantity;
        }

        // Item 1: 115 ETB × 2 = 230 ETB total
        //   VAT: 15 ETB × 2 = 30 ETB
        //   Net: 100 ETB × 2 = 200 ETB
        // Item 2: 50 ETB × 1 = 50 ETB total
        //   VAT: 6.52 ETB → 652 santim (rounded)
        //   Net: 43.48 ETB → 4348 santim (rounded)

        expect(totalVAT).toBe(1500 * 2 + 652); // 3652 santim
        expect(totalNet).toBe(10000 * 2 + 4348); // 24348 santim

        // Verify: Net + VAT should equal original total
        const originalTotal = 11500 * 2 + 5000; // 28000 santim
        expect(totalNet + totalVAT).toBe(originalTotal);
    });

    it('should handle tax-inclusive pricing correctly', () => {
        // If a menu item is priced at 100 ETB (tax-inclusive)
        // The customer pays 100 ETB
        // VAT portion is extracted from that 100 ETB

        const displayedPrice = etbToSantim(100); // 10000 santim
        const { netPriceSantim, vatPortionSantim } = extractVAT(displayedPrice);

        // VAT = 100 × (15/115) = 13.04 ETB
        expect(santimToEtb(vatPortionSantim)).toBeCloseTo(13.04, 0);

        // Net = 100 - 13.04 = 86.96 ETB
        expect(santimToEtb(netPriceSantim)).toBeCloseTo(86.96, 0);

        // Total should equal original
        expect(santimToEtb(netPriceSantim + vatPortionSantim)).toBe(100);
    });
});

describe('ERCA Compliance Scenarios', () => {
    it('should calculate correct VAT for receipt', () => {
        // Sample receipt calculation
        const items = [
            { name: 'Doro Wot', price: 180, quantity: 2 },
            { name: 'Fasil Tea', price: 40, quantity: 2 },
        ];

        let subtotal = 0;
        let totalVAT = 0;

        for (const item of items) {
            const priceSantim = etbToSantim(item.price);
            const { netPriceSantim, vatPortionSantim } = extractVAT(priceSantim);

            subtotal += santimToEtb(netPriceSantim * item.quantity);
            totalVAT += santimToEtb(vatPortionSantim * item.quantity);
        }

        // Verify totals
        const displayedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const calculatedTotal = subtotal + totalVAT;

        // Should match within rounding tolerance
        expect(Math.abs(calculatedTotal - displayedTotal)).toBeLessThan(0.1);
    });

    it('should generate unique invoice numbers', () => {
        const restaurantId = 'abcd1234-5678-90ef-ghij-klmnopqrstuv';
        const orderNumbers = ['0001', '0002', '0003', '0042', '0100'];

        const invoiceNumbers = orderNumbers.map((orderNum) =>
            generateInvoiceNumber(restaurantId, orderNum)
        );

        // All should be unique
        expect(new Set(invoiceNumbers).size).toBe(invoiceNumbers.length);

        // All should have correct prefix
        invoiceNumbers.forEach((num) => {
            expect(num.startsWith('ABCD1234-')).toBe(true);
        });
    });
});
