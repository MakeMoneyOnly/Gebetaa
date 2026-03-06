import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    it('getProvider returns null for unregistered provider', () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'telebirr' })],
        });

        const provider = registry.getProvider('chapa');

        expect(provider).toBeNull();
    });

    it('getProvider returns registered provider', () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'telebirr' })],
        });

        const provider = registry.getProvider('telebirr');

        expect(provider).not.toBeNull();
        expect(provider?.name).toBe('telebirr');
    });

    it('getFallbackPolicy returns current fallback policy', () => {
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

        const policy = registry.getFallbackPolicy();

        expect(policy.enabled).toBe(true);
        expect(policy.fallbackOrder).toEqual(['telebirr', 'chapa']);
    });

    it('getFallbackPolicy returns a copy of fallback order', () => {
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

        const policy1 = registry.getFallbackPolicy();
        const policy2 = registry.getFallbackPolicy();

        expect(policy1.fallbackOrder).not.toBe(policy2.fallbackOrder);
    });

    it('healthChecks returns unavailable for missing provider', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'telebirr' })],
            fallbackPolicy: {
                enabled: true,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        const health = await registry.healthChecks(['chapa']);

        expect(health).toHaveLength(1);
        expect(health[0].status).toBe('unavailable');
        expect(health[0].reason).toContain('not registered');
    });

    it('verify calls provider verifyPayment', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'telebirr' })],
        });

        const result = await registry.verify({
            provider: 'telebirr',
            transactionReference: 'tx-123',
        });

        expect(result.status).toBe('success');
        expect(result.transactionReference).toBe('tx-123');
    });

    it('verify throws for unregistered provider', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'telebirr' })],
        });

        await expect(
            registry.verify({
                provider: 'chapa',
                transactionReference: 'tx-123',
            })
        ).rejects.toThrow('not registered');
    });

    it('initiateWithFallback throws when all providers fail', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [
                new MockProvider({ name: 'telebirr', shouldFailInitiate: true }),
                new MockProvider({ name: 'chapa', shouldFailInitiate: true }),
            ],
            fallbackPolicy: {
                enabled: true,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        await expect(
            registry.initiateWithFallback({
                preferredProvider: 'telebirr',
                input: { amount: 10, currency: 'ETB', email: 'ops@gebeta.app' },
            })
        ).rejects.toThrow('All payment providers failed');
    });

    it('initiateWithFallback records attempt for missing provider', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [new MockProvider({ name: 'chapa' })],
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
        expect(response.attempts[0]).toMatchObject({
            provider: 'telebirr',
            ok: false,
            error: 'Provider not registered',
        });
    });

    it('initiateWithFallback skips fallback when disabled', async () => {
        const registry = new PaymentAdapterRegistry({
            providers: [
                new MockProvider({ name: 'telebirr', shouldFailInitiate: true }),
                new MockProvider({ name: 'chapa' }),
            ],
            fallbackPolicy: {
                enabled: false,
                fallbackOrder: ['telebirr', 'chapa'],
            },
        });

        await expect(
            registry.initiateWithFallback({
                preferredProvider: 'telebirr',
                input: { amount: 10, currency: 'ETB', email: 'ops@gebeta.app' },
            })
        ).rejects.toThrow('All payment providers failed');
    });
});

describe('createPaymentAdapterRegistry', () => {
    it('creates a PaymentAdapterRegistry instance', async () => {
        const { createPaymentAdapterRegistry } = await import('./adapters');
        const registry = createPaymentAdapterRegistry();
        // Check that registry has the expected methods instead of instanceof
        // (dynamic import creates a separate class reference)
        expect(registry).toBeDefined();
        expect(typeof registry.getProvider).toBe('function');
        expect(typeof registry.getFallbackPolicy).toBe('function');
        expect(typeof registry.healthChecks).toBe('function');
        expect(typeof registry.initiateWithFallback).toBe('function');
        expect(typeof registry.verify).toBe('function');
    });
});
