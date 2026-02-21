/**
 * Resource Hints Component
 *
 * Addresses PLATFORM_AUDIT finding PERF-5: Missing resource hints
 *
 * This component adds:
 * - DNS prefetch for external domains
 * - Preconnect for critical origins
 * - Prefetch for likely navigation targets
 * - Preload for critical assets
 */

'use client';

import { useEffect, useMemo } from 'react';

/**
 * Configuration for resource hints
 */
interface ResourceHintConfig {
    /** URL to hint */
    url: string;
    /** Type of hint */
    type: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'preload' | 'prerender';
    /** Whether to include credentials (for preconnect) */
    crossOrigin?: boolean;
    /** Resource type for preload */
    as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
    /** Priority hint */
    importance?: 'high' | 'low' | 'auto';
}

/**
 * Default critical domains for the application
 */
const CRITICAL_DOMAINS: ResourceHintConfig[] = [
    // Supabase API
    { url: 'https://axuegixbqsvztdraenkz.supabase.co', type: 'preconnect', crossOrigin: true },
    { url: 'https://axuegixbqsvztdraenkz.supabase.co', type: 'dns-prefetch' },

    // Google Fonts
    { url: 'https://fonts.googleapis.com', type: 'preconnect', crossOrigin: true },
    { url: 'https://fonts.gstatic.com', type: 'preconnect', crossOrigin: true },

    // External images
    { url: 'https://images.unsplash.com', type: 'preconnect', crossOrigin: true },

    // Sentry (if configured)
    { url: 'https://o4506998756614144.ingest.us.sentry.io', type: 'dns-prefetch' },
];

/**
 * Routes that are likely to be navigated to next
 * These will be prefetched for faster navigation
 */
const LIKELY_ROUTES = [
    '/merchant/orders',
    '/merchant/menu',
    '/merchant/analytics',
    '/kds/display',
    '/pos/mobile',
];

/**
 * Critical fonts to preload
 */
const CRITICAL_FONTS: ResourceHintConfig[] = [
    // Add your critical fonts here, e.g.:
    // { url: '/fonts/inter-var.woff2', type: 'preload', as: 'font', crossOrigin: true },
];

/**
 * Hook to inject resource hints dynamically
 */
export function useResourceHints(
    additionalHints?: ResourceHintConfig[],
    options?: {
        enablePrefetch?: boolean;
        enablePreload?: boolean;
    }
) {
    const { enablePrefetch = true, enablePreload = true } = options ?? {};

    const hints = useMemo(() => {
        const allHints: ResourceHintConfig[] = [...CRITICAL_DOMAINS];

        if (enablePreload) {
            allHints.push(...CRITICAL_FONTS);
        }

        if (additionalHints) {
            allHints.push(...additionalHints);
        }

        return allHints;
    }, [additionalHints, enablePreload]);

    useEffect(() => {
        // Inject link elements for each hint
        hints.forEach(hint => {
            const existingLink = document.querySelector(
                `link[href="${hint.url}"][rel="${hint.type}"]`
            );

            if (existingLink) return;

            const link = document.createElement('link');
            link.rel = hint.type;
            link.href = hint.url;

            if (hint.crossOrigin) {
                link.crossOrigin = 'anonymous';
            }

            if (hint.as) {
                link.as = hint.as;
            }

            if (hint.importance) {
                link.setAttribute('importance', hint.importance);
            }

            document.head.appendChild(link);
        });

        // Prefetch likely routes on idle
        if (enablePrefetch && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                LIKELY_ROUTES.forEach(route => {
                    const existingLink = document.querySelector(
                        `link[href="${route}"][rel="prefetch"]`
                    );

                    if (existingLink) return;

                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = route;
                    document.head.appendChild(link);
                });
            });
        }
    }, [hints, enablePrefetch]);
}

/**
 * Component that injects resource hints
 * Add this to your root layout
 */
export function ResourceHints() {
    useResourceHints();
    return null;
}

/**
 * Prefetch a specific route
 * Call this when hovering over a link for instant navigation
 */
export function prefetchRoute(route: string) {
    if (typeof document === 'undefined') return;

    const existingLink = document.querySelector(`link[href="${route}"][rel="prefetch"]`);

    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
}

/**
 * Preload an image for faster display
 */
export function preloadImage(src: string, priority: 'high' | 'low' | 'auto' = 'auto') {
    if (typeof document === 'undefined') return;

    const existingLink = document.querySelector(`link[href="${src}"][rel="preload"][as="image"]`);

    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;

    if (priority !== 'auto') {
        link.setAttribute('importance', priority);
    }

    document.head.appendChild(link);
}

/**
 * Prefetch data from an API endpoint
 */
export function prefetchData(url: string) {
    if (typeof document === 'undefined') return;

    const existingLink = document.querySelector(`link[href="${url}"][rel="prefetch"][as="fetch"]`);

    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
}

/**
 * Hook to prefetch on hover
 * Use this for links that are likely to be clicked
 */
export function usePrefetchOnHover(route: string) {
    return {
        onMouseEnter: () => prefetchRoute(route),
        onTouchStart: () => prefetchRoute(route),
    };
}

export type { ResourceHintConfig };
