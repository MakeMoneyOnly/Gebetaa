import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // First, update the Supabase session
    const supabaseResponse = await updateSession(request);

    // Add basic security headers
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
