import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
    // Get and clean environment variables (remove any surrounding quotes)
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    // Strip surrounding quotes if present (common issue when setting env vars)
    url = url.replace(/^["']|["']$/g, '').trim();
    key = key.replace(/^["']|["']$/g, '').trim();

    // Check for placeholder values - these indicate E2E test environment without real backend
    // When real credentials are present (like in .env), use the real Supabase client
    const isPlaceholderUrl = url.includes('placeholder');
    const isPlaceholderKey = key === 'placeholder-key';

    // Only use mock client when Supabase URL is a placeholder (no real backend)
    // When real credentials are available, use the real client even in E2E mode
    // The middleware handles E2E auth bypass, allowing login without real credentials
    // while database queries go to the real backend
    if (isPlaceholderUrl || isPlaceholderKey) {
        console.log(
            '[Browser] Using mock client - placeholder credentials detected:',
            'isPlaceholderUrl:',
            isPlaceholderUrl,
            'isPlaceholderKey:',
            isPlaceholderKey
        );
        // Return a mock client for E2E tests
        return {
            auth: {
                signInWithPassword: async () => ({
                    data: {
                        user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                        session: {
                            access_token: 'e2e-mock-access-token',
                            refresh_token: 'e2e-mock-refresh-token',
                            expires_in: 3600,
                            expires_at: Math.floor(Date.now() / 1000) + 3600,
                            user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                        },
                    },
                    error: null,
                }),
                signUp: async () => ({
                    data: {
                        user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                        session: {
                            access_token: 'e2e-mock-access-token',
                            refresh_token: 'e2e-mock-refresh-token',
                            expires_in: 3600,
                            expires_at: Math.floor(Date.now() / 1000) + 3600,
                            user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                        },
                    },
                    error: null,
                }),
                signOut: async () => ({ error: null }),
                getUser: async () => ({
                    data: { user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' } },
                    error: null,
                }),
                getSession: async () => ({
                    data: {
                        session: {
                            access_token: 'e2e-mock-access-token',
                            refresh_token: 'e2e-mock-refresh-token',
                            expires_in: 3600,
                            expires_at: Math.floor(Date.now() / 1000) + 3600,
                            user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                        },
                    },
                    error: null,
                }),
                onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
                    // Immediately call with signed in state
                    callback('SIGNED_IN', {
                        access_token: 'e2e-mock-access-token',
                        refresh_token: 'e2e-mock-refresh-token',
                        user: { id: 'e2e-mock-user-id', email: 'e2e@test.com' },
                    });
                    return { data: { subscription: { unsubscribe: () => {} } } };
                },
            },
            from: (table: string) => ({
                select: () => ({
                    data: [],
                    error: null,
                    eq: function () {
                        return this;
                    },
                    neq: function () {
                        return this;
                    },
                    gt: function () {
                        return this;
                    },
                    gte: function () {
                        return this;
                    },
                    lt: function () {
                        return this;
                    },
                    lte: function () {
                        return this;
                    },
                    like: function () {
                        return this;
                    },
                    ilike: function () {
                        return this;
                    },
                    is: function () {
                        return this;
                    },
                    in: function () {
                        return this;
                    },
                    contains: function () {
                        return this;
                    },
                    containedBy: function () {
                        return this;
                    },
                    order: function () {
                        return this;
                    },
                    limit: function () {
                        return this;
                    },
                    range: function () {
                        return this;
                    },
                    single: async () => ({ data: null, error: null }),
                    maybeSingle: async () => ({ data: null, error: null }),
                }),
                insert: () => ({
                    data: null,
                    error: null,
                    select: () => ({
                        data: [],
                        error: null,
                        single: async () => ({ data: null, error: null }),
                        maybeSingle: async () => ({ data: null, error: null }),
                    }),
                }),
                update: () => ({
                    data: null,
                    error: null,
                    eq: function () {
                        return this;
                    },
                    select: () => ({
                        data: [],
                        error: null,
                        single: async () => ({ data: null, error: null }),
                        maybeSingle: async () => ({ data: null, error: null }),
                    }),
                }),
                delete: () => ({
                    data: null,
                    error: null,
                    eq: function () {
                        return this;
                    },
                }),
                eq: function () {
                    return this;
                },
            }),
            channel: () => ({
                on: function () {
                    return this;
                },
                subscribe: () => {},
            }),
            removeChannel: async () => {},
        } as ReturnType<typeof createBrowserClient>;
    }

    if (!url || !key) {
        console.warn('Supabase environment variables are not set. Authentication will not work.');
        // Return a mock client that won't crash but won't work either
        return {
            auth: {
                signInWithPassword: async () => ({
                    data: { user: null, session: null },
                    error: new Error('Supabase not configured'),
                }),
                signUp: async () => ({
                    data: { user: null, session: null },
                    error: new Error('Supabase not configured'),
                }),
                signOut: async () => ({ error: null }),
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            },
            from: () => ({
                select: () => ({ data: null, error: new Error('Supabase not configured') }),
                insert: () => ({ data: null, error: new Error('Supabase not configured') }),
                update: () => ({ data: null, error: new Error('Supabase not configured') }),
                delete: () => ({ data: null, error: new Error('Supabase not configured') }),
                eq: function () {
                    return this;
                },
                single: async () => ({ data: null, error: new Error('Supabase not configured') }),
                maybeSingle: async () => ({ data: null, error: null }),
                limit: function () {
                    return this;
                },
                order: function () {
                    return this;
                },
            }),
            channel: () => ({
                on: function () {
                    return this;
                },
                subscribe: () => {},
            }),
            removeChannel: async () => {},
        } as ReturnType<typeof createBrowserClient>;
    }

    return createBrowserClient(url, key);
};
