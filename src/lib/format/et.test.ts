import { describe, expect, it } from 'vitest';
import { formatETBCurrency, formatLocalizedDate } from '@/lib/format/et';

describe('ET formatting helpers', () => {
    it('formats ETB currency for English locale', () => {
        const output = formatETBCurrency(1234.5, { locale: 'en' });
        expect(output).toContain('1,234.5');
    });

    it('formats ETB currency for Amharic locale', () => {
        const output = formatETBCurrency(1234.5, { locale: 'am' });
        expect(output.length).toBeGreaterThan(0);
    });

    it('formats date using locale', () => {
        const output = formatLocalizedDate('2026-02-20T12:00:00.000Z', 'en');
        expect(output.length).toBeGreaterThan(0);
    });
});
