import { z } from 'zod';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseQuery } from '@/lib/api/validation';
import { createPaymentAdapterRegistry } from '@/lib/payments/adapters';
import type { PaymentProviderName } from '@/lib/payments/types';

const HealthQuerySchema = z.object({
    provider: z.enum(['telebirr', 'chapa']).optional(),
});

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = parseQuery(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
        HealthQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const registry = createPaymentAdapterRegistry();
    try {
        const provider = parsed.data.provider as PaymentProviderName | undefined;
        const checks = await registry.healthChecks(provider ? [provider] : undefined);
        const fallbackPolicy = registry.getFallbackPolicy();

        return apiSuccess({
            provider_health: checks,
            fallback_policy: fallbackPolicy,
            restaurant_id: context.restaurantId,
        });
    } catch (error) {
        return apiError(
            'Failed to load payment provider health',
            500,
            'PAYMENT_PROVIDER_HEALTH_FAILED',
            error instanceof Error ? error.message : 'Unknown provider health error'
        );
    }
}
