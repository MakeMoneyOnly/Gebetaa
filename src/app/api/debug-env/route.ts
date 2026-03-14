/**
 * Debug Environment Route
 * Only available in development mode for troubleshooting
 */

import { apiSuccess, apiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return apiError('Not found', 404, 'NOT_FOUND');
    }

    const envStatus = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            ? 'set'
            : 'missing',
        SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? 'set' : 'missing',
        SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? 'set' : 'missing',
        REDIS_URL: process.env.REDIS_URL ? 'set' : 'missing',
        QR_HMAC_SECRET: process.env.QR_HMAC_SECRET ? 'set' : 'missing',
        VERCEL_ENV: process.env.VERCEL_ENV || 'not on vercel',
        VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
    };

    return apiSuccess({ environment: envStatus });
}
