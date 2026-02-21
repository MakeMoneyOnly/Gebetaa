import { PaymentProvider, PaymentInitiateResponse, PaymentVerifyResponse } from './types';

const CHAPA_API_URL = 'https://api.chapa.co/v1'; // Use sandbox URL if needed, but Chapa uses keys to differentiate

export class ChapaProvider implements PaymentProvider {
    name = 'chapa';
    private secretKey: string;

    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    async initiatePayment(
        amount: number,
        currency: string,
        email: string,
        metadata?: any
    ): Promise<PaymentInitiateResponse> {
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
                first_name: metadata?.firstName || 'Guest',
                last_name: metadata?.lastName || 'User',
                tx_ref: txRef,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback/chapa`,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/status?ref=${txRef}`,
                customization: {
                    title: 'Gebeta Order',
                    description: 'Payment for order',
                },
                meta: metadata,
            }),
        });

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to initiate Chapa payment');
        }

        return {
            checkoutUrl: data.data.checkout_url,
            transactionReference: txRef,
        };
    }

    async verifyPayment(transactionReference: string): Promise<PaymentVerifyResponse> {
        const response = await fetch(
            `${CHAPA_API_URL}/transaction/verify/${transactionReference}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            }
        );

        const data = await response.json();

        if (data.status !== 'success') {
            return {
                status: 'failed',
                transactionReference,
                amount: 0,
                currency: 'ETB',
            };
        }

        return {
            status: 'success',
            transactionReference: data.data.tx_ref,
            providerReference: data.data.reference,
            amount: parseFloat(data.data.amount),
            currency: data.data.currency,
            metadata: data.data.meta,
        };
    }
}
