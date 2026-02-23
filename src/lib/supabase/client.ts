import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // During build or if missing, provide safe fallbacks to prevent crash
    if (!supabaseUrl || !supabaseKey) {
        // Only warn in development or build, but we must return something to satisfy types
        // if this is called during prerendering.
        return createBrowserClient<Database>(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseKey || 'placeholder-key'
        );
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

// Singleton for client-side usage
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
