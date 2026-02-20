
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface PaymentInitiateResponse {
    checkoutUrl: string;
    transactionReference: string;
}

export interface PaymentVerifyResponse {
    status: PaymentStatus;
    transactionReference: string;
    providerReference?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
}

export interface PaymentProvider {
    name: string;
    initiatePayment(amount: number, currency: string, email: string, metadata?: any): Promise<PaymentInitiateResponse>;
    verifyPayment(transactionReference: string): Promise<PaymentVerifyResponse>;
}
