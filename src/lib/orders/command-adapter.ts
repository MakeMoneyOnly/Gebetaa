import {
    getPowerSync,
    updateOfflineOrderCourseFire,
    updateOfflineOrderStatus,
    type OfflineOrderStatus,
} from '@/lib/sync';

export type SubmitOrderCommandMode = 'local' | 'api';
type OrderCourse = 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';

export interface SubmitOrderStatusInput {
    orderId: string;
    status: OfflineOrderStatus;
}

export interface SubmitOrderCourseFireInput {
    orderId: string;
    fireMode?: 'auto' | 'manual';
    currentCourse?: OrderCourse;
}

export interface SubmitOrderCommandResult {
    ok: boolean;
    mode?: SubmitOrderCommandMode;
    error?: string;
}

function hasLocalRuntime(): boolean {
    return getPowerSync() !== null;
}

export async function submitOrderStatusUpdate(
    input: SubmitOrderStatusInput
): Promise<SubmitOrderCommandResult> {
    if (hasLocalRuntime()) {
        const updated = await updateOfflineOrderStatus(input.orderId, input.status);
        if (updated) {
            return { ok: true, mode: 'local' };
        }
    }

    try {
        const response = await fetch(`/api/orders/${input.orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: input.status }),
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            return {
                ok: false,
                error: payload.error ?? 'Failed to update order status',
            };
        }

        return { ok: true, mode: 'api' };
    } catch {
        return { ok: false, error: 'Failed to update order status' };
    }
}

export async function submitOrderCourseFireUpdate(
    input: SubmitOrderCourseFireInput
): Promise<SubmitOrderCommandResult> {
    if (hasLocalRuntime()) {
        const updated = await updateOfflineOrderCourseFire(input.orderId, {
            fire_mode: input.fireMode,
            current_course: input.currentCourse,
        });
        if (updated) {
            return { ok: true, mode: 'local' };
        }
    }

    try {
        const response = await fetch(`/api/orders/${input.orderId}/course-fire`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fire_mode: input.fireMode,
                current_course: input.currentCourse,
            }),
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            return {
                ok: false,
                error: payload.error ?? 'Failed to advance course',
            };
        }

        return { ok: true, mode: 'api' };
    } catch {
        return { ok: false, error: 'Failed to advance course' };
    }
}
