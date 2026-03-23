import { AppLocale, resolveIntlLocale } from '@/lib/i18n/locale';

export function formatETBCurrency(
    amount: number,
    options?: {
        locale?: AppLocale;
        maximumFractionDigits?: number;
        minimumFractionDigits?: number;
        compact?: boolean;
    }
): string {
    const locale = options?.locale ?? 'en';
    const formattingOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'ETB',
        // Default to 0 fraction digits based on Ethiopian conventions
        maximumFractionDigits: options?.maximumFractionDigits ?? 0,
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    };

    if (options?.compact) {
        // Compact notation for currency can be tricky in some locales.
        // We use 'en' as a reliable base for the 'K', 'M' symbols.
        const numFormatter = new Intl.NumberFormat('en', {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
        });
        const formattedNumber = numFormatter.format(amount);
        return `ETB ${formattedNumber}`;
    }

    return new Intl.NumberFormat(resolveIntlLocale(locale), formattingOptions).format(amount);
}

export function formatLocalizedDate(iso: string, locale: AppLocale): string {
    return new Date(iso).toLocaleDateString(resolveIntlLocale(locale));
}
