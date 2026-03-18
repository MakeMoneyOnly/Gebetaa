import { updateSession } from '@/lib/supabase/middleware';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import type { NextRequest } from 'next/server';

/**
 * Content-Security-Policy configuration for P0 security requirements.
 *
 * CSP Directives:
 * - default-src 'self': Restrict all resources to same origin by default
 * - script-src 'self' 'unsafe-inline' 'unsafe-eval': Allow inline scripts and eval for Next.js SSR
 * - style-src 'self' 'unsafe-inline': Allow inline styles for CSS-in-JS and Next.js
 * - img-src 'self' data: blob: https: Allow images from same origin, data URLs, blobs, and HTTPS sources
 * - connect-src 'self' https://*.supabase.co wss://*.supabase.co: Allow Supabase connections
 * - font-src 'self' data: https://fonts.gstatic.com: Allow Google Fonts
 * - frame-ancestors 'none': Prevent embedding in frames
 * - base-uri 'self': Restrict base tag to same origin
 * - form-action 'self': Restrict form submissions to same origin
 * - worker-src 'self' blob: Allow web workers for offline support (PWA)
 */
const buildCSP = (isProduction: boolean): string => {
    const directives = [
        "default-src 'self'",
        // Next.js requires 'unsafe-eval' for SSR and 'unsafe-inline' for dynamic styles/scripts
        // In production, we could consider removing vercel.live but it's needed for some preview features
        isProduction
            ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
            : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // blob: needed for image optimization, data: for inline images
        "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co https://grainy-gradients.vercel.app https://i.pravatar.cc https://api.dicebear.com",
        // Supabase connections for auth and realtime
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        // Google Fonts
        "font-src 'self' data: https://fonts.gstatic.com",
        // Prevent framing
        "frame-ancestors 'none'",
        // Restrict base tag
        "base-uri 'self'",
        // Restrict form submissions
        "form-action 'self'",
        // Web workers for PWA offline support
        "worker-src 'self' blob:",
        // Object-src for blob workers
        "object-src 'none'",
    ];

    return directives.join('; ');
};

export async function middleware(request: NextRequest) {
    // First, update the Supabase session
    const supabaseResponse = await updateSession(request);

    // Apply rate limiting to mutation endpoints
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
        // Rate limit exceeded - return rate limit response with security headers
        const isProduction = process.env.NODE_ENV === 'production';
        const csp = buildCSP(isProduction);

        rateLimitResponse.headers.set('Content-Security-Policy', csp);
        rateLimitResponse.headers.set('X-Content-Type-Options', 'nosniff');
        rateLimitResponse.headers.set('X-Frame-Options', 'DENY');
        rateLimitResponse.headers.set('X-XSS-Protection', '1; mode=block');
        rateLimitResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        rateLimitResponse.headers.set('X-DNS-Prefetch-Control', 'on');
        rateLimitResponse.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );

        return rateLimitResponse;
    }

    // Determine if we're in production mode
    const isProduction = process.env.NODE_ENV === 'production';

    // Build CSP header
    const csp = buildCSP(isProduction);

    // Add security headers
    supabaseResponse.headers.set('Content-Security-Policy', csp);
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
    supabaseResponse.headers.set('X-Frame-Options', 'DENY');
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    supabaseResponse.headers.set(
        'Permissions-Policy',
        'accelerometer=(), camera=(), microphone=(), geolocation=()'
    );
    supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'on');
    supabaseResponse.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

    return supabaseResponse;
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - static files
         */
        '/((?!_next/static|_next/image|favicon.ico|public/|.*\\..*).*)',
    ],
};
