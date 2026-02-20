import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseQuery } from '@/lib/api/validation';
import type { Json } from '@/types/database';

const VarianceQuerySchema = z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

type VarianceRow = {
    item_id: string;
    item_name: string;
    uom: string;
    current_stock: number;
    theoretical_stock: number;
    variance_qty: number;
    variance_value: number;
    waste_qty: number;
    waste_value: number;
    reorder_level: number;
    low_stock: boolean;
};

function resolveDateWindow(input: { start_date?: string; end_date?: string }) {
    const now = new Date();
    const end = input.end_date ? new Date(`${input.end_date}T23:59:59Z`) : now;
    const start = input.start_date
        ? new Date(`${input.start_date}T00:00:00Z`)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
    };
}

function adjustmentSignedQty(qty: number, metadata: Json) {
    const direction = typeof metadata === 'object' && metadata !== null
        ? (metadata as Record<string, unknown>).adjustment_direction
        : undefined;
    return direction === 'decrease' ? -qty : qty;
}

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = parseQuery(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
        VarianceQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const { startAt, endAt } = resolveDateWindow(parsed.data);

    const db = context.supabase;

    const [itemsResult, movementsResult] = await Promise.all([
        db
            .from('inventory_items')
            .select('id, name, uom, current_stock, reorder_level, cost_per_unit')
            .eq('restaurant_id', context.restaurantId)
            .order('name', { ascending: true })
            .limit(parsed.data.limit),
        db
            .from('stock_movements')
            .select('inventory_item_id, movement_type, qty, metadata, created_at')
            .eq('restaurant_id', context.restaurantId)
            .gte('created_at', startAt)
            .lte('created_at', endAt),
    ]);

    if (itemsResult.error) {
        return apiError('Failed to fetch inventory items', 500, 'INVENTORY_ITEMS_FETCH_FAILED', itemsResult.error.message);
    }
    if (movementsResult.error) {
        return apiError('Failed to fetch stock movements', 500, 'STOCK_MOVEMENTS_FETCH_FAILED', movementsResult.error.message);
    }

    const movementByItem = new Map<string, { theoretical_stock: number; waste_qty: number }>();

    for (const movement of movementsResult.data ?? []) {
        const current = movementByItem.get(movement.inventory_item_id) ?? {
            theoretical_stock: 0,
            waste_qty: 0,
        };
        const qty = Number(movement.qty ?? 0);

        if (movement.movement_type === 'in') {
            current.theoretical_stock += qty;
        } else if (movement.movement_type === 'out') {
            current.theoretical_stock -= qty;
        } else if (movement.movement_type === 'waste') {
            current.theoretical_stock -= qty;
            current.waste_qty += qty;
        } else if (movement.movement_type === 'adjustment') {
            current.theoretical_stock += adjustmentSignedQty(qty, movement.metadata as Json);
        }

        movementByItem.set(movement.inventory_item_id, current);
    }

    const rows: VarianceRow[] = ((itemsResult.data ?? []) as Array<Record<string, unknown>>).map((item) => {
        const itemId = String(item.id ?? '');
        const rollup = movementByItem.get(itemId) ?? { theoretical_stock: 0, waste_qty: 0 };
        const actual = Number(item.current_stock ?? 0);
        const theoretical = Number(rollup.theoretical_stock.toFixed(3));
        const variance_qty = Number((actual - theoretical).toFixed(3));
        const waste_qty = Number(rollup.waste_qty.toFixed(3));
        const cost = Number(item.cost_per_unit ?? 0);

        return {
            item_id: itemId,
            item_name: String(item.name ?? ''),
            uom: String(item.uom ?? 'unit'),
            current_stock: actual,
            theoretical_stock: theoretical,
            variance_qty,
            variance_value: Number((variance_qty * cost).toFixed(2)),
            waste_qty,
            waste_value: Number((waste_qty * cost).toFixed(2)),
            reorder_level: Number(item.reorder_level ?? 0),
            low_stock: actual <= Number(item.reorder_level ?? 0),
        };
    });

    const totals = rows.reduce(
        (acc, row) => {
            acc.items += 1;
            if (row.low_stock) acc.low_stock_items += 1;
            acc.total_waste_value += row.waste_value;
            acc.total_variance_value += row.variance_value;
            return acc;
        },
        {
            items: 0,
            low_stock_items: 0,
            total_waste_value: 0,
            total_variance_value: 0,
        } as {
            items: number;
            low_stock_items: number;
            total_waste_value: number;
            total_variance_value: number;
        }
    );

    return apiSuccess({
        window: {
            start_at: startAt,
            end_at: endAt,
        },
        rows,
        totals: {
            ...totals,
            total_waste_value: Number(totals.total_waste_value.toFixed(2)),
            total_variance_value: Number(totals.total_variance_value.toFixed(2)),
        },
    });
}
