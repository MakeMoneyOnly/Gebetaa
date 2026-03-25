import { describe, it, expect } from 'vitest';
import {
    normalizeLocale,
    resolveIntlLocale,
    DEFAULT_APP_LOCALE,
    detectLocaleFromHeader,
    detectLocaleFromIP,
    resolveLocale,
    type AppLocale,
} from '../locale';

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
        it('should be am for Ethiopian market', () => {
            // LOW-001: Default locale is now 'am' for Ethiopian market
            expect(DEFAULT_APP_LOCALE).toBe('am');
        });
    });

    describe('detectLocaleFromHeader', () => {
        it('should return am for Amharic Accept-Language header', () => {
            expect(detectLocaleFromHeader('am-ET')).toBe('am');
            expect(detectLocaleFromHeader('am')).toBe('am');
            expect(detectLocaleFromHeader('am-ET,en-US;q=0.9')).toBe('am');
        });

        it('should return am for Ethiopian locale variant', () => {
            expect(detectLocaleFromHeader('en-ET')).toBe('am');
        });

        it('should return en for English preference', () => {
            expect(detectLocaleFromHeader('en-US')).toBe('en');
            expect(detectLocaleFromHeader('en')).toBe('en');
            expect(detectLocaleFromHeader('en-US,am;q=0.8')).toBe('en');
        });

        it('should return default for null/undefined', () => {
            expect(detectLocaleFromHeader(null)).toBe('am');
            expect(detectLocaleFromHeader(undefined)).toBe('am');
            expect(detectLocaleFromHeader('')).toBe('am');
        });
    });

    describe('detectLocaleFromIP', () => {
        it('should return am for Ethiopian IP addresses', () => {
            expect(detectLocaleFromIP('41.123.45.67')).toBe('am');
            expect(detectLocaleFromIP('196.10.20.30')).toBe('am');
            expect(detectLocaleFromIP('197.100.50.25')).toBe('am');
        });

        it('should return null for non-Ethiopian IP addresses', () => {
            expect(detectLocaleFromIP('8.8.8.8')).toBeNull();
            expect(detectLocaleFromIP('192.168.1.1')).toBeNull();
        });

        it('should return null for null/undefined', () => {
            expect(detectLocaleFromIP(null)).toBeNull();
            expect(detectLocaleFromIP(undefined)).toBeNull();
        });
    });

    describe('resolveLocale', () => {
        it('should prioritize user preference', () => {
            expect(
                resolveLocale({
                    userPreference: 'en',
                    acceptLanguage: 'am-ET',
                    clientIP: '41.123.45.67',
                })
            ).toBe('en');
        });

        it('should use Accept-Language header when no user preference', () => {
            expect(
                resolveLocale({
                    acceptLanguage: 'am-ET',
                })
            ).toBe('am');
        });

        it('should use IP detection when no header match', () => {
            expect(
                resolveLocale({
                    clientIP: '41.123.45.67',
                })
            ).toBe('am');
        });

        it('should return default when no detection available', () => {
            expect(resolveLocale()).toBe('am');
        });
    });
});
