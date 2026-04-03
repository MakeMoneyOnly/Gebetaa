import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { normalizeDeviceMetadata, type DeviceManagementMetadata } from '@/lib/devices/config';
import {
    ProvisionDeviceSchema,
    buildPairingExpiry,
    generatePairingCode,
    resolveProvisionedDeviceShape,
} from '@/lib/devices/pairing';

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

    const { deviceType, deviceProfile } = resolveProvisionedDeviceShape(parsed.data);
    const pairing_code = generatePairingCode();
    const adminClient = createServiceRoleClient();
    const rawMetadata =
        parsed.data.metadata && typeof parsed.data.metadata === 'object'
            ? parsed.data.metadata
            : undefined;
    const managementMetadata: DeviceManagementMetadata = {
        ...((rawMetadata?.management as Record<string, unknown> | undefined) ?? {}),
        provider: 'esper' as const,
    };

    const { data, error } = await adminClient
        .from('hardware_devices')
        .insert({
            restaurant_id: context.restaurantId,
            name: parsed.data.name,
            location_id: parsed.data.location_id ?? null,
            device_type: deviceType,
            device_profile: deviceProfile,
            pairing_code,
            pairing_code_expires_at: buildPairingExpiry(),
            pairing_state: 'ready',
            management_provider: 'esper',
            management_status: 'pending',
            assigned_zones: parsed.data.assigned_zones ?? [],
            metadata: normalizeDeviceMetadata(
                deviceType,
                {
                    ...(rawMetadata ?? {}),
                    management: managementMetadata,
                },
                deviceProfile
            ),
        })
        .select('*')
        .single();

    if (error) {
        if (
            /device_profile|pairing_state|pairing_code_expires_at|management_provider|management_status|location_id|pairing_completed_at|hardware_fingerprint|printer_connection_type|printer_device_id|printer_device_name|printer_mac_address|fiscal_mode|column .* does not exist|schema cache/i.test(
                error.message
            )
        ) {
            return apiError(
                'Device provisioning requires the enterprise device-shell migration. Apply supabase/migrations/20260401194500_enterprise_device_shell_foundation.sql and try again.',
                500,
                'ENTERPRISE_DEVICE_MIGRATION_REQUIRED',
                error.message
            );
        }

        if (
            deviceType === 'terminal' &&
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
