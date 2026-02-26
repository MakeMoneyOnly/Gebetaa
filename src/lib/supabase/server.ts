import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
    const cookieStore = await cookies();

    // Get and clean environment variables
    // Vercel can store values with extra quotes and \r\n when set via CLI/API
    // e.g. '"actual-value" \r\n' — we need to strip all of that
    const cleanEnvVar = (val: string | undefined): string => {
        if (!val) return '';
        return val
            .replace(/\r/g, '')   // carriage returns
            .replace(/\n/g, '')   // newlines
            .replace(/^["']+/, '') // leading quotes (one or more)
            .replace(/["']+$/, '') // trailing quotes (one or more)
            .trim();
    };

    const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    // If environment variables are missing, return a mock client
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase environment variables are not set on server.');
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
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
