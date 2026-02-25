import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Simplified Proxy for debugging
 * This is a minimal proxy to isolate the MIDDLEWARE_INVOCATION_FAILED error
 */

export default async function proxy(request: NextRequest) {
    // Simple pass-through for now
    const response = NextResponse.next();

    // Add basic security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

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
