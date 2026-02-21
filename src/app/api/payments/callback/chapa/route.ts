import { NextRequest, NextResponse } from 'next/server';
// In a real app, this would use the Chapa verify API to validate the webhook
// But for now we just acknowledge receipt

export async function POST(req: NextRequest) {
    console.log('Chapa Callback Received');
    const body = await req.json();
    console.log(body);

    // TODO: Verify payment via Chapa API call using tx_ref from body
    // TODO: Update order status to 'paid' in database

    return NextResponse.json({ status: 'ok' });
}
