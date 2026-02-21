export type AppLocale = 'en' | 'am';

export const DEFAULT_APP_LOCALE: AppLocale = 'en';

export function normalizeLocale(input: string | null | undefined): AppLocale {
    if (!input) return DEFAULT_APP_LOCALE;
    const value = input.toLowerCase().trim();
    if (value.startsWith('am')) return 'am';
    return 'en';
}

export function resolveIntlLocale(locale: AppLocale): string {
    return locale === 'am' ? 'am-ET' : 'en-ET';
}
