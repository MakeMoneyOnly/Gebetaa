import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getDeviceContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';

const HeartbeatSchema = z.object({
    route: z.string().trim().max(120).optional(),
    battery_percent: z.number().min(0).max(100).optional(),
    app_mode: z.enum(['browser', 'pwa', 'dedicated']).optional(),
    visibility: z.enum(['visible', 'hidden']).optional(),
});

export async function POST(request: Request) {
    const ctx = await getDeviceContext(request);
    if (!ctx.ok) return ctx.response;

    const parsed = await parseJsonBody(request, HeartbeatSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const now = new Date().toISOString();
    const currentMetadata =
        typeof ctx.device.metadata === 'object' && ctx.device.metadata !== null
            ? (ctx.device.metadata as Record<string, unknown>)
            : {};

    const runtimeMetadata = {
        ...currentMetadata,
        runtime: {
            route: parsed.data.route ?? null,
            battery_percent: parsed.data.battery_percent ?? null,
            app_mode: parsed.data.app_mode ?? currentMetadata.managed_mode ?? null,
            visibility: parsed.data.visibility ?? null,
            last_heartbeat_at: now,
        },
    };

    const { error } = await ctx.admin
        .from('hardware_devices')
        .update({
            last_active_at: now,
            metadata: runtimeMetadata,
        })
        .eq('id', ctx.device.id)
        .eq('restaurant_id', ctx.restaurantId);

    if (error) {
        return apiError(
            'Failed to record device heartbeat',
            500,
            'DEVICE_HEARTBEAT_FAILED',
            error.message
        );
    }

    return apiSuccess({
        device_id: ctx.device.id,
        device_type: ctx.device.device_type,
        last_active_at: now,
    });
}
