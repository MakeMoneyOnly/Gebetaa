import {
    PaymentInitiateInput,
    PaymentInitiateResponse,
    PaymentProvider,
    PaymentProviderError,
    PaymentProviderHealth,
    PaymentProviderName,
    PaymentVerifyResponse,
} from './types';

type TelebirrProviderOptions = {
    baseUrl?: string;
    appId?: string;
    appKey?: string;
    appUrl?: string;
};

type JsonRecord = Record<string, unknown>;

export class TelebirrProvider implements PaymentProvider {
    name: PaymentProviderName = 'telebirr';
    private baseUrl: string;
    private appId: string;
    private appKey: string;
    private appUrl: string;

    constructor(options?: TelebirrProviderOptions) {
        this.baseUrl = (options?.baseUrl ?? process.env.TELEBIRR_API_BASE_URL ?? '').replace(
            /\/$/,
            ''
        );
        this.appId = options?.appId ?? process.env.TELEBIRR_APP_ID ?? '';
        this.appKey = options?.appKey ?? process.env.TELEBIRR_APP_KEY ?? '';
        let fallbackAppUrl = 'http://localhost:3000';
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getAppUrl } = require('@/lib/config/env');
            fallbackAppUrl = getAppUrl();
        } catch {
            fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        }
        this.appUrl = options?.appUrl ?? fallbackAppUrl;
    }

    private hasConfig(): boolean {
        return Boolean(this.baseUrl && this.appId && this.appKey);
    }

    private headers(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'X-App-Id': this.appId,
            'X-App-Key': this.appKey,
        };
    }

    async initiatePayment(input: PaymentInitiateInput): Promise<PaymentInitiateResponse> {
        const { amount, currency, email, metadata } = input;
        if (!this.hasConfig()) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'TELEBIRR_MISSING_CONFIG',
                message: 'Telebirr credentials are not configured',
                statusCode: 500,
            });
        }

        const txRef = `tb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const response = await fetch(`${this.baseUrl}/payments/initiate`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({
                amount,
                currency,
                email,
                tx_ref: txRef,
                callback_url: `${this.appUrl}/api/payments/callback/telebirr`,
                return_url: `${this.appUrl}/order/status?ref=${txRef}`,
                metadata: metadata ?? {},
            }),
        });

        const data = (await response.json().catch(() => ({}))) as JsonRecord;
        const checkoutUrl =
            typeof data.checkout_url === 'string'
                ? data.checkout_url
                : typeof data.payment_url === 'string'
                  ? data.payment_url
                  : null;

        if (!response.ok || !checkoutUrl) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'TELEBIRR_INITIATE_FAILED',
                message:
                    typeof data.message === 'string'
                        ? data.message
                        : 'Failed to initiate Telebirr payment',
                statusCode: response.status || 502,
            });
        }

        return {
            checkoutUrl,
            transactionReference:
                typeof data.transaction_reference === 'string' ? data.transaction_reference : txRef,
            provider: this.name,
            raw: data,
        };
    }

    async verifyPayment(transactionReference: string): Promise<PaymentVerifyResponse> {
        if (!this.hasConfig()) {
            throw new PaymentProviderError({
                provider: this.name,
                code: 'TELEBIRR_MISSING_CONFIG',
                message: 'Telebirr credentials are not configured',
                statusCode: 500,
            });
        }

        const response = await fetch(`${this.baseUrl}/payments/verify/${transactionReference}`, {
            method: 'GET',
            headers: this.headers(),
        });

        const data = (await response.json().catch(() => ({}))) as JsonRecord;
        const rawStatus = typeof data.status === 'string' ? data.status.toLowerCase() : '';
        const status: PaymentVerifyResponse['status'] =
            rawStatus === 'success' || rawStatus === 'completed'
                ? 'success'
                : rawStatus === 'cancelled'
                  ? 'cancelled'
                  : 'failed';

        return {
            status,
            transactionReference:
                typeof data.transaction_reference === 'string'
                    ? data.transaction_reference
                    : transactionReference,
            providerReference:
                typeof data.provider_reference === 'string' ? data.provider_reference : undefined,
            amount: Number(data.amount ?? 0),
            currency: typeof data.currency === 'string' ? data.currency : 'ETB',
            metadata:
                typeof data.metadata === 'object' && data.metadata
                    ? (data.metadata as JsonRecord)
                    : {},
        };
    }

    async healthCheck(): Promise<PaymentProviderHealth> {
        const checkedAt = new Date().toISOString();
        if (!this.hasConfig()) {
            return {
                provider: this.name,
                status: 'unavailable',
                checkedAt,
                reason: 'Missing Telebirr configuration',
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: this.headers(),
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
