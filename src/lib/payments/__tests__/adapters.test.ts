/**
 * Tests for Payment Adapter Registry
 *
 * Focuses on branch coverage for:
 * - constructor (default providers, custom providers)
 * - getProvider (found, not found)
 * - healthChecks (with/without provider names, unregistered provider)
 * - initiateWithFallback (provider found, provider not found, success, failure)
 * - verify (provider found, provider not found)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentAdapterRegistry, createPaymentAdapterRegistry } from '../adapters';
import type { PaymentProvider, PaymentProviderHealth } from '../types';

function createMockProvider(name: 'chapa' | 'telebirr' | 'internal' = 'chapa'): PaymentProvider {
    return {
        name,
        initiatePayment: vi.fn().mockResolvedValue({
            checkoutUrl: 'https://checkout.example.com',
            transactionReference: 'tx-123',
            provider: name,
        }),
        verifyPayment: vi.fn().mockResolvedValue({
            status: 'success',
            transactionReference: 'tx-123',
            amount: 100,
            currency: 'ETB',
        }),
        healthCheck: vi.fn().mockResolvedValue({
            provider: name,
            status: 'healthy' as const,
            checkedAt: new Date().toISOString(),
        }),
    };
}

describe('PaymentAdapterRegistry', () => {
    let registry: PaymentAdapterRegistry;
    let mockChapa: PaymentProvider;
    let mockTelebirr: PaymentProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        mockChapa = createMockProvider('chapa');
        mockTelebirr = createMockProvider('telebirr');
        registry = new PaymentAdapterRegistry({
            providers: [mockChapa, mockTelebirr],
        });
    });

    describe('constructor', () => {
        it('should register custom providers', () => {
            const customProvider = createMockProvider('internal');
            const reg = new PaymentAdapterRegistry({
                providers: [customProvider],
            });
            expect(reg.getProvider('internal')).toBe(customProvider);
        });

        it('should handle empty providers array', () => {
            const reg = new PaymentAdapterRegistry({ providers: [] });
            expect(reg.getProvider('chapa')).toBeNull();
        });

        it('should handle undefined params', () => {
            // This creates default providers from env vars (which may not be set)
            const reg = new PaymentAdapterRegistry();
            // Just verify it doesn't throw
            expect(reg).toBeDefined();
        });
    });

    describe('getProvider', () => {
        it('should return registered provider by name', () => {
            expect(registry.getProvider('chapa')).toBe(mockChapa);
            expect(registry.getProvider('telebirr')).toBe(mockTelebirr);
        });

        it('should return null for unregistered provider', () => {
            expect(registry.getProvider('internal')).toBeNull();
        });
    });

    describe('healthChecks', () => {
        it('should check health of all providers when no names specified', async () => {
            const results = await registry.healthChecks();
            expect(results).toHaveLength(2);
            expect(results.map(r => r.provider)).toContain('chapa');
            expect(results.map(r => r.provider)).toContain('telebirr');
        });

        it('should check health of specific providers', async () => {
            const results = await registry.healthChecks(['chapa']);
            expect(results).toHaveLength(1);
            expect(results[0].provider).toBe('chapa');
        });

        it('should return unavailable for unregistered provider name', async () => {
            const results = await registry.healthChecks(['internal']);
            expect(results).toHaveLength(1);
            expect(results[0].provider).toBe('internal');
            expect(results[0].status).toBe('unavailable');
            expect(results[0].reason).toContain('not registered');
        });

        it('should handle empty array of provider names', async () => {
            // Empty array should fall back to all providers
            const results = await registry.healthChecks([]);
            expect(results).toHaveLength(2);
        });

        it('should handle mix of registered and unregistered providers', async () => {
            const results = await registry.healthChecks(['chapa', 'internal']);
            expect(results).toHaveLength(2);
            const chapaResult = results.find(r => r.provider === 'chapa');
            const internalResult = results.find(r => r.provider === 'internal');
            expect(chapaResult?.status).toBe('healthy');
            expect(internalResult?.status).toBe('unavailable');
        });
    });

    describe('initiateWithFallback', () => {
        const baseInput = {
            amount: 100,
            currency: 'ETB',
        };

        it('should initiate payment with preferred provider', async () => {
            const result = await registry.initiateWithFallback({
                preferredProvider: 'chapa',
                input: baseInput,
            });

            expect(result.result.provider).toBe('chapa');
            expect(result.attempts).toHaveLength(1);
            expect(result.attempts[0].ok).toBe(true);
            expect(result.fallbackApplied).toBe(false);
        });

        it('should throw when preferred provider is not registered', async () => {
            await expect(
                registry.initiateWithFallback({
                    preferredProvider: 'internal',
                    input: baseInput,
                })
            ).rejects.toThrow('Provider internal is not registered');
        });

        it('should throw with error details when provider fails', async () => {
            (mockChapa.initiatePayment as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                new Error('Network timeout')
            );

            await expect(
                registry.initiateWithFallback({
                    preferredProvider: 'chapa',
                    input: baseInput,
                })
            ).rejects.toThrow('Payment provider failed to initiate payment');
        });

        it('should handle non-Error thrown from provider', async () => {
            (mockChapa.initiatePayment as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
                'string error'
            );

            try {
                await registry.initiateWithFallback({
                    preferredProvider: 'chapa',
                    input: baseInput,
                });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('Unknown provider failure');
            }
        });
    });

    describe('verify', () => {
        it('should verify payment with registered provider', async () => {
            const result = await registry.verify({
                provider: 'chapa',
                transactionReference: 'tx-123',
            });

            expect(result.status).toBe('success');
            expect(result.transactionReference).toBe('tx-123');
        });

        it('should throw when provider is not registered', async () => {
            await expect(
                registry.verify({
                    provider: 'internal',
                    transactionReference: 'tx-123',
                })
            ).rejects.toThrow('Provider internal is not registered');
        });
    });

    describe('createPaymentAdapterRegistry', () => {
        it('should create a PaymentAdapterRegistry instance', () => {
            const reg = createPaymentAdapterRegistry();
            expect(reg).toBeInstanceOf(PaymentAdapterRegistry);
        });
    });
});
