import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { writeAuditLog } from '@/lib/api/audit';

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ deviceId: string }> }
) {
    const { deviceId } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) return context.response;

    // Verify the device belongs to this restaurant before deleting
    const { data: device, error: fetchError } = await (context.supabase as any)
        .from('hardware_devices')
        .select('id, name, device_type')
        .eq('id', deviceId)
        .eq('restaurant_id', context.restaurantId)
        .single();

    if (fetchError || !device) {
        return apiError('Device not found or access denied', 404, 'DEVICE_NOT_FOUND');
    }

    const { error: deleteError } = await (context.supabase as any)
        .from('hardware_devices')
        .delete()
        .eq('id', deviceId)
        .eq('restaurant_id', context.restaurantId);

    if (deleteError) {
        return apiError('Failed to delete device', 500, 'DEVICE_DELETE_FAILED', deleteError.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'device_deleted',
        entity_type: 'hardware_devices',
        entity_id: deviceId,
        metadata: { name: device.name, device_type: device.device_type },
    });

    return apiSuccess({ deleted: true });
}
