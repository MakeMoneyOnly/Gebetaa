import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import { isSchemaNotReadyError } from '@/lib/api/schemaFallback';
import type { Json } from '@/types/database';

const CampaignsQuerySchema = z.object({
    status: z.enum(['draft', 'scheduled', 'running', 'completed', 'cancelled']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

const CreateCampaignSchema = z.object({
    name: z.string().trim().min(2).max(140),
    channel: z.enum(['sms', 'email', 'whatsapp', 'in_app']),
    segment_id: z.string().uuid().optional(),
    template_json: z.record(z.string(), z.unknown()).optional(),
    scheduled_at: z.string().datetime().optional(),
});

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const db = context.supabase as any;

    const url = new URL(request.url);
    const parsed = parseQuery(
        {
            status: url.searchParams.get('status') ?? undefined,
            limit: url.searchParams.get('limit') ?? undefined,
        },
        CampaignsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    let campaignQuery = db
        .from('campaigns' as any)
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);

    if (parsed.data.status) {
        campaignQuery = campaignQuery.eq('status', parsed.data.status);
    }

    const [{ data: campaigns, error: campaignError }, { data: segments, error: segmentError }] =
        await Promise.all([
            campaignQuery,
            db
                .from('segments' as any)
                .select('id, name, rule_json, created_at')
                .eq('restaurant_id', context.restaurantId)
                .order('created_at', { ascending: false }),
        ]);

    if (campaignError) {
        if (isSchemaNotReadyError(campaignError)) {
            return apiSuccess({ campaigns: [], segments: [] });
        }
        return apiError(
            'Failed to fetch campaigns',
            500,
            'CAMPAIGNS_FETCH_FAILED',
            campaignError.message
        );
    }
    if (segmentError) {
        if (isSchemaNotReadyError(segmentError)) {
            return apiSuccess({ campaigns: [], segments: [] });
        }
        return apiError(
            'Failed to fetch segments',
            500,
            'SEGMENTS_FETCH_FAILED',
            segmentError.message
        );
    }

    const campaignIds = (campaigns ?? []).map((item: any) => item.id);
    const deliveriesByCampaign = new Map<
        string,
        {
            total: number;
            sent: number;
            opened: number;
            clicked: number;
            converted: number;
            failed: number;
        }
    >();

    if (campaignIds.length > 0) {
        const { data: deliveries, error: deliveryError } = await db
            .from('campaign_deliveries' as any)
            .select('campaign_id, status, conversion_order_id')
            .in('campaign_id', campaignIds);

        if (deliveryError) {
            if (isSchemaNotReadyError(deliveryError)) {
                return apiSuccess({
                    campaigns: (campaigns ?? []).map((campaign: any) => ({
                        ...campaign,
                        tracking: {
                            total: 0,
                            sent: 0,
                            opened: 0,
                            clicked: 0,
                            converted: 0,
                            failed: 0,
                        },
                    })),
                    segments: segments ?? [],
                });
            }
            return apiError(
                'Failed to fetch campaign tracking',
                500,
                'CAMPAIGN_TRACKING_FETCH_FAILED',
                deliveryError.message
            );
        }

        for (const delivery of deliveries ?? []) {
            const current = deliveriesByCampaign.get(delivery.campaign_id) ?? {
                total: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                converted: 0,
                failed: 0,
            };
            current.total += 1;
            if (delivery.status === 'sent') current.sent += 1;
            if (delivery.status === 'opened') current.opened += 1;
            if (delivery.status === 'clicked') current.clicked += 1;
            if (delivery.status === 'converted' || Boolean(delivery.conversion_order_id))
                current.converted += 1;
            if (delivery.status === 'failed') current.failed += 1;
            deliveriesByCampaign.set(delivery.campaign_id, current);
        }
    }

    return apiSuccess({
        campaigns: (campaigns ?? []).map((campaign: any) => ({
            ...campaign,
            tracking: deliveriesByCampaign.get(campaign.id) ?? {
                total: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                converted: 0,
                failed: 0,
            },
        })),
        segments: segments ?? [],
    });
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const db = context.supabase as any;

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, CreateCampaignSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    if (parsed.data.segment_id) {
        const { data: segment, error: segmentError } = await db
            .from('segments' as any)
            .select('id')
            .eq('id', parsed.data.segment_id)
            .eq('restaurant_id', context.restaurantId)
            .maybeSingle();

        if (segmentError) {
            return apiError(
                'Failed to validate segment',
                500,
                'SEGMENT_VALIDATION_FAILED',
                segmentError.message
            );
        }
        if (!segment) {
            return apiError('Segment not found', 404, 'SEGMENT_NOT_FOUND');
        }
    }

    const hasSchedule = Boolean(parsed.data.scheduled_at);

    const { data, error } = await db
        .from('campaigns' as any)
        .insert({
            restaurant_id: context.restaurantId,
            channel: parsed.data.channel,
            name: parsed.data.name,
            segment_id: parsed.data.segment_id ?? null,
            template_json: (parsed.data.template_json ?? {}) as Json,
            status: hasSchedule ? 'scheduled' : 'draft',
            scheduled_at: parsed.data.scheduled_at ?? null,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create campaign', 500, 'CAMPAIGN_CREATE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'campaign_created',
        entity_type: 'campaign',
        entity_id: data.id,
        new_value: {
            name: data.name,
            channel: data.channel,
            status: data.status,
            segment_id: data.segment_id,
        },
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
    });

    return apiSuccess({ campaign: data, idempotency_key: idempotencyKey }, 201);
}
