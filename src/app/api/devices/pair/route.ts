import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import {
    HardwareDeviceTypeSchema,
    DeviceProfileSchema,
    normalizeDeviceMetadata,
} from '@/lib/devices/config';
import {
    PairDeviceSchema,
    generateDeviceToken,
    getDeviceBootPathFromRecord,
    normalizePairingCode,
} from '@/lib/devices/pairing';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: Request) {
    const parsed = await parseJsonBody(request, PairDeviceSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const code = normalizePairingCode(parsed.data.code ?? parsed.data.pairing_code ?? '');
    if (code.length < 4) {
        return apiError('Invalid pairing code', 400, 'INVALID_PAIRING_CODE');
    }

    const adminClient = createServiceRoleClient();
    const { data: device, error } = await adminClient
        .from('hardware_devices')
        .select(
            'id, restaurant_id, location_id, device_type, device_profile, name, assigned_zones, metadata, pairing_state, pairing_code_expires_at'
        )
        .eq('pairing_code', code)
        .in('pairing_state', ['ready', 'paired'])
        .maybeSingle();

    if (error || !device) {
        return apiError('Invalid or expired pairing code', 400, 'INVALID_PAIRING_CODE');
    }

    if (
        device.pairing_code_expires_at &&
        new Date(device.pairing_code_expires_at).getTime() < Date.now()
    ) {
        await adminClient
            .from('hardware_devices')
            .update({ pairing_state: 'expired' })
            .eq('id', device.id);
        return apiError('Pairing code has expired', 410, 'PAIRING_CODE_EXPIRED');
    }

    const { data: restaurant } = await adminClient
        .from('restaurants')
        .select('slug')
        .eq('id', device.restaurant_id)
        .maybeSingle();

    const device_token = generateDeviceToken();
    const now = new Date().toISOString();
    const rawMetadata =
        typeof device.metadata === 'object' && device.metadata !== null
            ? (device.metadata as Record<string, unknown>)
            : {};
    const resolvedDeviceType = HardwareDeviceTypeSchema.safeParse(device.device_type).success
        ? device.device_type
        : 'pos';
    const resolvedProfile = DeviceProfileSchema.safeParse(device.device_profile).success
        ? device.device_profile
        : null;
    const normalizedMetadata = normalizeDeviceMetadata(
        resolvedDeviceType,
        {
            ...rawMetadata,
            runtime: {
                ...((rawMetadata.runtime as Record<string, unknown> | undefined) ?? {}),
                native_platform: parsed.data.platform ?? null,
                native_version: parsed.data.app_version ?? null,
                last_heartbeat_at: now,
            },
            printer: parsed.data.printer
                ? {
                      ...((rawMetadata.printer as Record<string, unknown> | undefined) ?? {}),
                      ...parsed.data.printer,
                      auto_connect: true,
                      last_selected_at: now,
                  }
                : (rawMetadata.printer as Record<string, unknown> | undefined),
        },
        resolvedProfile
    );

    const { error: updateError } = await adminClient
        .from('hardware_devices')
        .update({
            device_token,
            pairing_state: 'paired',
            paired_at: now,
            pairing_completed_at: now,
            last_active_at: now,
            hardware_fingerprint: parsed.data.device_uuid ?? null,
            app_version: parsed.data.app_version ?? null,
            printer_connection_type: parsed.data.printer?.connection_type ?? null,
            printer_device_id: parsed.data.printer?.device_id ?? null,
            printer_device_name: parsed.data.printer?.device_name ?? null,
            printer_mac_address: parsed.data.printer?.mac_address ?? null,
            metadata: normalizedMetadata,
        })
        .eq('id', device.id);

    if (updateError) {
        return apiError('Failed to pair device', 500, 'DEVICE_PAIR_FAILED', updateError.message);
    }

    const boot_path = getDeviceBootPathFromRecord({
        device_profile: device.device_profile,
        device_type: device.device_type,
        restaurant_slug: restaurant?.slug ?? null,
    });

    return apiSuccess(
        {
            device_token,
            restaurant_id: device.restaurant_id,
            location_id: device.location_id ?? null,
            device_type: device.device_type,
            device_profile: device.device_profile,
            name: device.name,
            assigned_zones: device.assigned_zones,
            metadata: normalizedMetadata,
            boot_path,
            restaurant_slug: restaurant?.slug ?? null,
        },
        200
    );
}
