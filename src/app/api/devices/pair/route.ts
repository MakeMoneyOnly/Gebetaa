import { randomUUID } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { parseJsonBody } from '@/lib/api/validation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const PairDeviceSchema = z.object({
    pairing_code: z.string().length(4),
});

export async function POST(request: Request) {
    const parsed = await parseJsonBody(request, PairDeviceSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const adminClient = createServiceRoleClient();

    // Find the device
    const { data: device, error } = await adminClient
        .from('hardware_devices')
        .select('*')
        .eq('pairing_code', parsed.data.pairing_code)
        .in('status', ['active', 'pending'])
        .single();

    if (error || !device) {
        return apiError('Invalid or expired pairing code', 400, 'INVALID_PAIRING_CODE');
    }

    // Generate a long-lived device token
    const device_token = randomUUID();

    // Update the device
    const { error: updateError } = await adminClient
        .from('hardware_devices')
        .update({
            // pairing_code: null, // Keep the code so it is visible in the cards
            device_token,
            paired_at: new Date().toISOString(),
        })
        .eq('id', device.id);

    if (updateError) {
        return apiError('Failed to pair device', 500, 'DEVICE_PAIR_FAILED', updateError.message);
    }

    return apiSuccess(
        {
            device_token,
            restaurant_id: device.restaurant_id,
            device_type: device.device_type,
            name: device.name,
            assigned_zones: device.assigned_zones,
        },
        200
    );
}
