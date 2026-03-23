import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // =========================================================
    // CRIT-003: Secure E2E Test Bypass
    // =========================================================
    // E2E test bypass: allows Playwright specs to exercise protected routes with mocked APIs.
    //
    // Security requirements for E2E bypass (ALL must be true):
    // 1. NODE_ENV must NOT be 'production' (prevents bypass in real deployments)
    // 2. E2E_TEST_MODE must be 'true' (explicit opt-in)
    // 3. E2E_BYPASS_SECRET must be configured and match the request
    //
    // The bypass can be activated via:
    // - Headers: x-e2e-bypass-auth=1 and x-e2e-bypass-secret={secret}
    // - Cookie: sb-access-token=e2e-mock-access-token:{secret}
    // =========================================================

    const e2eBypassAuth = request.headers.get('x-e2e-bypass-auth');
    const e2eBypassSecret = request.headers.get('x-e2e-bypass-secret');
    const envBypassSecret = process.env.E2E_BYPASS_SECRET;

    // CRITICAL: Never allow E2E bypass in production environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';
    const hasSecretConfigured = envBypassSecret !== undefined && envBypassSecret !== '';

    // Check for secure E2E cookie token
    const cookieToken = request.cookies.get('sb-access-token')?.value;
    const expectedCookieToken = hasSecretConfigured
        ? `e2e-mock-access-token:${envBypassSecret}`
        : null;
    const hasValidE2ECookie = cookieToken !== undefined && cookieToken === expectedCookieToken;

    // Check for valid header-based bypass
    const hasValidHeaderBypass =
        e2eBypassAuth === '1' &&
        e2eBypassSecret !== undefined &&
        e2eBypassSecret !== '' &&
        e2eBypassSecret === envBypassSecret;

    // E2E bypass is only active when ALL security conditions are met
    const isE2EBypassActive =
        !isProduction &&
        isE2ETestMode &&
        hasSecretConfigured &&
        (hasValidE2ECookie || hasValidHeaderBypass);

    // Debug logging - only in non-production
    if (!isProduction) {
        console.log('[E2E Debug] Request:', request.nextUrl.pathname);
        console.log('[E2E Debug] Is Production:', isProduction);
        console.log('[E2E Debug] E2E Test Mode:', isE2ETestMode);
        console.log('[E2E Debug] Has Secret Configured:', hasSecretConfigured);
        console.log('[E2E Debug] Has Valid Cookie:', hasValidE2ECookie);
        console.log('[E2E Debug] Has Valid Headers:', hasValidHeaderBypass);
        console.log('[E2E Debug] E2E Active:', isE2EBypassActive);
    }

    if (isE2EBypassActive) {
        // Set secure mock auth cookies for E2E tests (refresh on each request)
        // Token includes the secret for validation on subsequent requests
        supabaseResponse.cookies.set(
            'sb-access-token',
            `e2e-mock-access-token:${envBypassSecret}`,
            {
                httpOnly: true,
                path: '/',
                sameSite: 'lax',
                maxAge: 3600,
            }
        );
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

    // Check for placeholder values (used in E2E/testing scenarios)
    const isPlaceholderUrl = supabaseUrl?.includes('placeholder') || !supabaseUrl;
    const isPlaceholderKey = supabaseKey === 'placeholder-key' || !supabaseKey;
    const hasRealCredentials = !isPlaceholderUrl && !isPlaceholderKey;

    // If no real credentials, we can't initialize Supabase - but still need to
    // pass cookies through for subsequent requests that might have valid session
    if (!hasRealCredentials) {
        console.warn('Supabase credentials not available - passing through request without auth');
        // Pass cookies through without Supabase auth check
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
