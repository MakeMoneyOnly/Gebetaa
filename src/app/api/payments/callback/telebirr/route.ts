import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    console.log('Telebirr Callback Received', body);

    return NextResponse.json({ status: 'ok' });
}
