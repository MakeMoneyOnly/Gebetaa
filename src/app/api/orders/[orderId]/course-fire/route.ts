import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
    getAuthenticatedUser,
    getAuthorizedRestaurantContext,
    getDeviceContext,
} from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';

const CourseTypeSchema = z.enum(['appetizer', 'main', 'dessert', 'beverage', 'side']);

const UpdateCourseFireSchema = z.object({
    fire_mode: z.enum(['auto', 'manual']),
    current_course: CourseTypeSchema.nullish(),
});

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
    const auth = await getAuthenticatedUser();
    let actorUserId: string | null = null;
    let restaurantId: string;
    let db: any;

    if (auth.ok) {
        const restaurantContext = await getAuthorizedRestaurantContext(auth.user.id);
        if (!restaurantContext.ok) {
            return restaurantContext.response;
        }
        actorUserId = auth.user.id;
        restaurantId = restaurantContext.restaurantId;
        db = restaurantContext.supabase;
    } else {
        const deviceContext = await getDeviceContext(request);
        if (!deviceContext.ok) {
            return auth.response;
        }
        restaurantId = deviceContext.restaurantId;
        db = deviceContext.admin;
    }

    const parsed = await parseJsonBody(request, UpdateCourseFireSchema);
    if (!parsed.success) return parsed.response;

    const { orderId } = await context.params;
    const { fire_mode: fireMode, current_course: currentCourseInput } = parsed.data;
    const currentCourse = fireMode === 'manual' ? (currentCourseInput ?? 'appetizer') : null;

    const { data: existingOrder, error: existingOrderError } = await db
        .from('orders')
        .select('id, restaurant_id, fire_mode, current_course')
        .eq('restaurant_id', restaurantId)
        .eq('id', orderId)
        .maybeSingle();

    if (existingOrderError) {
        return apiError('Failed to load order', 500, 'ORDER_FETCH_FAILED', existingOrderError.message);
    }
    if (!existingOrder) {
        return apiError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const { data: updatedOrder, error: updateError } = await db
        .from('orders')
        .update({
            fire_mode: fireMode,
            current_course: currentCourse,
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('id, fire_mode, current_course')
        .single();

    if (updateError || !updatedOrder) {
        return apiError(
            'Failed to update order course firing',
            500,
            'ORDER_COURSE_FIRING_UPDATE_FAILED',
            updateError?.message
        );
    }

    await writeAuditLog(db, {
        restaurant_id: restaurantId,
        user_id: actorUserId,
        action: 'order_course_firing_updated',
        entity_type: 'order',
        entity_id: orderId,
        old_value: {
            fire_mode: existingOrder.fire_mode,
            current_course: existingOrder.current_course,
        },
        new_value: {
            fire_mode: updatedOrder.fire_mode,
            current_course: updatedOrder.current_course,
        },
        metadata: {
            source: actorUserId ? 'merchant_dashboard' : 'device_api',
        },
    });

    return apiSuccess({ order: updatedOrder });
}
