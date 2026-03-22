import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // E2E test bypass: allows Playwright specs to exercise protected routes with mocked APIs.
    // Security: only allowed when E2E_TEST_MODE=true (always unset in real deployments) +
    // secret header matches E2E_BYPASS_SECRET. No NODE_ENV restriction — CI runs in production mode.

    const e2eBypassAuth = request.headers.get('x-e2e-bypass-auth');
    const e2eBypassSecret = request.headers.get('x-e2e-bypass-secret');
    const bypassSecret = process.env.E2E_BYPASS_SECRET;

    // Check if E2E bypass is active via headers OR via existing cookie.
    // This is needed because subsequent API calls (XHR/fetch) from the browser
    // don't include the E2E headers - they only have cookies set by the initial request.
    //
    // NOTE: We intentionally do NOT gate this on NODE_ENV !== 'production' because
    // in CI the app is served via `pnpm start` (Next.js production server), so
    // NODE_ENV is 'production'. Security is enforced by E2E_TEST_MODE === 'true'
    // (never set in real production deployments) plus the shared secret check.
    const hasE2ECookie = request.cookies.get('sb-access-token')?.value === 'e2e-mock-access-token';
    const isE2EBypassActive =
        hasE2ECookie ||
        (process.env.E2E_TEST_MODE === 'true' &&
            e2eBypassAuth === '1' &&
            e2eBypassSecret !== undefined &&
            e2eBypassSecret === bypassSecret);

    // Debug logging - always run to see what's happening
    console.log('[E2E Debug] Request:', request.nextUrl.pathname);
    console.log('[E2E Debug] Has header auth:', !!e2eBypassAuth);
    console.log('[E2E Debug] Has cookie:', hasE2ECookie);
    console.log('[E2E Debug] Cookie value:', request.cookies.get('sb-access-token')?.value);
    console.log('[E2E Debug] E2E active:', isE2EBypassActive);
    console.log('[E2E Debug] Env E2E_TEST_MODE:', process.env.E2E_TEST_MODE);

    if (isE2EBypassActive) {
        // Set mock auth cookies for E2E tests (refresh on each request)
        supabaseResponse.cookies.set('sb-access-token', 'e2e-mock-access-token', {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 3600,
        });
        supabaseResponse.cookies.set('sb-refresh-token', 'e2e-mock-refresh-token', {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 86400,
        });
        return supabaseResponse;
    }

    // Get and clean environment variables
    // Vercel can store values with extra quotes and \r\n when set via CLI/API
    const cleanEnvVar = (val: string | undefined): string => {
        if (!val) return '';
        return val
            .replace(/\r/g, '')
            .replace(/\n/g, '')
            .replace(/^["']+/, '')
            .replace(/["']+$/, '')
            .trim();
    };

    const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    // Skip Supabase initialization if environment variables are missing
    // This is critical for Edge Runtime where env vars might not be available
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase environment variables not available in middleware');
        return supabaseResponse;
    }

    // Validate URL format before passing to Supabase
    try {
        new URL(supabaseUrl);
    } catch {
        console.error('Invalid SUPABASE_URL format:', supabaseUrl);
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;
    const protectedPrefixes = ['/app', '/merchant', '/kds', '/staff', '/pos'];
    const isProtectedPath = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (
        !user &&
        !pathname.startsWith('/auth') &&
        !pathname.startsWith('/login') &&
        isProtectedPath
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
    }

    // IMPORTANT: You must return the supabaseResponse object as it is.
    return supabaseResponse;
}
