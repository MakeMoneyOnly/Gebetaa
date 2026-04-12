import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getDeviceContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import {
    isEnterpriseDeviceSchemaError,
    mergeEnterpriseShellMetadata,
} from '@/lib/devices/schema-compat';
import { resolveOtaStatus } from '@/lib/devices/ota';

const HeartbeatSchema = z.object({
    route: z.string().trim().max(120).optional(),
    battery_percent: z.number().min(0).max(100).optional(),
    app_mode: z.enum(['browser', 'pwa', 'dedicated']).optional(),
    visibility: z.enum(['visible', 'hidden']).optional(),
    native_platform: z.string().trim().max(40).optional(),
    native_version: z.string().trim().max(40).optional(),
    device_uuid: z.string().trim().min(8).max(120).optional(),
    printer: z
        .object({
            connection_type: z.enum(['bluetooth', 'usb', 'network', 'none']).optional(),
            device_id: z.string().trim().max(120).optional(),
            device_name: z.string().trim().max(120).optional(),
            mac_address: z.string().trim().max(64).optional(),
        })
        .optional(),
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
            native_platform: parsed.data.native_platform ?? null,
            native_version: parsed.data.native_version ?? null,
            last_heartbeat_at: now,
        },
    };

    const nextMetadata = parsed.data.printer
        ? {
              ...runtimeMetadata,
              printer: {
                  ...(typeof currentMetadata.printer === 'object' &&
                  currentMetadata.printer !== null
                      ? (currentMetadata.printer as Record<string, unknown>)
                      : {}),
                  ...parsed.data.printer,
                  auto_connect: true,
                  last_selected_at: now,
              },
          }
        : runtimeMetadata;
    const currentManagement =
        typeof currentMetadata.management === 'object' && currentMetadata.management !== null
            ? (currentMetadata.management as Record<string, unknown>)
            : {};
    const appVersion = parsed.data.native_version ?? null;
    const targetAppVersion =
        typeof currentManagement.target_app_version === 'string'
            ? currentManagement.target_app_version
            : (ctx.device.target_app_version ?? null);
    const otaStatus = resolveOtaStatus({
        currentVersion: appVersion,
        targetVersion: targetAppVersion,
        existingStatus:
            (ctx.device.ota_status as
                | 'current'
                | 'queued'
                | 'installing'
                | 'failed'
                | 'outdated'
                | null
                | undefined) ??
            (typeof currentManagement.ota_status === 'string'
                ? (currentManagement.ota_status as
                      | 'current'
                      | 'queued'
                      | 'installing'
                      | 'failed'
                      | 'outdated')
                : null),
    });
    const persistedMetadata = {
        ...nextMetadata,
        management: {
            ...currentManagement,
            ota_status: otaStatus,
            app_channel:
                typeof currentManagement.app_channel === 'string'
                    ? currentManagement.app_channel
                    : 'stable',
            target_app_version: targetAppVersion,
            ota_completed_at: otaStatus === 'current' && targetAppVersion ? now : null,
            ota_error: otaStatus === 'failed' ? (currentManagement.ota_error ?? null) : null,
        },
    };

    let { error } = await ctx.admin
        .from('hardware_devices')
        .update({
            last_active_at: now,
            last_boot_at: now,
            hardware_fingerprint: parsed.data.device_uuid ?? null,
            app_version: appVersion,
            ota_status: otaStatus,
            ota_completed_at: otaStatus === 'current' && targetAppVersion ? now : null,
            metadata: persistedMetadata,
        })
        .eq('id', ctx.device.id)
        .eq('restaurant_id', ctx.restaurantId);

    if (error && isEnterpriseDeviceSchemaError(error.message)) {
        const legacyMetadata = mergeEnterpriseShellMetadata(persistedMetadata, {
            device_profile: ctx.device.device_profile,
            location_id: ctx.device.location_id ?? null,
            pairing_state: ctx.device.pairing_state,
            management_provider: ctx.device.management_provider,
            management_device_id: ctx.device.management_device_id ?? null,
            hardware_fingerprint: parsed.data.device_uuid ?? null,
        });

        const legacyResult = await ctx.admin
            .from('hardware_devices')
            .update({
                last_active_at: now,
                metadata: legacyMetadata,
            })
            .eq('id', ctx.device.id)
            .eq('restaurant_id', ctx.restaurantId);

        error = legacyResult.error;
    }

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
