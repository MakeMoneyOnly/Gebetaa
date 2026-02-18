import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { trackApiMetric } from '@/lib/api/metrics';
import { enforcePilotAccess } from '@/lib/api/pilotGate';

const UpdateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'acknowledged', 'preparing', 'ready', 'served', 'completed', 'cancelled']),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['acknowledged', 'cancelled'],
    acknowledged: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['served', 'cancelled'],
    served: ['completed'],
    completed: [],
    cancelled: [],
};

function canTransition(current: string | null, next: string) {
    if (!current) {
        return false;
    }
    return (ALLOWED_TRANSITIONS[current] || []).includes(next);
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    const startedAt = Date.now();
    let responseStatus = 500;
    let restaurantIdForMetrics: string | null = null;
    let supabaseForMetrics: Awaited<ReturnType<typeof createClient>> | null = null;

    try {
        const { orderId } = await context.params;
        const body = await request.json();
        const parsed = UpdateOrderStatusSchema.safeParse(body);

        if (!parsed.success) {
            responseStatus = 400;
            return apiError('Invalid request payload', 400, 'INVALID_PAYLOAD', parsed.error.flatten());
        }

        const supabase = await createClient();
        supabaseForMetrics = supabase;
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            responseStatus = 401;
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, restaurant_id, status')
            .eq('id', orderId)
            .maybeSingle();

        if (orderError) {
            responseStatus = 500;
            return apiError('Failed to load order', 500, 'ORDER_FETCH_FAILED', orderError.message);
        }

        if (!order) {
            responseStatus = 404;
            return apiError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        restaurantIdForMetrics = order.restaurant_id;

        const pilotGateResponse = enforcePilotAccess(order.restaurant_id, request.method);
        if (pilotGateResponse) {
            responseStatus = pilotGateResponse.status;
            return pilotGateResponse;
        }

        const { data: staff, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('id')
            .eq('restaurant_id', order.restaurant_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        if (staffError) {
            responseStatus = 500;
            return apiError('Failed to verify staff access', 500, 'STAFF_ACCESS_CHECK_FAILED', staffError.message);
        }

        if (!staff) {
            responseStatus = 403;
            return apiError('Forbidden', 403, 'FORBIDDEN');
        }

        if (!canTransition(order.status, parsed.data.status)) {
            responseStatus = 409;
            return apiError(
                `Invalid status transition from "${order.status}" to "${parsed.data.status}"`,
                409,
                'INVALID_TRANSITION'
            );
        }

        const now = new Date().toISOString();
        const updatePayload: Record<string, string> = {
            status: parsed.data.status,
            updated_at: now,
        };

        if (parsed.data.status === 'acknowledged') {
            updatePayload.acknowledged_at = now;
        }
        if (parsed.data.status === 'ready' || parsed.data.status === 'completed') {
            updatePayload.completed_at = now;
        }
        if (['acknowledged', 'preparing', 'ready'].includes(parsed.data.status)) {
            updatePayload.kitchen_status = parsed.data.status;
        }

        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', order.id)
            .select('*')
            .single();

        if (updateError || !updatedOrder) {
            responseStatus = 500;
            return apiError('Failed to update order status', 500, 'ORDER_UPDATE_FAILED', updateError?.message);
        }

        const { error: auditError } = await supabase.from('audit_logs').insert({
            restaurant_id: order.restaurant_id,
            user_id: user.id,
            action: 'order_status_updated',
            entity_type: 'order',
            entity_id: order.id,
            old_value: { status: order.status },
            new_value: { status: parsed.data.status },
            metadata: { source: 'merchant_dashboard' },
        });
        if (auditError) {
            console.warn('[PATCH /api/orders/:id/status] audit insert failed:', auditError.message);
        }

        const { error: eventError } = await (supabase as any).from('order_events').insert({
            restaurant_id: order.restaurant_id,
            order_id: order.id,
            event_type: 'status_changed',
            from_status: order.status,
            to_status: parsed.data.status,
            actor_user_id: user.id,
            metadata: { source: 'merchant_dashboard' },
        });
        if (eventError) {
            console.warn('[PATCH /api/orders/:id/status] order_events insert failed:', eventError.message);
        }

        responseStatus = 200;
        return apiSuccess(updatedOrder);
    } catch (error) {
        responseStatus = 500;
        return apiError(
            'Internal server error',
            500,
            'INTERNAL_ERROR',
            error instanceof Error ? error.message : 'Unknown error'
        );
    } finally {
        if (supabaseForMetrics) {
            const durationMs = Date.now() - startedAt;
            await trackApiMetric(supabaseForMetrics, {
                restaurantId: restaurantIdForMetrics,
                endpoint: '/api/orders/:id/status',
                method: 'PATCH',
                statusCode: responseStatus,
                durationMs,
            });
        }
    }
}
