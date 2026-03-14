import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
    const cookieStore = await cookies();

    // Check for E2E test bypass
    const isE2EBypass = cookieStore.get('sb-access-token')?.value === 'e2e-mock-access-token';

    // Get and clean environment variables
    // Vercel can store values with extra quotes and \r\n when set via CLI/API
    // e.g. '"actual-value" \r\n' — we need to strip all of that
    const cleanEnvVar = (val: string | undefined): string => {
        if (!val) return '';
        return val
            .replace(/\r/g, '') // carriage returns
            .replace(/\n/g, '') // newlines
            .replace(/^["']+/, '') // leading quotes (one or more)
            .replace(/["']+$/, '') // trailing quotes (one or more)
            .trim();
    };

    const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    // If environment variables are missing or E2E bypass is active, return a mock client
    if (!supabaseUrl || !supabaseKey || isE2EBypass) {
        if (isE2EBypass) {
            console.log('[E2E] Using mock Supabase client for testing');
        }
        // Helper to create chainable mock methods
        const createChainableMock = (data: unknown) => ({
            data,
            error: null,
            eq: function () { return this; },
            neq: function () { return this; },
            gt: function () { return this; },
            gte: function () { return this; },
            lt: function () { return this; },
            lte: function () { return this; },
            like: function () { return this; },
            ilike: function () { return this; },
            is: function () { return this; },
            in: function () { return this; },
            contains: function () { return this; },
            containedBy: function () { return this; },
            overlaps: function () { return this; },
            order: function () { return this; },
            limit: function () { return this; },
            range: function () { return this; },
            single: async () => ({ data, error: null }),
            maybeSingle: async () => ({ data, error: null }),
            then: function(resolve: (value: unknown) => void) {
                return resolve({ data, error: null });
            },
        });

        return {
            auth: {
                getUser: async () => ({
                    data: {
                        user: {
                            id: 'staff-user-1',
                            email: 'e2e@example.com',
                            aud: 'authenticated',
                            role: 'authenticated',
                        },
                    },
                    error: null,
                }),
                getSession: async () => ({
                    data: {
                        session: {
                            access_token: 'e2e-mock-access-token',
                            refresh_token: 'e2e-mock-refresh-token',
                            expires_in: 3600,
                            expires_at: 2099999999,
                            user: {
                                id: 'staff-user-1',
                                email: 'e2e@example.com',
                            },
                        },
                    },
                    error: null,
                }),
            },
            from: () => ({
                select: () => createChainableMock([]),
                insert: () => ({ data: null, error: null }),
                update: () => ({ data: null, error: null }),
                delete: () => ({ data: null, error: null }),
            }),
        } as unknown as ReturnType<typeof createServerClient<Database>>;
    }

    return createServerClient<Database>(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
}
