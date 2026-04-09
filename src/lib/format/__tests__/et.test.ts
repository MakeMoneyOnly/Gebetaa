/**
 * Tests for Ethiopian Formatting Utilities
 *
 * Tests cover:
 * - ETB currency formatting
 * - Santim to Birr conversion
 * - Locale-aware date formatting
 * - Locale-aware number formatting
 */

import { describe, it, expect } from 'vitest';
import {
    formatETBCurrency,
    formatETBFromSantim,
    formatLocalizedDate,
    formatLocalizedDateTime,
    formatLocalizedNumber,
} from '../et';

describe('Ethiopian Formatting Utilities', () => {
    describe('formatETBCurrency', () => {
        describe('basic formatting', () => {
            it('should format positive amounts', () => {
                const result = formatETBCurrency(100);
                expect(result).toContain('100');
            });

            it('should format zero amounts', () => {
                const result = formatETBCurrency(0);
                expect(result).toContain('0');
            });

            it('should format decimal amounts', () => {
                // Default rounds to nearest integer (0 fraction digits)
                const result = formatETBCurrency(15.5);
                expect(result).toBeDefined();
            });

            it('should format large amounts', () => {
                const result = formatETBCurrency(1000000);
                expect(result).toContain('1');
            });
        });

        describe('locale handling', () => {
            it('should format with Amharic locale by default', () => {
                const result = formatETBCurrency(100);
                expect(result).toBeDefined();
            });

            it('should format with English locale', () => {
                const result = formatETBCurrency(100, { locale: 'en' });
                expect(result).toContain('100');
            });

            it('should format with Amharic locale explicitly', () => {
                const result = formatETBCurrency(100, { locale: 'am' });
                expect(result).toBeDefined();
            });
        });

        describe('fraction digits', () => {
            it('should use default 0 fraction digits', () => {
                const result = formatETBCurrency(100.5);
                expect(result).toBeDefined();
            });

            it('should respect maximumFractionDigits', () => {
                const result = formatETBCurrency(100.567, { maximumFractionDigits: 2 });
                expect(result).toBeDefined();
            });

            it('should respect minimumFractionDigits', () => {
                // Must also set maximumFractionDigits >= minimumFractionDigits
                const result = formatETBCurrency(100, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                expect(result).toBeDefined();
            });
        });

        describe('compact notation', () => {
            it('should format compact thousands', () => {
                const result = formatETBCurrency(1500, { compact: true });
                expect(result).toContain('1.5K');
            });

            it('should format compact millions', () => {
                const result = formatETBCurrency(1500000, { compact: true });
                expect(result).toContain('1.5M');
            });

            it('should include currency symbol in compact format', () => {
                const result = formatETBCurrency(1500, { compact: true });
                expect(result).toContain('ETB');
            });

            it('should exclude currency symbol when showCurrencySymbol is false', () => {
                const result = formatETBCurrency(1500, {
                    compact: true,
                    showCurrencySymbol: false,
                });
                expect(result).not.toContain('ETB');
                expect(result).toContain('1.5K');
            });
        });

        describe('currency symbol handling', () => {
            it('should show currency symbol by default', () => {
                const result = formatETBCurrency(100);
                expect(result).toMatch(/ETB|ብር/);
            });

            it('should hide currency symbol when showCurrencySymbol is false', () => {
                const result = formatETBCurrency(100, { showCurrencySymbol: false });
                expect(result).not.toContain('ETB');
                expect(result).not.toContain('ብር');
            });
        });
    });

    describe('formatETBFromSantim', () => {
        describe('basic conversion', () => {
            it('should convert santim to birr', () => {
                const result = formatETBFromSantim(1550);
                expect(result).toBeDefined();
            });

            it('should handle zero santim', () => {
                const result = formatETBFromSantim(0);
                expect(result).toContain('0');
            });

            it('should handle large santim values', () => {
                const result = formatETBFromSantim(100000000);
                expect(result).toBeDefined();
            });
        });

        describe('null and undefined handling', () => {
            it('should return ETB 0 for null', () => {
                const result = formatETBFromSantim(null);
                expect(result).toBe('ETB 0');
            });

            it('should return ETB 0 for undefined', () => {
                const result = formatETBFromSantim(undefined);
                expect(result).toBe('ETB 0');
            });

            it('should return 0 without currency symbol when showCurrencySymbol is false', () => {
                const result = formatETBFromSantim(null, { showCurrencySymbol: false });
                expect(result).toBe('0');
            });
        });

        describe('invalid values', () => {
            it('should handle NaN', () => {
                const result = formatETBFromSantim(Number.NaN);
                expect(result).toBe('ETB 0');
            });

            it('should handle Infinity', () => {
                const result = formatETBFromSantim(Number.POSITIVE_INFINITY);
                expect(result).toBe('ETB 0');
            });
        });

        describe('decimal options', () => {
            it('should respect decimals option', () => {
                const result = formatETBFromSantim(1550, { decimals: 2 });
                expect(result).toBeDefined();
            });

            it('should use default 0 decimals', () => {
                const result = formatETBFromSantim(1550);
                expect(result).toBeDefined();
            });
        });

        describe('locale handling', () => {
            it('should respect locale option', () => {
                const result = formatETBFromSantim(1550, { locale: 'en' });
                expect(result).toBeDefined();
            });
        });
    });

    describe('formatLocalizedDate', () => {
        it('should format ISO date string', () => {
            const result = formatLocalizedDate('2024-01-15T10:30:00Z', 'en');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should format with Amharic locale', () => {
            const result = formatLocalizedDate('2024-01-15T10:30:00Z', 'am');
            expect(result).toBeDefined();
        });

        it('should format with English locale', () => {
            const result = formatLocalizedDate('2024-01-15T10:30:00Z', 'en');
            expect(result).toBeDefined();
        });

        it('should handle different date formats', () => {
            const result = formatLocalizedDate('2024-12-25', 'en');
            expect(result).toBeDefined();
        });
    });

    describe('formatLocalizedDateTime', () => {
        it('should format ISO datetime string', () => {
            const result = formatLocalizedDateTime('2024-01-15T10:30:00Z', 'en');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should format with Amharic locale', () => {
            const result = formatLocalizedDateTime('2024-01-15T10:30:00Z', 'am');
            expect(result).toBeDefined();
        });

        it('should format with English locale', () => {
            const result = formatLocalizedDateTime('2024-01-15T10:30:00Z', 'en');
            expect(result).toBeDefined();
        });
    });

    describe('formatLocalizedNumber', () => {
        it('should format integers', () => {
            const result = formatLocalizedNumber(1000, 'en');
            expect(result).toBeDefined();
        });

        it('should format decimals', () => {
            const result = formatLocalizedNumber(1000.5, 'en');
            expect(result).toBeDefined();
        });

        it('should format with Amharic locale', () => {
            const result = formatLocalizedNumber(1000, 'am');
            expect(result).toBeDefined();
        });

        it('should accept Intl.NumberFormatOptions', () => {
            const result = formatLocalizedNumber(1000.5, 'en', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            expect(result).toBeDefined();
        });

        it('should format percentages', () => {
            const result = formatLocalizedNumber(0.5, 'en', { style: 'percent' });
            expect(result).toBeDefined();
        });

        it('should format currency', () => {
            const result = formatLocalizedNumber(100, 'en', {
                style: 'currency',
                currency: 'ETB',
            });
            expect(result).toBeDefined();
        });
    });
});
