import { z } from 'zod';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import { createPaymentAdapterRegistry } from '@/lib/payments/adapters';
import type { PaymentProviderName } from '@/lib/payments/types';

const InitiatePaymentSchema = z.object({
    provider: z.enum(['telebirr', 'chapa']),
    amount: z.coerce.number().min(0.01).max(100000000),
    currency: z.string().trim().length(3).optional().default('ETB'),
    email: z.string().email(),
    metadata: z.record(z.string(), z.unknown()).optional(),
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

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, InitiatePaymentSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const registry = createPaymentAdapterRegistry();

    try {
        const initiation = await registry.initiateWithFallback({
            preferredProvider: parsed.data.provider as PaymentProviderName,
            input: {
                amount: Number(parsed.data.amount.toFixed(2)),
                currency: parsed.data.currency.toUpperCase(),
                email: parsed.data.email,
                metadata: parsed.data.metadata,
            },
        });

        await writeAuditLog(context.supabase, {
            restaurant_id: context.restaurantId,
            user_id: auth.user.id,
            action: 'payment_provider_initiated',
            entity_type: 'payment_attempt',
            entity_id: initiation.result.transactionReference,
            metadata: {
                source: 'merchant_dashboard',
                idempotency_key: idempotencyKey,
                attempts: initiation.attempts,
            },
            new_value: {
                provider: initiation.result.provider,
                amount: parsed.data.amount,
                currency: parsed.data.currency.toUpperCase(),
                fallback_applied: initiation.fallbackApplied,
            },
        });

        return apiSuccess({
            checkout_url: initiation.result.checkoutUrl,
            transaction_reference: initiation.result.transactionReference,
            provider: initiation.result.provider,
            attempts: initiation.attempts,
            fallback_applied: initiation.fallbackApplied,
            idempotency_key: idempotencyKey,
        });
    } catch (error) {
        return apiError(
            'Failed to initiate payment',
            502,
            'PAYMENT_PROVIDER_INITIATE_FAILED',
            error instanceof Error ? error.message : 'Unknown provider initiation error'
        );
    }
}
