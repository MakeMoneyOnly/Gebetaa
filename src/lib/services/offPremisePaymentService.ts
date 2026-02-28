/**
 * Off-Premise Payment Service
 *
 * Handles payment enforcement for off-premise orders (delivery/pickup).
 * Requires upfront digital payment via Chapa or Telebirr before order submission.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Generate a unique ID without external dependency
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Payment providers configuration
const PAYMENT_PROVIDERS = {
    chapa: {
        name: 'Chapa',
        api_url: process.env.CHAPA_API_URL ?? 'https://api.chapa.co/v1',
        secret_key: process.env.CHAPA_SECRET_KEY,
        public_key: process.env.CHAPA_PUBLIC_KEY,
    },
    telebirr: {
        name: 'Telebirr',
        api_url: process.env.TELEBIRR_API_URL ?? 'https://api.telebirr.com.et',
        app_id: process.env.TELEBIRR_APP_ID,
        app_key: process.env.TELEBIRR_APP_KEY,
    },
} as const;

type PaymentProvider = keyof typeof PAYMENT_PROVIDERS;

export interface OffPremisePaymentRequest {
    orderId: string;
    restaurantId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
    customerPhone: string;
    customerName: string;
    returnUrl: string;
    webhookUrl: string;
    metadata?: Record<string, unknown>;
}

export interface PaymentInitializationResult {
    success: boolean;
    paymentId?: string;
    checkoutUrl?: string;
    reference?: string;
    provider?: PaymentProvider;
    error?: string;
    qrCode?: string;
}

export interface PaymentVerificationResult {
    success: boolean;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount?: number;
    currency?: string;
    paidAt?: string;
    reference?: string;
    error?: string;
}

/**
 * Initialize payment for off-premise order
 */
export async function initializeOffPremisePayment(
    request: OffPremisePaymentRequest
): Promise<PaymentInitializationResult> {
    const supabase = await createClient();
    const paymentReference = `GEB-${Date.now()}-${generateId().slice(0, 8).toUpperCase()}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            restaurant_id: request.restaurantId,
            order_id: request.orderId,
            amount: request.amount,
            currency: request.currency ?? 'ETB',
            method: 'digital',
            provider: 'chapa',
            status: 'pending',
            metadata: {
                reference: paymentReference,
                customer_phone: request.customerPhone,
                customer_name: request.customerName,
                customer_email: request.customerEmail,
                ...request.metadata,
            },
        })
        .select('id')
        .single();

    if (paymentError || !payment) {
        console.error('Failed to create payment record:', paymentError);
        return { success: false, error: 'Failed to initialize payment' };
    }

    // Try Chapa first
    const chapaConfig = PAYMENT_PROVIDERS.chapa;

    if (chapaConfig.secret_key) {
        const result = await initializeChapaPayment({
            ...request,
            paymentId: payment.id,
            reference: paymentReference,
        });

        if (result.success) {
            await supabase
                .from('payments')
                .update({
                    provider_reference: result.reference,
                    metadata: {
                        reference: paymentReference,
                        provider: 'chapa',
                        checkout_url: result.checkoutUrl,
                    },
                })
                .eq('id', payment.id);

            return { ...result, paymentId: payment.id, provider: 'chapa' };
        }
    }

    // Fall back to Telebirr
    const telebirrConfig = PAYMENT_PROVIDERS.telebirr;

    if (telebirrConfig.app_id && telebirrConfig.app_key) {
        const result = await initializeTelebirrPayment({
            ...request,
            paymentId: payment.id,
            reference: paymentReference,
        });

        if (result.success) {
            await supabase
                .from('payments')
                .update({
                    provider: 'telebirr',
                    provider_reference: result.reference,
                    metadata: {
                        reference: paymentReference,
                        provider: 'telebirr',
                        qr_code: result.qrCode,
                    },
                })
                .eq('id', payment.id);

            return { ...result, paymentId: payment.id, provider: 'telebirr' };
        }
    }

    // Mock for development
    console.warn('No payment provider configured, using mock payment');
    return {
        success: true,
        paymentId: payment.id,
        checkoutUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/mock/${paymentReference}`,
        reference: paymentReference,
        provider: 'chapa',
    };
}

/**
 * Initialize Chapa payment
 */
async function initializeChapaPayment(params: {
    orderId: string;
    restaurantId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
    customerPhone: string;
    customerName: string;
    returnUrl: string;
    webhookUrl: string;
    paymentId: string;
    reference: string;
}): Promise<PaymentInitializationResult> {
    const chapaConfig = PAYMENT_PROVIDERS.chapa;

    try {
        const response = await fetch(`${chapaConfig.api_url}/transaction/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${chapaConfig.secret_key}`,
            },
            body: JSON.stringify({
                amount: params.amount,
                currency: params.currency ?? 'ETB',
                email: params.customerEmail ?? 'guest@gebetaa.et',
                first_name: params.customerName.split(' ')[0] ?? 'Guest',
                last_name: params.customerName.split(' ').slice(1).join(' ') ?? '',
                phone_number: params.customerPhone,
                tx_ref: params.reference,
                callback_url: params.webhookUrl,
                return_url: params.returnUrl,
                customization: {
                    title: 'Gebetaa Order',
                    description: `Payment for order ${params.orderId}`,
                },
                meta: {
                    order_id: params.orderId,
                    restaurant_id: params.restaurantId,
                    payment_id: params.paymentId,
                },
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message ?? 'Chapa initialization failed');
        }

        return { success: true, checkoutUrl: data.data.checkout_url, reference: params.reference };
    } catch (error) {
        console.error('Chapa payment initialization failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Payment initialization failed',
        };
    }
}

/**
 * Initialize Telebirr payment (QR-based)
 */
