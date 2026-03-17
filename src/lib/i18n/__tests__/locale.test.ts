import { describe, it, expect } from 'vitest';
import { normalizeLocale, resolveIntlLocale, DEFAULT_APP_LOCALE, type AppLocale } from '../locale';

describe('locale', () => {
    describe('normalizeLocale', () => {
        it('should return default locale for null input', () => {
            expect(normalizeLocale(null)).toBe(DEFAULT_APP_LOCALE);
        });

        it('should return default locale for undefined input', () => {
            expect(normalizeLocale(undefined)).toBe(DEFAULT_APP_LOCALE);
        });

        it('should return default locale for empty string', () => {
            expect(normalizeLocale('')).toBe(DEFAULT_APP_LOCALE);
        });

        it('should return am for am input', () => {
            expect(normalizeLocale('am')).toBe('am');
        });

        it('should return am for am-ET input', () => {
            expect(normalizeLocale('am-ET')).toBe('am');
        });

        it('should return am for AM (uppercase)', () => {
            expect(normalizeLocale('AM')).toBe('am');
        });

        it('should return am for amharic input', () => {
            expect(normalizeLocale('amharic')).toBe('am');
        });

        it('should return en for en input', () => {
            expect(normalizeLocale('en')).toBe('en');
        });

        it('should return en for en-US input', () => {
            expect(normalizeLocale('en-US')).toBe('en');
        });

        it('should return en for english input', () => {
            expect(normalizeLocale('english')).toBe('en');
        });

        it('should trim whitespace before processing', () => {
            expect(normalizeLocale('  am  ')).toBe('am');
        });
    });

    describe('resolveIntlLocale', () => {
        it('should return am-ET for am locale', () => {
            expect(resolveIntlLocale('am')).toBe('am-ET');
        });

        it('should return en-ET for en locale', () => {
            expect(resolveIntlLocale('en')).toBe('en-ET');
        });
    });

    describe('AppLocale type', () => {
        it('should accept valid locale values', () => {
            const enLocale: AppLocale = 'en';
            const amLocale: AppLocale = 'am';
            expect(enLocale).toBe('en');
            expect(amLocale).toBe('am');
        });
    });

    describe('DEFAULT_APP_LOCALE', () => {
        it('should be en', () => {
            expect(DEFAULT_APP_LOCALE).toBe('en');
        });
    });
});
