import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { writeAuditLog } from '@/lib/api/audit';
import { dispatchEsperDeviceAction } from '@/lib/integrations/esper';

const DeviceManagementActionSchema = z.object({
    action: z.enum(['reboot', 'wipe', 'push_update']),
    package_name: z.string().trim().max(200).optional(),
    app_version: z.string().trim().max(40).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deviceId: string }> }
) {
    const { deviceId } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, DeviceManagementActionSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const admin = createServiceRoleClient();
    const { data: device, error: deviceError } = await admin
        .from('hardware_devices')
        .select(
            'id, restaurant_id, name, management_provider, management_device_id, device_profile, device_type'
        )
        .eq('id', deviceId)
        .eq('restaurant_id', context.restaurantId)
        .maybeSingle();

    if (deviceError || !device) {
        return apiError('Device not found', 404, 'DEVICE_NOT_FOUND', deviceError?.message);
    }

    if (device.management_provider !== 'esper' || !device.management_device_id) {
        return apiError(
            'This device is not fully configured for Esper remote actions',
            409,
            'DEVICE_NOT_MANAGED'
        );
    }

    const { data: queuedAction, error: queueError } = await admin
        .from('device_management_actions')
        .insert({
            restaurant_id: context.restaurantId,
            hardware_device_id: device.id,
            requested_by: auth.user.id,
            provider: 'esper',
            action_type: parsed.data.action,
            status: 'queued',
            request_payload: {
                package_name: parsed.data.package_name ?? null,
                app_version: parsed.data.app_version ?? null,
            },
        })
        .select('id')
        .single();

    if (queueError || !queuedAction) {
        return apiError(
            'Failed to queue device action',
            500,
            'DEVICE_ACTION_QUEUE_FAILED',
            queueError?.message
        );
    }

    try {
        const result = await dispatchEsperDeviceAction({
            managementDeviceId: device.management_device_id,
            action: parsed.data.action,
            packageName: parsed.data.package_name,
            appVersion: parsed.data.app_version,
        });

        await admin
            .from('device_management_actions')
            .update({
                status: 'dispatched',
                provider_job_id: result.commandId ?? null,
                response_payload: result.raw ?? {},
            })
            .eq('id', queuedAction.id);

        await writeAuditLog(admin, {
            restaurant_id: context.restaurantId,
            user_id: auth.user.id,
            action: 'device_management_action_dispatched',
            entity_type: 'hardware_devices',
            entity_id: device.id,
            metadata: {
                action: parsed.data.action,
                provider: 'esper',
                provider_job_id: result.commandId ?? null,
            },
        });

        return apiSuccess({
            action_id: queuedAction.id,
            provider_job_id: result.commandId ?? null,
            status: 'dispatched',
        });
    } catch (error) {
        await admin
            .from('device_management_actions')
            .update({
                status: 'failed',
                response_payload: {
                    error: error instanceof Error ? error.message : 'dispatch_failed',
                },
                completed_at: new Date().toISOString(),
            })
            .eq('id', queuedAction.id);

        return apiError(
            'Failed to dispatch remote device action',
            502,
            'DEVICE_ACTION_DISPATCH_FAILED',
            error instanceof Error ? error.message : undefined
        );
    }
}
