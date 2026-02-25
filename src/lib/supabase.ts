import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!url || !key) {
        console.warn('Supabase environment variables are not set. Authentication will not work.');
        // Return a mock client that won't crash but won't work either
        return {
            auth: {
                signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
                signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
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
                eq: function() { return this; },
                single: async () => ({ data: null, error: new Error('Supabase not configured') }),
                maybeSingle: async () => ({ data: null, error: null }),
                limit: function() { return this; },
                order: function() { return this; },
            }),
            channel: () => ({
                on: function() { return this; },
                subscribe: () => {},
            }),
            removeChannel: async () => {},
        } as ReturnType<typeof createBrowserClient>;
    }
    
    return createBrowserClient(url, key);
};
