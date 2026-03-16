import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';

const CreateTipPoolSchema = z.object({
    name: z.string().trim().min(1).max(120),
    name_am: z.string().trim().max(120).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    is_active: z.boolean().optional().default(true),
    pool_type: z.enum(['percentage', 'fixed_amount']).default('percentage'),
    pool_value: z.number().int().min(0).default(0),
    calculated_from: z.enum(['tips', 'total']).default('tips'),
    valid_from: z.string().datetime().optional().nullable(),
    valid_until: z.string().datetime().optional().nullable(),
    allocation_mode: z.enum(['shift', 'daily', 'weekly']).default('shift'),
});

const UpdateTipPoolSchema = CreateTipPoolSchema.partial();

const TipPoolShareSchema = z.object({
    role: z.enum([
        'server',
        'bartender',
        'host',
        'busser',
        'kitchen',
        'manager',
        'cook',
        'barista',
    ]),
    percentage: z.number().int().min(0).max(10000),
});

const CreateTipPoolWithSharesSchema = z.object({
    tip_pool: CreateTipPoolSchema,
    shares: z.array(TipPoolShareSchema).min(1),
});

export async function GET() {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p1' });
    if (!context.ok) {
        return context.response;
    }

    try {
        const db = context.supabase as any;

        // Get tip pools with their shares
        const { data: pools, error: poolsError } = await db
            .from('tip_pools')
            .select('*')
            .eq('restaurant_id', context.restaurantId)
            .order('created_at', { ascending: false });

        if (poolsError) {
            return apiError(
                'Failed to load tip pools',
                500,
                'TIP_POOL_FETCH_FAILED',
                poolsError.message
            );
        }

        if (!pools || pools.length === 0) {
            return apiSuccess({ tip_pools: [], shares: {} });
        }

        const poolIds = pools.map((p: any) => p.id);

        // Get shares for all pools
        const { data: shares, error: sharesError } = await db
            .from('tip_pool_shares')
            .select('*')
            .in('tip_pool_id', poolIds)
            .order('role', { ascending: true });

        if (sharesError) {
            return apiError(
                'Failed to load tip pool shares',
                500,
                'TIP_POOL_SHARES_FETCH_FAILED',
                sharesError.message
            );
        }

        // Group shares by pool
        const sharesByPool: Record<string, any[]> = {};
        (shares ?? []).forEach((share: any) => {
            if (!sharesByPool[share.tip_pool_id]) {
                sharesByPool[share.tip_pool_id] = [];
            }
            sharesByPool[share.tip_pool_id].push(share);
        });

        return apiSuccess({
            tip_pools: pools ?? [],
            shares: sharesByPool,
        });
    } catch (error) {
        return apiError(
            'Failed to load tip pools',
            500,
            'TIP_POOL_FETCH_FAILED',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p1' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, CreateTipPoolWithSharesSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const { tip_pool, shares } = parsed.data;

    // Validate shares total doesn't exceed 100%
    const totalPercentage = shares.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage > 10000) {
        return apiError('Total shares cannot exceed 100%', 400, 'TIP_POOL_SHARES_EXCEED_100');
    }

    const db = context.supabase as any;

    // Create the tip pool
    const { data: pool, error: poolError } = await db
        .from('tip_pools')
        .insert({
            restaurant_id: context.restaurantId,
            created_by: auth.user.id,
            ...tip_pool,
        })
        .select('*')
        .single();

    if (poolError || !pool) {
        return apiError(
            'Failed to create tip pool',
            500,
            'TIP_POOL_CREATE_FAILED',
            poolError?.message
        );
    }

    // Create shares
    const sharesData = shares.map(share => ({
        restaurant_id: context.restaurantId,
        tip_pool_id: pool.id,
        role: share.role,
        percentage: share.percentage,
    }));

    const { error: sharesError } = await db.from('tip_pool_shares').insert(sharesData);

    if (sharesError) {
        // Rollback pool creation
        await db.from('tip_pools').delete().eq('id', pool.id);
        return apiError(
            'Failed to create tip pool shares',
            500,
            'TIP_POOL_SHARES_CREATE_FAILED',
            sharesError.message
        );
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'tip_pool_created',
        entity_type: 'tip_pool',
        entity_id: pool.id,
        metadata: { name: pool.name, shares_count: shares.length },
    });

    return apiSuccess({ tip_pool: pool, shares }, 201);
}
