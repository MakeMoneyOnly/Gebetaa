import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';
import type { Json } from '@/types/database';

const CreateStockMovementSchema = z.object({
    inventory_item_id: z.string().uuid(),
    movement_type: z.enum(['in', 'out', 'adjustment', 'waste', 'count']),
    qty: z.coerce.number().positive().max(100000),
    adjustment_direction: z.enum(['increase', 'decrease']).optional(),
    unit_cost: z.coerce.number().min(0).max(500000).optional(),
    reason: z.string().trim().min(2).max(280).optional(),
    reference_type: z
        .enum(['manual', 'order', 'purchase_order', 'invoice', 'waste_audit', 'stock_count'])
        .optional()
        .default('manual'),
    reference_id: z.string().uuid().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

function resolveNextStock(
    currentStock: number,
    payload: z.infer<typeof CreateStockMovementSchema>
) {
    if (payload.movement_type === 'count') {
        return Number(payload.qty.toFixed(3));
    }

    if (payload.movement_type === 'in') {
        return Number((currentStock + payload.qty).toFixed(3));
    }

    if (payload.movement_type === 'adjustment') {
        const direction = payload.adjustment_direction ?? 'increase';
        return direction === 'decrease'
            ? Number((currentStock - payload.qty).toFixed(3))
            : Number((currentStock + payload.qty).toFixed(3));
    }

    return Number((currentStock - payload.qty).toFixed(3));
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

    const parsed = await parseJsonBody(request, CreateStockMovementSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    const { data: item, error: itemError } = await db
        .from('inventory_items')
        .select('id, name, current_stock, cost_per_unit')
        .eq('restaurant_id', context.restaurantId)
        .eq('id', parsed.data.inventory_item_id)
        .maybeSingle();

    if (itemError) {
        return apiError(
            'Failed to load inventory item',
            500,
            'INVENTORY_ITEM_FETCH_FAILED',
            itemError.message
        );
    }
    if (!item) {
        return apiError('Inventory item not found', 404, 'INVENTORY_ITEM_NOT_FOUND');
    }

    const currentStock = Number(item.current_stock ?? 0);
    const nextStock = resolveNextStock(currentStock, parsed.data);

    if (!Number.isFinite(nextStock) || nextStock < 0) {
        return apiError('Stock movement would result in negative stock', 409, 'INSUFFICIENT_STOCK');
    }

    const movementMetadata = {
        ...(parsed.data.metadata ?? {}),
        ...(parsed.data.movement_type === 'adjustment' && parsed.data.adjustment_direction
            ? { adjustment_direction: parsed.data.adjustment_direction }
            : {}),
    };

    const { data: movement, error: movementError } = await db
        .from('stock_movements')
        .insert({
            restaurant_id: context.restaurantId,
            inventory_item_id: parsed.data.inventory_item_id,
            movement_type: parsed.data.movement_type,
            qty: Number(parsed.data.qty.toFixed(3)),
            unit_cost:
                parsed.data.unit_cost !== undefined
                    ? Number(parsed.data.unit_cost.toFixed(2))
                    : null,
            reason: parsed.data.reason ?? null,
            reference_type: parsed.data.reference_type,
            reference_id: parsed.data.reference_id ?? null,
            metadata: movementMetadata as Json,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (movementError) {
        return apiError(
            'Failed to create stock movement',
            500,
            'STOCK_MOVEMENT_CREATE_FAILED',
            movementError.message
        );
    }

    const inventoryPatch: Record<string, unknown> = {
        current_stock: nextStock,
    };

    if (
        parsed.data.unit_cost !== undefined &&
        parsed.data.movement_type !== 'out' &&
        parsed.data.movement_type !== 'waste'
    ) {
        inventoryPatch.cost_per_unit = Number(parsed.data.unit_cost.toFixed(2));
    }

    const { data: updatedItem, error: updateError } = await db
        .from('inventory_items')
        .update(inventoryPatch)
        .eq('restaurant_id', context.restaurantId)
        .eq('id', parsed.data.inventory_item_id)
        .select('*')
        .single();

    if (updateError) {
        return apiError(
            'Failed to update inventory stock',
            500,
            'INVENTORY_STOCK_UPDATE_FAILED',
            updateError.message
        );
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'stock_movement_created',
        entity_type: 'stock_movement',
        entity_id: movement.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            inventory_item_id: parsed.data.inventory_item_id,
            movement_type: parsed.data.movement_type,
            qty: parsed.data.qty,
            previous_stock: currentStock,
            next_stock: nextStock,
        },
    });

    return apiSuccess(
        {
            movement,
            item: updatedItem,
            idempotency_key: idempotencyKey,
        },
        201
    );
}
