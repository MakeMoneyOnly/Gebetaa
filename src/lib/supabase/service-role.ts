import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Use the new Secret Key (sb_secret_...) only
    const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('CRITICAL ERROR: Supabase Administrative configuration missing.');
        console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
        console.error(
            'Administrative Key (Secret/Service):',
            supabaseKey ? `Set (Length: ${supabaseKey.length})` : 'Missing'
        );
        console.error(
            'Full Environment Keys:',
            Object.keys(process.env).filter(k => k.includes('SUPABASE'))
        );
        throw new Error('Missing Supabase Administrative configuration');
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
