import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
    HardwareDeviceMetadataSchema,
    HardwareDeviceTypeSchema,
    normalizeDeviceMetadata,
} from '@/lib/devices/config';

const ProvisionDeviceSchema = z.object({
    name: z.string().trim().min(2).max(120),
    device_type: HardwareDeviceTypeSchema,
    assigned_zones: z.array(z.string()).optional(),
    metadata: HardwareDeviceMetadataSchema.optional(),
});

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, ProvisionDeviceSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    // Generate a 4-digit random code
    const pairing_code = Math.floor(1000 + Math.random() * 9000).toString();
    const adminClient = createServiceRoleClient();

    const { data, error } = await (adminClient as any)
        .from('hardware_devices')
        .insert({
            restaurant_id: context.restaurantId,
            name: parsed.data.name,
            device_type: parsed.data.device_type,
            pairing_code,
            assigned_zones: parsed.data.assigned_zones ?? [],
            metadata: normalizeDeviceMetadata(parsed.data.device_type, parsed.data.metadata),
        })
        .select('*')
        .single();

    if (error) {
        if (
            parsed.data.device_type === 'terminal' &&
            /device_type|hardware_devices_device_type_check|violates check constraint/i.test(
                error.message
            )
        ) {
            return apiError(
                'Terminal provisioning requires the latest database migration. Apply the new hardware device migration and try again.',
                500,
                'TERMINAL_DEVICE_MIGRATION_REQUIRED',
                error.message
            );
        }

        return apiError(
            'Failed to provision device',
            500,
            'DEVICE_PROVISION_FAILED',
            error.message
        );
    }

    return apiSuccess(
        {
            device: data,
        },
        201
    );
}
