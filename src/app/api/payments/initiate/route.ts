import { z } from 'zod';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import { createPaymentAdapterRegistry } from '@/lib/payments/adapters';
import type { PaymentProviderName } from '@/lib/payments/types';

type RestaurantPaymentConfig = {
    chapa_subaccount_id: string | null;
    chapa_subaccount_status: string | null;
    hosted_checkout_fee_percentage?: number | null;
    platform_fee_percentage?: number | null;
};

const InitiatePaymentSchema = z.object({
    provider: z.enum(['chapa']),
    amount: z.coerce.number().min(0.01).max(100000000),
    currency: z.string().trim().length(3).optional().default('ETB'),
    email: z.string().email(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

function canUseChapaSubaccount(status: string, subaccountId: string) {
    if (!subaccountId) {
        return false;
    }

    return !['failed', 'verification_required', 'not_configured'].includes(status);
}

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
        const { data: restaurant, error: restaurantError } = await context.supabase
            .from('restaurants')
            .select('*')
            .eq('id', context.restaurantId)
            .maybeSingle();

        if (restaurantError) {
            throw new Error(restaurantError.message);
        }

        const paymentConfig = (restaurant ?? null) as RestaurantPaymentConfig | null;
        const subaccountId = String(paymentConfig?.chapa_subaccount_id ?? '').trim();
        const subaccountStatus = String(paymentConfig?.chapa_subaccount_status ?? '').trim();
        const useSubaccount = canUseChapaSubaccount(subaccountStatus, subaccountId);
        const settlementMode = useSubaccount ? 'subaccount_split' : 'platform_hold';

        const initiation = await registry.initiateWithFallback({
            preferredProvider: parsed.data.provider as PaymentProviderName,
            input: {
                amount: Number(parsed.data.amount.toFixed(2)),
                currency: parsed.data.currency.toUpperCase(),
                email: parsed.data.email,
                metadata: {
                    ...(parsed.data.metadata ?? {}),
                    settlement_mode: settlementMode,
                    merchant_payout_status: subaccountStatus || 'not_configured',
                },
                ...(useSubaccount
                    ? {
                          subaccountId,
                          splitType: 'percentage' as const,
                          splitValue:
                              typeof paymentConfig?.hosted_checkout_fee_percentage === 'number'
                                  ? Number(paymentConfig.hosted_checkout_fee_percentage)
                                  : Number(paymentConfig?.platform_fee_percentage ?? 0.03),
                      }
                    : {}),
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
                settlement_mode: settlementMode,
                merchant_payout_status: subaccountStatus || 'not_configured',
            },
            new_value: {
                provider: initiation.result.provider,
                amount: parsed.data.amount,
                currency: parsed.data.currency.toUpperCase(),
            },
        });

        return apiSuccess({
            checkout_url: initiation.result.checkoutUrl,
            transaction_reference: initiation.result.transactionReference,
            provider: initiation.result.provider,
            attempts: initiation.attempts,
            idempotency_key: idempotencyKey,
            settlement_mode: settlementMode,
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
