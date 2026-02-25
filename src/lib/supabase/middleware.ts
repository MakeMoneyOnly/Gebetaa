import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Get and clean environment variables (remove any surrounding quotes)
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    
    // Strip surrounding quotes if present (common issue when setting env vars)
    supabaseUrl = supabaseUrl.replace(/^["']|["']$/g, '').trim();
    supabaseKey = supabaseKey.replace(/^["']|["']$/g, '').trim();

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

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
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
        }
    );

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
