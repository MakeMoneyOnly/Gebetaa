import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security and Rate Limiting Middleware
 * 
 * Addresses PLATFORM_AUDIT_REPORT findings:
 * - SEC-002: Rate limiting
 * - SEC-004: CSRF protection
 * - SEC-008: Request size limits
 */

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

// Request size limits by route
const REQUEST_SIZE_LIMITS: Record<string, number> = {
    '/api/order': 1024 * 1024, // 1MB for order submissions
    '/api/menu/update-price': 512 * 1024, // 512KB
    '/api/menu/update-availability': 512 * 1024, // 512KB
    default: 100 * 1024, // 100KB default
};

/**
 * Check rate limit for a given IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

/**
 * Clean up expired rate limit entries periodically
 */


// Cleanup should be handled by a periodic job or a more robust store like Redis
// setInterval is not supported in Edge Runtime
// setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Check request body size
 */
function checkRequestSize(request: NextRequest): { valid: boolean; maxSize: number } {
    const contentLength = request.headers.get('content-length');
    const path = request.nextUrl.pathname;

    const maxSize = REQUEST_SIZE_LIMITS[path] || REQUEST_SIZE_LIMITS.default;

    if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > maxSize) {
            return { valid: false, maxSize };
        }
    }

    return { valid: true, maxSize };
}

/**
 * Check for CSRF token on state-changing requests
 * Note: For API routes, we rely on proper CORS and origin checking
 */
function checkCSRF(request: NextRequest): { valid: boolean; reason?: string } {
    // Only check state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        return { valid: true };
    }

    // Skip CSRF check for API routes (they use other authentication)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Check Origin header matches expected origin
        const origin = request.headers.get('origin');


        // In production, validate against allowed origins
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = [
                process.env.NEXT_PUBLIC_APP_URL,
                'https://gebetamenu.com',
                'https://www.gebetamenu.com',
            ].filter(Boolean);

            if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
                return { valid: false, reason: 'Invalid origin' };
            }
        }

        return { valid: true };
    }

    return { valid: true };
}

// Import Supabase session update
import { updateSession } from '@/lib/supabase/middleware';

export default async function proxy(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ??
        request.headers.get('x-real-ip') ??
        'unknown';

    // 1. Run Supabase Auth Middleware to refresh session & protect routes
    const response = await updateSession(request);

    // If Supabase redirects (e.g. unauthenticated access to /app), return immediately
    if (response.status >= 300 && response.status < 400) {
        return response;
    }

    // 2. Add Security Headers (to the response returned by Supabase)
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Check request size
    const sizeCheck = checkRequestSize(request);
    if (!sizeCheck.valid) {
        return NextResponse.json(
            {
                error: 'Request entity too large',
                maxSize: `${sizeCheck.maxSize / 1024}KB`
            },
            { status: 413 }
        );
    }

    // Check rate limit for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const rateLimit = checkRateLimit(ip);

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        // Check CSRF for state-changing requests
        const csrfCheck = checkCSRF(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: 'CSRF validation failed', reason: csrfCheck.reason },
                { status: 403 }
            );
        }
    }

    return response;
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
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
