/**
 * Chapa Payment Service
 *
 * Integrates with Chapa (chapa.co) — Ethiopia's leading payment gateway
 * supporting Telebirr, CBE Birr, and major bank payments.
 *
 * Docs: https://developer.chapa.co/docs/accept-payments
 */

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export interface ChapaInitializeParams {
    amount: number; // ETB amount
    currency?: string; // defaults to 'ETB'
    email?: string;
    first_name: string;
    last_name?: string;
    phone_number?: string; // 09xxxxxxxx or 07xxxxxxxx format
    tx_ref: string; // unique transaction reference
    callback_url: string; // webhook URL Chapa POSTs to on success
    return_url: string; // where to redirect user after payment
    customization?: {
        title?: string;
        description?: string;
        logo?: string;
    };
    meta?: Record<string, string>;
}

export interface ChapaInitializeResponse {
    status: 'success' | 'failed';
    message: string;
    data?: {
        checkout_url: string;
    };
}

export interface ChapaVerifyResponse {
    status: 'success' | 'failed';
    message: string;
    data?: {
        amount: string;
        currency: string;
        status: 'success' | 'failed' | 'pending';
        reference: string;
        tx_ref: string;
        customization?: Record<string, string>;
        meta?: Record<string, string>;
    };
}

/**
 * Initialize a Chapa payment transaction
 * Returns a checkout_url to redirect the user to
 */
export async function initializeChapaTransaction(
    params: ChapaInitializeParams
): Promise<ChapaInitializeResponse> {
    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
        throw new Error('CHAPA_SECRET_KEY is not configured');
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...params,
            currency: params.currency ?? 'ETB',
        }),
    });

    const data = (await response.json()) as ChapaInitializeResponse;
    return data;
}

/**
 * Verify a completed Chapa transaction
 * Always verify server-side before marking order as confirmed
 */
export async function verifyChapaTransaction(txRef: string): Promise<ChapaVerifyResponse> {
    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
        throw new Error('CHAPA_SECRET_KEY is not configured');
    }

    const response = await fetch(
        `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        }
    );

    const data = (await response.json()) as ChapaVerifyResponse;
    return data;
}

/**
 * Generate a unique, sortable transaction reference for Chapa
 * Format: gebeta-{restaurant_prefix}-{timestamp}-{random}
 */
export function generateChapaTransactionRef(restaurantSlug: string): string {
    const prefix = restaurantSlug.replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `gebeta-${prefix}-${timestamp}-${random}`;
}

/**
 * Check whether Chapa is properly configured (secret key present)
 */
export function isChapaConfigured(): boolean {
    const key = process.env.CHAPA_SECRET_KEY;
    return !!key && key.length > 10 && !key.startsWith('MOCK');
}
