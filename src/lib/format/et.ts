import { AppLocale, resolveIntlLocale } from '@/lib/i18n/locale';

export function formatETBCurrency(
    amount: number,
    options?: {
        locale?: AppLocale;
        maximumFractionDigits?: number;
        minimumFractionDigits?: number;
    }
): string {
    const locale = options?.locale ?? 'en';
    return new Intl.NumberFormat(resolveIntlLocale(locale), {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    }).format(amount);
}

export function formatLocalizedDate(iso: string, locale: AppLocale): string {
    return new Date(iso).toLocaleDateString(resolveIntlLocale(locale));
}
