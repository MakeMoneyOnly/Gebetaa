import { NextRequest, NextResponse } from 'next/server';
import {
    parseChapaWebhook,
    publishPaymentWebhookEvent,
    verifyChapaWebhookSignature,
} from '@/lib/payments/webhooks';

export async function GET(): Promise<NextResponse> {
    // Chapa browser redirects may still hit old callback expectations.
    // We acknowledge the request but only POST deliveries trigger state changes.
    return NextResponse.json({ received: true, ignored: true });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-chapa-signature');

        if (!verifyChapaWebhookSignature(rawBody, signature)) {
            return NextResponse.json(
                {
                    error: {
                        code: 'INVALID_SIGNATURE',
                        message: 'Invalid Chapa webhook signature',
                    },
                },
                { status: 401 }
            );
        }

        const parsed = parseChapaWebhook(rawBody, request.nextUrl.searchParams);
        const published = await publishPaymentWebhookEvent(parsed);

        return NextResponse.json({
            data: {
                received: true,
                event_id: published.eventId,
                job_message_id: published.jobMessageId ?? null,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: {
                    code: 'WEBHOOK_PROCESSING_FAILED',
                    message: 'Failed to process Chapa webhook',
                    details: error instanceof Error ? error.message : 'Unknown webhook error',
                },
            },
            { status: 500 }
        );
    }
}
