/**
 * Derive the canonical base URL from an incoming HTTP request.
 *
 * This ensures URLs generated on the server always point to the correct domain:
 * - http://localhost:3000 in local development
 * - https://<deployment>.vercel.app in Vercel preview/production
 *
 * We read the `x-forwarded-host` and `host` headers which are set by Vercel
 * and other reverse-proxies, rather than relying on environment variables
 * (e.g. NEXT_PUBLIC_APP_URL) that may contain stale values like old ngrok tunnels.
 */
export function getRequestOrigin(request: Request): string {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';

    const resolvedHost = forwardedHost || host;
    if (resolvedHost) {
        return `${proto}://${resolvedHost}`;
    }

    // Fallback: construct from the request URL itself
    try {
        const url = new URL(request.url);
        return url.origin;
    } catch {
        return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    }
}
