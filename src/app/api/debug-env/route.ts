import { NextResponse } from 'next/server';

export async function GET() {
    // Check what environment variables are available at runtime
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    return NextResponse.json({
        url: url ? {
            exists: true,
            length: url.length,
            prefix: url.substring(0, 30) + '...',
            hasQuotes: url.startsWith('"') || url.startsWith("'"),
            trimmed: url.replace(/^["']|["']$/g, '').trim().substring(0, 30) + '...'
        } : { exists: false },
        key: key ? {
            exists: true,
            length: key.length,
            prefix: key.substring(0, 20) + '...',
            hasQuotes: key.startsWith('"') || key.startsWith("'"),
        } : { exists: false },
        nodeEnv: process.env.NODE_ENV,
    });
}