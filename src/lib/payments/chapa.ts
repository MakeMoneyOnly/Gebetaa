import {
    PaymentInitiateInput,
    PaymentInitiateResponse,
    PaymentProvider,
    PaymentProviderError,
    PaymentProviderHealth,
    PaymentProviderName,
    PaymentVerifyResponse,
} from './types';

const CHAPA_API_URL = 'https://api.chapa.co/v1';

export class ChapaProvider implements PaymentProvider {
    name: PaymentProviderName = 'chapa';
    private secretKey: string;
    private appUrl: string;

    constructor(secretKey: string, appUrl?: string) {
        this.secretKey = secretKey;
        this.appUrl = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    }

    async initiatePayment(input: PaymentInitiateInput): Promise<PaymentInitiateResponse> {
        const { amount, currency, email, metadata } = input;

        if (!this.secretKey) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'CHAPA_MISSING_SECRET',
                message: 'Chapa secret key is not configured',
                statusCode: 500,
            });
        }

        const txRef = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount.toString(),
                currency,
                email,
                first_name:
                    typeof metadata?.firstName === 'string' && metadata.firstName.trim().length > 0
                        ? metadata.firstName
                        : 'Guest',
                last_name:
                    typeof metadata?.lastName === 'string' && metadata.lastName.trim().length > 0
                        ? metadata.lastName
                        : 'User',
                tx_ref: txRef,
                callback_url: `${this.appUrl}/api/payments/callback/chapa`,
                return_url: `${this.appUrl}/order/status?ref=${txRef}`,
                customization: {
                    title: 'Gebeta Order',
                    description: 'Payment for order',
                },
                meta: metadata,
            }),
        });

        const data = (await response.json()) as {
            status?: string;
            message?: string;
            data?: { checkout_url?: string };
        };

        if (!response.ok || data.status !== 'success' || !data.data?.checkout_url) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'CHAPA_INITIATE_FAILED',
                message: data.message || 'Failed to initiate Chapa payment',
                statusCode: response.status || 502,
            });
        }

        return {
            checkoutUrl: data.data.checkout_url,
            transactionReference: txRef,
            provider: this.name,
            raw: data as unknown as Record<string, unknown>,
        };
    }

    async verifyPayment(transactionReference: string): Promise<PaymentVerifyResponse> {
        if (!this.secretKey) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'CHAPA_MISSING_SECRET',
                message: 'Chapa secret key is not configured',
                statusCode: 500,
            });
        }

        const response = await fetch(
            `${CHAPA_API_URL}/transaction/verify/${transactionReference}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            }
        );

        const data = (await response.json()) as {
            status?: string;
            message?: string;
            data?: {
                tx_ref?: string;
                reference?: string;
                amount?: string | number;
                currency?: string;
                meta?: Record<string, unknown>;
            };
        };

        if (!response.ok || data.status !== 'success' || !data.data) {
            return {
                status: 'failed',
                transactionReference,
                amount: 0,
                currency: 'ETB',
            };
        }

        return {
            status: 'success',
            transactionReference: data.data.tx_ref ?? transactionReference,
            providerReference: data.data.reference,
            amount: Number(data.data.amount ?? 0),
            currency: data.data.currency ?? 'ETB',
            metadata: data.data.meta,
        };
    }

    async healthCheck(): Promise<PaymentProviderHealth> {
        const checkedAt = new Date().toISOString();

        if (!this.secretKey) {
            return {
                provider: this.name,
                status: 'unavailable',
                checkedAt,
                reason: 'Missing Chapa secret key',
            };
        }

        try {
            const response = await fetch(`${CHAPA_API_URL}/banks`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });

            if (!response.ok) {
                return {
                    provider: this.name,
                    status: response.status >= 500 ? 'unavailable' : 'degraded',
                    checkedAt,
                    reason: `Health probe failed with status ${response.status}`,
                };
            }

            return {
                provider: this.name,
                status: 'healthy',
                checkedAt,
            };
        } catch (error) {
            return {
                provider: this.name,
                status: 'unavailable',
                checkedAt,
                reason: error instanceof Error ? error.message : 'Unknown health check error',
            };
        }
    }
}
