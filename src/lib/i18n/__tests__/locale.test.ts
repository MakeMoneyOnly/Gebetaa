import { describe, expect, it } from 'vitest';
import {
    detectLocaleFromHeader,
    detectLocaleFromIP,
    resolveLocale,
    normalizeLocale,
    resolveIntlLocale,
} from '@/lib/i18n/locale';

describe('locale helpers', () => {
    describe('detectLocaleFromHeader', () => {
        it('should return default locale for null header', () => {
            expect(detectLocaleFromHeader(null)).toBe('am');
        });

        it('should return default locale for undefined header', () => {
            expect(detectLocaleFromHeader(undefined)).toBe('am');
        });

        it('should detect Amharic from am language tag', () => {
            expect(detectLocaleFromHeader('am')).toBe('am');
        });

        it('should detect Amharic from am-ET language tag', () => {
            expect(detectLocaleFromHeader('am-ET')).toBe('am');
        });

        it('should detect Amharic from complex header with am first', () => {
            expect(detectLocaleFromHeader('am-ET,en;q=0.9')).toBe('am');
        });

        it('should detect Amharic from header with am after other languages', () => {
            expect(detectLocaleFromHeader('en;q=0.9,am;q=0.8')).toBe('am');
        });

        it('should detect Amharic from -et locale variant', () => {
            expect(detectLocaleFromHeader('en-ET')).toBe('am');
        });

        it('should return en when English is preferred and no Amharic', () => {
            expect(detectLocaleFromHeader('en-US,en;q=0.9')).toBe('en');
        });

        it('should return default locale when no am or -et or en', () => {
            expect(detectLocaleFromHeader('fr-FR')).toBe('am');
        });

        it('should prefer Amharic over English', () => {
            expect(detectLocaleFromHeader('en,am')).toBe('am');
        });
    });

    describe('detectLocaleFromIP', () => {
        it('should return null for null IP', () => {
            expect(detectLocaleFromIP(null)).toBeNull();
        });

        it('should return null for undefined IP', () => {
            expect(detectLocaleFromIP(undefined)).toBeNull();
        });

        it('should detect Ethiopian IP starting with 41.', () => {
            expect(detectLocaleFromIP('41.215.16.1')).toBe('am');
        });

        it('should detect Ethiopian IP starting with 196.', () => {
            expect(detectLocaleFromIP('196.188.1.1')).toBe('am');
        });

        it('should detect Ethiopian IP starting with 197.', () => {
            expect(detectLocaleFromIP('197.156.64.1')).toBe('am');
        });

        it('should detect Ethiopian IP starting with 2.', () => {
            expect(detectLocaleFromIP('2.56.40.1')).toBe('am');
        });

        it('should return null for non-Ethiopian IP', () => {
            expect(detectLocaleFromIP('8.8.8.8')).toBeNull();
        });

        it('should return null for European IP', () => {
            expect(detectLocaleFromIP('192.168.1.1')).toBeNull();
        });
    });

    describe('resolveLocale', () => {
        it('should use user preference when provided', () => {
            expect(resolveLocale({ userPreference: 'en' })).toBe('en');
        });

        it('should use user preference am when provided', () => {
            expect(resolveLocale({ userPreference: 'am' })).toBe('am');
        });

        it('should fall back to header when no user preference', () => {
            expect(resolveLocale({ acceptLanguage: 'en-US' })).toBe('en');
        });

        it('should fall back to IP when no user preference and no header match for am', () => {
            // acceptLanguage 'fr' won't match am or en, so falls to IP
            expect(resolveLocale({ acceptLanguage: 'fr', clientIP: '41.215.16.1' })).toBe('am');
        });

        it('should fall back to default when no options provided', () => {
            expect(resolveLocale()).toBe('am');
        });

        it('should fall back to default when all options are null', () => {
            expect(
                resolveLocale({ userPreference: null, acceptLanguage: null, clientIP: null })
            ).toBe('am');
        });

        it('should prefer user preference over header', () => {
            expect(resolveLocale({ userPreference: 'am', acceptLanguage: 'en' })).toBe('am');
        });

        it('should use IP-based detection when header returns default', () => {
            // 'fr' header → default 'am', but IP is non-Ethiopian → null → default 'am'
            expect(resolveLocale({ acceptLanguage: 'fr', clientIP: '8.8.8.8' })).toBe('am');
        });

        it('should use IP-based detection for Ethiopian IP with no header', () => {
            expect(resolveLocale({ clientIP: '41.215.16.1' })).toBe('am');
        });

        it('should return default when IP is non-Ethiopian and no header', () => {
            expect(resolveLocale({ clientIP: '8.8.8.8' })).toBe('am');
        });
    });

    describe('normalizeLocale', () => {
        it('should return default for null', () => {
            expect(normalizeLocale(null)).toBe('am');
        });

        it('should return default for undefined', () => {
            expect(normalizeLocale(undefined)).toBe('am');
        });

        it('should return default for empty string', () => {
            expect(normalizeLocale('')).toBe('am');
        });

        it('should normalize am-ET to am', () => {
            expect(normalizeLocale('am-ET')).toBe('am');
        });

        it('should normalize AM (uppercase) to am', () => {
            expect(normalizeLocale('AM')).toBe('am');
        });

        it('should normalize en to en', () => {
            expect(normalizeLocale('en')).toBe('en');
        });

        it('should normalize en-US to en', () => {
            expect(normalizeLocale('en-US')).toBe('en');
        });

        it('should normalize fr to en (non-am default)', () => {
            expect(normalizeLocale('fr')).toBe('en');
        });

        it('should normalize am with whitespace', () => {
            expect(normalizeLocale('  am  ')).toBe('am');
        });
    });

    describe('resolveIntlLocale', () => {
        it('should return am-ET for am', () => {
            expect(resolveIntlLocale('am')).toBe('am-ET');
        });

        it('should return en-ET for en', () => {
            expect(resolveIntlLocale('en')).toBe('en-ET');
        });
    });
});
