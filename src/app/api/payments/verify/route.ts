import { z } from 'zod';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import { createPaymentAdapterRegistry } from '@/lib/payments/adapters';
import type { PaymentProviderName } from '@/lib/payments/types';

const VerifyPaymentSchema = z.object({
    provider: z.enum(['telebirr', 'chapa']),
    transaction_reference: z.string().trim().min(3).max(200),
});

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, VerifyPaymentSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const registry = createPaymentAdapterRegistry();

    try {
        const verification = await registry.verify({
            provider: parsed.data.provider as PaymentProviderName,
            transactionReference: parsed.data.transaction_reference,
        });

        return apiSuccess({
            verification,
            restaurant_id: context.restaurantId,
        });
    } catch (error) {
        return apiError(
            'Failed to verify payment',
            502,
            'PAYMENT_PROVIDER_VERIFY_FAILED',
            error instanceof Error ? error.message : 'Unknown provider verification error'
        );
    }
}
