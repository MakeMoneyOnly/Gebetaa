import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const InventoryItemsQuerySchema = z.object({
    query: z.string().trim().min(1).max(120).optional(),
    low_stock: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

const CreateInventoryItemSchema = z.object({
    name: z.string().trim().min(2).max(120),
    sku: z.string().trim().min(1).max(64).optional(),
    uom: z.string().trim().min(1).max(32).optional().default('unit'),
    current_stock: z.coerce.number().min(0).max(100000).optional().default(0),
    reorder_level: z.coerce.number().min(0).max(100000).optional().default(0),
    cost_per_unit: z.coerce.number().min(0).max(500000).optional().default(0),
    is_active: z.boolean().optional().default(true),
    metadata: z.record(z.string(), z.unknown()).optional(),
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

    const db = context.supabase;

    const url = new URL(request.url);
    const parsed = parseQuery(
        {
            query: url.searchParams.get('query') ?? undefined,
            low_stock: url.searchParams.get('low_stock') ?? undefined,
            limit: url.searchParams.get('limit') ?? undefined,
        },
        InventoryItemsQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    let query = db
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('name', { ascending: true })
        .limit(parsed.data.limit);

    if (parsed.data.query) {
        query = query.or(`name.ilike.%${parsed.data.query}%,sku.ilike.%${parsed.data.query}%`);
    }

    const { data, error } = await query;
    if (error) {
        return apiError(
            'Failed to fetch inventory items',
            500,
            'INVENTORY_ITEMS_FETCH_FAILED',
            error.message
        );
    }

    const items = (data ?? []) as Array<Record<string, unknown>>;
    const lowStockOnly = parsed.data.low_stock === 'true';
    const filtered = lowStockOnly
        ? items.filter(item => Number(item.current_stock ?? 0) <= Number(item.reorder_level ?? 0))
        : items;

    const low_stock_count = items.filter(
        item => Number(item.current_stock ?? 0) <= Number(item.reorder_level ?? 0)
    ).length;

    return apiSuccess({
        items: filtered,
        low_stock_count,
        total: filtered.length,
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

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, CreateInventoryItemSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    const { data: item, error } = await db
        .from('inventory_items')
        .insert({
            restaurant_id: context.restaurantId,
            name: parsed.data.name,
            sku: parsed.data.sku?.trim() || null,
            uom: parsed.data.uom,
            current_stock: Number(parsed.data.current_stock.toFixed(3)),
            reorder_level: Number(parsed.data.reorder_level.toFixed(3)),
            cost_per_unit: Number(parsed.data.cost_per_unit.toFixed(2)),
            is_active: parsed.data.is_active,
            metadata: (parsed.data.metadata ?? {}) as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (error) {
        return apiError(
            'Failed to create inventory item',
            500,
            'INVENTORY_ITEM_CREATE_FAILED',
            error.message
        );
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'inventory_item_created',
        entity_type: 'inventory_item',
        entity_id: item.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            name: item.name,
            sku: item.sku,
            current_stock: item.current_stock,
            reorder_level: item.reorder_level,
            cost_per_unit: item.cost_per_unit,
        },
    });

    return apiSuccess({ item, idempotency_key: idempotencyKey }, 201);
}
