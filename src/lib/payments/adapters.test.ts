import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

    constructor(
        params: {
            name?: PaymentProviderName;
            shouldFailInitiate?: boolean;
            healthStatus?: PaymentProviderHealth['status'];
        } = {}
    ) {
        this.name = params.name ?? 'chapa';
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
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initiates Chapa payments without fallback', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider()],
        });

        const response = await registry.initiateWithFallback({
            preferredProvider: 'chapa',
            input: { amount: 10, currency: 'ETB', email: 'ops@lole.app' },
        });

        expect(response.result.provider).toBe('chapa');
        expect(response.fallbackApplied).toBe(false);
        expect(response.attempts).toEqual([{ provider: 'chapa', ok: true }]);
    });

    it('throws when the requested provider is not registered', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [],
        });

        await expect(
            registry.initiateWithFallback({
                preferredProvider: 'chapa',
                input: { amount: 10, currency: 'ETB', email: 'ops@lole.app' },
            })
        ).rejects.toThrow('Provider chapa is not registered');
    });

    it('returns provider health checks', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ healthStatus: 'degraded' })],
        });

        const health = await registry.healthChecks();

        expect(health).toHaveLength(1);
        expect(health[0].provider).toBe('chapa');
        expect(health[0].status).toBe('degraded');
    });

    it('returns unavailable health for unknown provider requests', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [],
        });

        const health = await registry.healthChecks(['chapa']);

        expect(health).toHaveLength(1);
        expect(health[0].status).toBe('unavailable');
    });

    it('verify calls the registered provider', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider()],
        });

        const result = await registry.verify({
            provider: 'chapa',
            transactionReference: 'tx-123',
        });

        expect(result.status).toBe('success');
        expect(result.transactionReference).toBe('tx-123');
    });
});

describe('createPaymentAdapterRegistry', () => {
    it('creates a PaymentAdapterRegistry instance', async () => {
        const { createPaymentAdapterRegistry } = await import('./adapters');
        const registry = createPaymentAdapterRegistry();

        expect(registry).toBeDefined();
        expect(typeof registry.getProvider).toBe('function');
        expect(typeof registry.healthChecks).toBe('function');
        expect(typeof registry.initiateWithFallback).toBe('function');
        expect(typeof registry.verify).toBe('function');
    });
});
