import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
    isE2EBypassAllowed,
    isValidE2EBypassSecret,
    logE2ESecurityEvent,
} from '@/lib/security/e2e-validation';

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

    // SECURITY: Check if E2E bypass is allowed in current environment
    // This is the FIRST check - if not allowed, skip all bypass logic
    if (!isE2EBypassAllowed()) {
        // In production, log any bypass attempts for security monitoring
        const e2eBypassAuth = request.headers.get('x-e2e-bypass-auth');
        const e2eBypassSecret = request.headers.get('x-e2e-bypass-secret');
        const cookieToken = request.cookies.get('sb-access-token')?.value;

        if (e2eBypassAuth === '1' || e2eBypassSecret || cookieToken?.startsWith('e2e-mock-')) {
            logE2ESecurityEvent('bypass_attempt', {
                source: 'middleware',
                hasHeaderAuth: !!e2eBypassAuth,
                hasHeaderSecret: !!e2eBypassSecret,
                hasCookieToken: !!cookieToken,
                path: request.nextUrl.pathname,
            });
        }
        // Continue to normal auth flow - E2E bypass is NOT available
    } else {
        // E2E bypass is allowed in this environment (non-production with E2E_TEST_MODE=true)
        const e2eBypassAuth = request.headers.get('x-e2e-bypass-auth');
        const e2eBypassSecret = request.headers.get('x-e2e-bypass-secret');
        const configuredSecret = process.env.E2E_BYPASS_SECRET;

        // SECURITY: Require configured secret - NO default fallback
        if (!configuredSecret || configuredSecret === '') {
            logE2ESecurityEvent('config_warning', {
                source: 'middleware',
                reason: 'E2E_BYPASS_SECRET not configured',
            });
            // Continue to normal auth flow
        } else {
            // Check for secure E2E cookie token
            const cookieToken = request.cookies.get('sb-access-token')?.value;
            const expectedCookieToken = `e2e-mock-access-token:${configuredSecret}`;
            const hasValidE2ECookie =
                cookieToken !== undefined && cookieToken === expectedCookieToken;

            // Check for valid header-based bypass with timing-safe comparison
            const hasValidHeaderBypass =
                e2eBypassAuth === '1' && isValidE2EBypassSecret(e2eBypassSecret ?? undefined);

            // E2E bypass is active when request has valid cookie OR header bypass credentials
            const isE2EBypassActive = hasValidE2ECookie || hasValidHeaderBypass;

            if (isE2EBypassActive) {
                logE2ESecurityEvent('bypass_success', {
                    source: 'middleware',
                    method: hasValidHeaderBypass ? 'header' : 'cookie',
                    path: request.nextUrl.pathname,
                });

                // Set secure mock auth cookies for E2E tests (refresh on each request)
                // Token includes the secret for validation on subsequent requests
                supabaseResponse.cookies.set(
                    'sb-access-token',
                    `e2e-mock-access-token:${configuredSecret}`,
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
        }
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
