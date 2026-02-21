import { describe, expect, it } from 'vitest';
import { PaymentAdapterRegistry } from '@/lib/payments/adapters';
import type {
    PaymentInitiateInput,
    PaymentInitiateResponse,
    PaymentProvider,
    PaymentProviderHealth,
    PaymentProviderName,
    PaymentVerifyResponse,
} from '@/lib/payments/types';

class MockProvider implements PaymentProvider {
    name: PaymentProviderName;
    private shouldFailInitiate: boolean;
    private healthStatus: PaymentProviderHealth['status'];

    constructor(params: {
        name: PaymentProviderName;
        shouldFailInitiate?: boolean;
        healthStatus?: PaymentProviderHealth['status'];
    }) {
        this.name = params.name;
        this.shouldFailInitiate = params.shouldFailInitiate ?? false;
        this.healthStatus = params.healthStatus ?? 'healthy';
    }

    async initiatePayment(input: PaymentInitiateInput): Promise<PaymentInitiateResponse> {
        if (this.shouldFailInitiate) {
            throw new Error(`${this.name} unavailable`);
        }

        return {
            checkoutUrl: `https://${this.name}.example/checkout`,
            transactionReference: `${this.name}-${Date.now()}`,
            provider: this.name,
            raw: input.metadata,
        };
    }

    async verifyPayment(transactionReference: string): Promise<PaymentVerifyResponse> {
        return {
            status: 'success',
            transactionReference,
            amount: 100,
            currency: 'ETB',
        };
    }

    async healthCheck(): Promise<PaymentProviderHealth> {
        return {
            provider: this.name,
            status: this.healthStatus,
            checkedAt: new Date().toISOString(),
        };
    }
}

describe('PaymentAdapterRegistry', () => {
    it('falls back to the next provider when preferred provider fails', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [
                new MockProvider({ name: 'telebirr', shouldFailInitiate: true }),
                new MockProvider({ name: 'chapa' }),
            ],
            fallbackPolicy: {
                enabled: true,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        const response = await registry.initiateWithFallback({
            preferredProvider: 'telebirr',
            input: { amount: 10, currency: 'ETB', email: 'ops@gebeta.app' },
        });

        expect(response.result.provider).toBe('chapa');
        expect(response.fallbackApplied).toBe(true);
        expect(response.attempts).toHaveLength(2);
        expect(response.attempts[0]).toMatchObject({ provider: 'telebirr', ok: false });
        expect(response.attempts[1]).toMatchObject({ provider: 'chapa', ok: true });
    });

    it('returns preferred provider when initiate succeeds without fallback', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [
                new MockProvider({ name: 'telebirr' }),
                new MockProvider({ name: 'chapa' }),
            ],
            fallbackPolicy: {
                enabled: true,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        const response = await registry.initiateWithFallback({
            preferredProvider: 'telebirr',
            input: { amount: 20, currency: 'ETB', email: 'ops@gebeta.app' },
        });

        expect(response.result.provider).toBe('telebirr');
        expect(response.fallbackApplied).toBe(false);
        expect(response.attempts).toHaveLength(1);
    });

    it('returns provider health checks in requested order', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [
                new MockProvider({ name: 'telebirr', healthStatus: 'degraded' }),
                new MockProvider({ name: 'chapa', healthStatus: 'healthy' }),
            ],
            fallbackPolicy: {
                enabled: true,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        const health = await registry.healthChecks();

        expect(health).toHaveLength(2);
        expect(health[0].provider).toBe('telebirr');
        expect(health[0].status).toBe('degraded');
        expect(health[1].provider).toBe('chapa');
        expect(health[1].status).toBe('healthy');
    });
});
