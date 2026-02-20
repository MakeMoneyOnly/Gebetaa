import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('CRITICAL ERROR: Supabase Service Role configuration missing.');
        console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
        console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? `Set (Length: ${supabaseServiceRoleKey.length})` : 'Missing');
        console.error('Full Environment Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
        throw new Error('Missing Supabase Service Role configuration');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
