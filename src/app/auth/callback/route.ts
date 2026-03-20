import { NextResponse } from 'next/server';
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server';

/**
 * Validates redirect path to prevent open redirect attacks (CRIT-002)
 * Only allows relative paths starting with / and validates against allowlist
 */
function validateRedirectPath(path: string): string {
    if (path.startsWith('/') && !path.startsWith('//')) {
        const allowedPrefixes = ['/auth/', '/merchant/', '/kds/', '/app/'];
        if (allowedPrefixes.some(prefix => path.startsWith(prefix))) {
            return path;
        }
    }
    return '/auth/post-login';
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    // Validate the redirect path to prevent open redirect attacks (CRIT-002)
    const rawNext = searchParams.get('next') ?? '/auth/post-login';
    const next = validateRedirectPath(rawNext);

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Validate x-forwarded-host to prevent host header injection (HIGH-002)
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development';

            // Allowed hosts list - only trust these values from x-forwarded-host
            const allowedHosts: string[] = [
                'gebetamenu.com',
                process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
            ].filter((host): host is string => Boolean(host));

            // Determine the safe host to use
            let safeHost: string | null = null;
            if (isLocalEnv) {
                // Development: use origin directly
                safeHost = null;
            } else if (forwardedHost && allowedHosts.includes(forwardedHost)) {
                // Only use forwardedHost if it's in the allowlist
                safeHost = forwardedHost;
            } else {
                // Not in allowlist - fall back to origin (will use the request's host)
                safeHost = null;
            }

            if (isLocalEnv || !safeHost) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else {
                return NextResponse.redirect(`https://${safeHost}${next}`);
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
