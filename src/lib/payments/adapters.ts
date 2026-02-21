import { ChapaProvider } from './chapa';
import { TelebirrProvider } from './telebirr';
import {
    PaymentInitiateInput,
    PaymentInitiateWithFallbackResponse,
    PaymentProvider,
    PaymentProviderFallbackPolicy,
    PaymentProviderHealth,
    PaymentProviderName,
    PaymentVerifyResponse,
} from './types';

const DEFAULT_FALLBACK_ORDER: PaymentProviderName[] = ['telebirr', 'chapa'];

function parseFallbackOrder(value: string | undefined): PaymentProviderName[] {
    if (!value) return DEFAULT_FALLBACK_ORDER;
    const parsed = value
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter((item): item is PaymentProviderName => item === 'telebirr' || item === 'chapa');
    return parsed.length > 0 ? parsed : DEFAULT_FALLBACK_ORDER;
}

export class PaymentAdapterRegistry {
    private providers: Record<string, PaymentProvider>;
    private fallbackPolicy: PaymentProviderFallbackPolicy;

    constructor(params?: {
        providers?: PaymentProvider[];
        fallbackPolicy?: PaymentProviderFallbackPolicy;
    }) {
        const providerList = params?.providers ?? [
            new TelebirrProvider(),
            new ChapaProvider(process.env.CHAPA_SECRET_KEY ?? ''),
        ];

        this.providers = providerList.reduce<Record<string, PaymentProvider>>((acc, provider) => {
            acc[provider.name] = provider;
            return acc;
        }, {});

        this.fallbackPolicy = params?.fallbackPolicy ?? {
            enabled: process.env.PAYMENT_PROVIDER_FALLBACK_ENABLED !== 'false',
            fallbackOrder: parseFallbackOrder(process.env.PAYMENT_PROVIDER_FALLBACK_ORDER),
        };
    }

    getFallbackPolicy(): PaymentProviderFallbackPolicy {
        return {
            enabled: this.fallbackPolicy.enabled,
            fallbackOrder: [...this.fallbackPolicy.fallbackOrder],
        };
    }

    getProvider(name: PaymentProviderName): PaymentProvider | null {
        return this.providers[name] ?? null;
    }

    async healthChecks(providerNames?: PaymentProviderName[]): Promise<PaymentProviderHealth[]> {
        const names = providerNames?.length
            ? providerNames
            : this.fallbackPolicy.fallbackOrder.filter(
                  candidate => this.providers[candidate] !== undefined
              );
        const checks = await Promise.all(
            names.map(async providerName => {
                const provider = this.providers[providerName];
                if (!provider) {
                    return {
                        provider: providerName,
                        status: 'unavailable' as const,
                        checkedAt: new Date().toISOString(),
                        reason: 'Provider is not registered',
                    };
                }
                return provider.healthCheck();
            })
        );
        return checks;
    }

    async initiateWithFallback(params: {
        preferredProvider: PaymentProviderName;
        input: PaymentInitiateInput;
    }): Promise<PaymentInitiateWithFallbackResponse> {
        const attempts: PaymentInitiateWithFallbackResponse['attempts'] = [];

        const order: PaymentProviderName[] = [params.preferredProvider];
        if (this.fallbackPolicy.enabled) {
            for (const candidate of this.fallbackPolicy.fallbackOrder) {
                if (!order.includes(candidate)) {
                    order.push(candidate);
                }
            }
        }

        for (const providerName of order) {
            const provider = this.providers[providerName];
            if (!provider) {
                attempts.push({
                    provider: providerName,
                    ok: false,
                    error: 'Provider not registered',
                });
                continue;
            }

            try {
                const result = await provider.initiatePayment(params.input);
                attempts.push({ provider: providerName, ok: true });
                return {
                    result,
                    attempts,
                    fallbackApplied: providerName !== params.preferredProvider,
                };
            } catch (error) {
                attempts.push({
                    provider: providerName,
                    ok: false,
                    error: error instanceof Error ? error.message : 'Unknown provider failure',
                });
            }
        }

        throw new Error('All payment providers failed to initiate payment');
    }

    async verify(params: {
        provider: PaymentProviderName;
        transactionReference: string;
    }): Promise<PaymentVerifyResponse> {
        const provider = this.getProvider(params.provider);
        if (!provider) {
            throw new Error(`Provider ${params.provider} is not registered`);
        }
        return provider.verifyPayment(params.transactionReference);
    }
}

export function createPaymentAdapterRegistry(): PaymentAdapterRegistry {
    return new PaymentAdapterRegistry();
}
