import { randomUUID } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';

const ProvisionDeviceSchema = z.object({
    name: z.string().trim().min(2).max(120),
    device_type: z.enum(['pos', 'kds', 'kiosk', 'digital_menu']),
    assigned_zones: z.array(z.string()).optional(),
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

    const { data, error } = await (context.supabase as any)
        .from('hardware_devices')
        .insert({
            restaurant_id: context.restaurantId,
            name: parsed.data.name,
            device_type: parsed.data.device_type,
            pairing_code,
            assigned_zones: parsed.data.assigned_zones ?? [],
        })
        .select('*')
        .single();

    if (error) {
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
