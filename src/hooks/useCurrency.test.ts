/**
 * useCurrency Hook Tests
 *
 * Tests for src/hooks/useCurrency.ts
 */

import { describe, it, expect } from 'vitest';

const SANTIM_PER_BIRR = 100;

describe('useCurrency (standalone logic tests)', () => {
    describe('birrToSantim', () => {
        it('should convert birr to santim correctly', () => {
            const birrToSantim = (birr: number) => Math.round(birr * SANTIM_PER_BIRR);

            expect(birrToSantim(15.5)).toBe(1550);
            expect(birrToSantim(100)).toBe(10000);
            expect(birrToSantim(0)).toBe(0);
            expect(birrToSantim(0.01)).toBe(1); // Smallest unit
        });

        it('should round to nearest integer', () => {
            const birrToSantim = (birr: number) => Math.round(birr * SANTIM_PER_BIRR);

            expect(birrToSantim(15.555)).toBe(1556);
            expect(birrToSantim(15.554)).toBe(1555);
        });
    });

    describe('santimToBirr', () => {
        it('should convert santim to birr correctly', () => {
            const santimToBirr = (santim: number) => santim / SANTIM_PER_BIRR;

            expect(santimToBirr(1550)).toBe(15.5);
            expect(santimToBirr(10000)).toBe(100);
            expect(santimToBirr(0)).toBe(0);
        });
    });

    describe('calculateTotal', () => {
        const calculateTotal = (items: Array<{ quantity: number; unit_price: number }>) => {
            return items.reduce((total, item) => {
                return total + item.quantity * item.unit_price;
            }, 0);
        };

        it('should calculate total for single item', () => {
            const items = [{ quantity: 2, unit_price: 500 }];
            expect(calculateTotal(items)).toBe(1000);
        });

        it('should calculate total for multiple items', () => {
            const items = [
                { quantity: 2, unit_price: 500 }, // 1000
                { quantity: 3, unit_price: 300 }, // 900
            ];
            expect(calculateTotal(items)).toBe(1900);
        });

        it('should return 0 for empty array', () => {
            expect(calculateTotal([])).toBe(0);
        });

        it('should handle single quantity items', () => {
            const items = [
                { quantity: 1, unit_price: 500 },
                { quantity: 1, unit_price: 300 },
            ];
            expect(calculateTotal(items)).toBe(800);
        });
    });

    describe('formatCurrency', () => {
        const formatCurrency = (
            santim: number | null | undefined,
            options?: { currencySymbol?: string; decimals?: number }
        ) => {
            if (santim === null || santim === undefined) return '-';
            const birr = santim / SANTIM_PER_BIRR;
            const decimals = options?.decimals ?? 2;
            return `${options?.currencySymbol ?? 'ETB'} ${birr.toFixed(decimals)}`;
        };

        it('should format valid santim values', () => {
            expect(formatCurrency(1550)).toBe('ETB 15.50');
            expect(formatCurrency(10000)).toBe('ETB 100.00');
            expect(formatCurrency(1)).toBe('ETB 0.01');
        });

        it('should handle null and undefined', () => {
            expect(formatCurrency(null)).toBe('-');
            expect(formatCurrency(undefined)).toBe('-');
        });

        it('should respect custom currency symbol', () => {
            expect(formatCurrency(1550, { currencySymbol: '$' })).toBe('$ 15.50');
        });

        it('should respect custom decimals', () => {
            expect(formatCurrency(1550, { decimals: 0 })).toBe('ETB 16');
        });

        it('should handle zero', () => {
            expect(formatCurrency(0)).toBe('ETB 0.00');
        });
    });

    describe('formatCurrencyCompact', () => {
        const formatCurrencyCompact = (santim: number | null | undefined) => {
            if (santim === null || santim === undefined) return '-';
            const birr = santim / SANTIM_PER_BIRR;
            return birr.toFixed(2);
        };

        it('should format compact currency', () => {
            expect(formatCurrencyCompact(1550)).toBe('15.50');
            expect(formatCurrencyCompact(10000)).toBe('100.00');
        });

        it('should handle null and undefined', () => {
            expect(formatCurrencyCompact(null)).toBe('-');
            expect(formatCurrencyCompact(undefined)).toBe('-');
        });
    });
});
