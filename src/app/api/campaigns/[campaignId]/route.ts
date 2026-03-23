import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';

const UpdateCampaignSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    channel: z.enum(['sms', 'email', 'whatsapp']).optional(),
    target_segment_id: z.string().uuid().optional().nullable(),
    content: z.string().optional(),
    status: z.enum(['draft', 'scheduled', 'running', 'completed', 'archived']).optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    const { campaignId } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) return context.response;

    const parsed = await parseJsonBody(request, UpdateCampaignSchema);
    if (!parsed.success) return parsed.response;

    const db = context.supabase as any;

    const { data: campaign, error: fetchError } = await db
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('restaurant_id', context.restaurantId)
        .single();

    if (fetchError || !campaign) {
        return apiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    const { data, error } = await db
        .from('campaigns')
        .update({
            ...parsed.data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to update campaign', 500, 'CAMPAIGN_UPDATE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'campaign_updated',
        entity_type: 'campaign',
        entity_id: campaignId,
        old_value: campaign,
        new_value: data,
        metadata: { source: 'merchant_dashboard' },
    });

    return apiSuccess({ campaign: data });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    const { campaignId } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) return context.response;

    const db = context.supabase as any;

    const { error } = await db
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('restaurant_id', context.restaurantId);

    if (error) {
        return apiError('Failed to delete campaign', 500, 'CAMPAIGN_DELETE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'campaign_deleted',
        entity_type: 'campaign',
        entity_id: campaignId,
        metadata: { source: 'merchant_dashboard' },
    });

    return apiSuccess({ deleted: true });
}
