/**
 * Derive the canonical base URL for QR codes.
 *
 * Priority order:
 * 1. On Vercel: always use the PRODUCTION domain (VERCEL_PROJECT_PRODUCTION_URL)
 *    so QR codes are stable and point to the live site — not an ephemeral preview URL.
 * 2. Locally: use request headers (host/x-forwarded-host) → localhost:3000.
 *
 * Why not preview URLs for QR codes?
 * - Preview deployments have Vercel Authentication enabled by default.
 * - Even if disabled, preview URLs are ephemeral and change with each deployment.
 * - Guests scan QR codes in the real world — they must reach the production app.
 */
export function getRequestOrigin(request: Request): string {
    // On any Vercel environment, always generate QR codes pointing to production
    if (process.env.VERCEL === '1') {
        // VERCEL_PROJECT_PRODUCTION_URL is always the stable production domain
        // It's set automatically by Vercel on all environments (preview & production)
        const rawUrl =
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
        if (rawUrl) {
            // Strip any quotes/newlines added by Vercel CLI echo-based setup
            const productionUrl = rawUrl
                .replace(/\r/g, '')
                .replace(/\n/g, '')
                .replace(/^["']+/, '')
                .replace(/["']+$/, '')
                .trim();
            if (productionUrl) return `https://${productionUrl}`;
        }
    }

    // Local dev: read from request headers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';

    const resolvedHost = forwardedHost || host;
    if (resolvedHost) {
        return `${proto}://${resolvedHost}`;
    }

    // Last resort fallback
    try {
        const url = new URL(request.url);
        return url.origin;
    } catch {
        return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    }
}