async function initializeTelebirrPayment(params: {
    orderId: string;
    amount: number;
    customerPhone: string;
    returnUrl: string;
    webhookUrl: string;
    reference: string;
    paymentId?: string;
}): Promise<PaymentInitializationResult> {
    const telebirrConfig = PAYMENT_PROVIDERS.telebirr;

    try {
        const response = await fetch(`${telebirrConfig.api_url}/v1/payment/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-Id': telebirrConfig.app_id!,
            },
            body: JSON.stringify({
                appId: telebirrConfig.app_id,
                appKey: telebirrConfig.app_key,
                outTradeNo: params.reference,
                totalAmount: params.amount,
                subject: `Gebetaa Order`,
                shortCode: process.env.TELEBIRR_SHORT_CODE,
                notifyUrl: params.webhookUrl,
                returnUrl: params.returnUrl,
                timeoutExpress: '30m',
            }),
        });

        const data = await response.json();

        if (!response.ok || data.code !== '0') {
            throw new Error(data.message ?? 'Telebirr initialization failed');
        }

        return {
            success: true,
            qrCode: data.qrCode ?? data.qr_code,
            checkoutUrl: data.redirectUrl ?? data.redirect_url,
            reference: params.reference,
        };
    } catch (error) {
        console.error('Telebirr payment initialization failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Payment initialization failed',
        };
    }
}

/**
 * Verify payment status
 */
export async function verifyOffPremisePayment(
    paymentId: string
): Promise<PaymentVerificationResult> {
    const supabase = await createClient();

    const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();

    if (error || !payment) {
        return { success: false, status: 'failed', error: 'Payment not found' };
    }

    if (payment.status === 'completed') {
        return {
            success: true,
            status: 'completed',
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.captured_at ?? undefined,
            reference: payment.provider_reference ?? undefined,
        };
    }

    const provider = payment.provider as PaymentProvider;
    const metadata = payment.metadata as Record<string, unknown>;
    const reference = metadata?.reference as string;

    if (provider === 'chapa' && PAYMENT_PROVIDERS.chapa.secret_key) {
        return verifyChapaPayment(payment.id, reference);
    }

    if (provider === 'telebirr' && PAYMENT_PROVIDERS.telebirr.app_id) {
        return verifyTelebirrPayment(payment.id, reference);
    }

    return {
        success: true,
        status: payment.status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
        amount: payment.amount,
        currency: payment.currency,
        reference: reference,
    };
}

/**
 * Verify Chapa payment
 */
async function verifyChapaPayment(
    paymentId: string,
    reference: string
): Promise<PaymentVerificationResult> {
    const supabase = await createClient();
    const chapaConfig = PAYMENT_PROVIDERS.chapa;

    try {
        const response = await fetch(`${chapaConfig.api_url}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${chapaConfig.secret_key}` },
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            return {
                success: false,
                status: 'failed',
                error: data.message ?? 'Verification failed',
            };
        }

        const txData = data.data;
        const status = mapChapaStatus(txData.status);

        await supabase
            .from('payments')
            .update({
                status,
                captured_at: status === 'completed' ? new Date().toISOString() : null,
                provider_reference: txData.reference ?? reference,
            })
            .eq('id', paymentId);

        return {
            success: status === 'completed',
            status,
            amount: txData.amount,
            currency: txData.currency ?? 'ETB',
            paidAt: txData.created_at ?? undefined,
            reference: txData.reference ?? reference,
        };
    } catch (error) {
        console.error('Chapa verification failed:', error);
        return {
            success: false,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Verification failed',
        };
    }
}

/**
 * Verify Telebirr payment
 */
async function verifyTelebirrPayment(
    paymentId: string,
    reference: string
): Promise<PaymentVerificationResult> {
    const supabase = await createClient();
    const telebirrConfig = PAYMENT_PROVIDERS.telebirr;

    try {
        const response = await fetch(`${telebirrConfig.api_url}/v1/payment/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-Id': telebirrConfig.app_id!,
            },
            body: JSON.stringify({
                appId: telebirrConfig.app_id,
                appKey: telebirrConfig.app_key,
                outTradeNo: reference,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                status: 'failed',
                error: data.message ?? 'Verification failed',
            };
        }

        const status = mapTelebirrStatus(data.tradeStatus);

        await supabase
            .from('payments')
            .update({
                status,
                captured_at: status === 'completed' ? new Date().toISOString() : null,
            })
            .eq('id', paymentId);

        return {
            success: status === 'completed',
            status,
            amount: data.totalAmount,
            currency: 'ETB',
            paidAt: data.payTime ?? undefined,
            reference,
        };
    } catch (error) {
        console.error('Telebirr verification failed:', error);
        return {
            success: false,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Verification failed',
        };
    }
}

function mapChapaStatus(
    status: string
): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const map: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
        pending: 'pending',
        processing: 'processing',
        success: 'completed',
        failed: 'failed',
        cancelled: 'cancelled',
    };
    return map[status.toLowerCase()] ?? 'pending';
}

function mapTelebirrStatus(
    status: string
): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const map: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
        WAIT_BUYER_PAY: 'pending',
        TRADE_SUCCESS: 'completed',
        TRADE_FINISHED: 'completed',
        TRADE_CLOSED: 'cancelled',
        TRADE_FAILED: 'failed',
    };
    return map[status] ?? 'pending';
}

/**
 * Check if payment is required for off-premise order
 */
export function isPaymentRequiredForOffPremise(_fulfillmentType: 'delivery' | 'pickup'): boolean {
    return true; // Both delivery and pickup require upfront payment
}

/**
 * Calculate total with delivery fee
 */
export function calculateOffPremiseTotal(
    subtotal: number,
    deliveryFee: number,
    serviceFee: number = 0
): number {
    return subtotal + deliveryFee + serviceFee;
}
