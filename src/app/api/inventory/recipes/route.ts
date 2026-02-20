import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';
import { isIdempotencyKeyValid, resolveIdempotencyKey } from '@/lib/api/idempotency';

const RecipeIngredientSchema = z.object({
    inventory_item_id: z.string().uuid(),
    qty_per_recipe: z.coerce.number().positive().max(100000),
    uom: z.string().trim().min(1).max(32).optional().default('unit'),
    waste_pct: z.coerce.number().min(0).max(100).optional().default(0),
});

const CreateRecipeSchema = z.object({
    menu_item_id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(140),
    output_qty: z.coerce.number().positive().max(100000).optional().default(1),
    output_uom: z.string().trim().min(1).max(32).optional().default('portion'),
    ingredients: z.array(RecipeIngredientSchema).min(1).max(60),
});

export async function GET() {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const db = context.supabase;

    const [recipesResult, inventoryResult] = await Promise.all([
        db
            .from('recipes')
            .select(`
                id,
                menu_item_id,
                name,
                output_qty,
                output_uom,
                is_active,
                created_at,
                ingredients:recipe_ingredients(
                    id,
                    inventory_item_id,
                    qty_per_recipe,
                    uom,
                    waste_pct
                )
            `)
            .eq('restaurant_id', context.restaurantId)
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
        db
            .from('inventory_items')
            .select('id, name, uom, current_stock')
            .eq('restaurant_id', context.restaurantId)
            .eq('is_active', true)
            .order('name', { ascending: true }),
    ]);

    if (recipesResult.error) {
        return apiError('Failed to fetch recipes', 500, 'RECIPES_FETCH_FAILED', recipesResult.error.message);
    }
    if (inventoryResult.error) {
        return apiError('Failed to fetch inventory items', 500, 'INVENTORY_ITEMS_FETCH_FAILED', inventoryResult.error.message);
    }

    return apiSuccess({
        recipes: recipesResult.data ?? [],
        inventory_items: inventoryResult.data ?? [],
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

    const db = context.supabase;

    const explicitIdempotencyKey = request.headers.get('x-idempotency-key');
    if (explicitIdempotencyKey && !isIdempotencyKeyValid(explicitIdempotencyKey)) {
        return apiError('Invalid idempotency key', 400, 'INVALID_IDEMPOTENCY_KEY');
    }
    const idempotencyKey = resolveIdempotencyKey(explicitIdempotencyKey);

    const parsed = await parseJsonBody(request, CreateRecipeSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const itemIds = Array.from(new Set(parsed.data.ingredients.map((item) => item.inventory_item_id)));
    const { data: inventoryItems, error: inventoryError } = await db
        .from('inventory_items')
        .select('id')
        .eq('restaurant_id', context.restaurantId)
        .in('id', itemIds);

    if (inventoryError) {
        return apiError('Failed to validate ingredients', 500, 'INGREDIENT_VALIDATION_FAILED', inventoryError.message);
    }
    if ((inventoryItems ?? []).length !== itemIds.length) {
        return apiError('One or more inventory items are invalid', 400, 'INVALID_INGREDIENT_ITEM');
    }

    const { data: recipe, error: recipeError } = await db
        .from('recipes')
        .insert({
            restaurant_id: context.restaurantId,
            menu_item_id: parsed.data.menu_item_id ?? null,
            name: parsed.data.name,
            output_qty: Number(parsed.data.output_qty.toFixed(3)),
            output_uom: parsed.data.output_uom,
            created_by: auth.user.id,
        })
        .select('*')
        .single();

    if (recipeError) {
        return apiError('Failed to create recipe', 500, 'RECIPE_CREATE_FAILED', recipeError.message);
    }

    const ingredientRows = parsed.data.ingredients.map((ingredient) => ({
        restaurant_id: context.restaurantId,
        recipe_id: recipe.id,
        inventory_item_id: ingredient.inventory_item_id,
        qty_per_recipe: Number(ingredient.qty_per_recipe.toFixed(3)),
        uom: ingredient.uom,
        waste_pct: Number(ingredient.waste_pct.toFixed(2)),
    }));

    const { data: insertedIngredients, error: ingredientError } = await db
        .from('recipe_ingredients')
        .insert(ingredientRows)
        .select('*');

    if (ingredientError) {
        return apiError('Failed to create recipe ingredients', 500, 'RECIPE_INGREDIENTS_CREATE_FAILED', ingredientError.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'recipe_created',
        entity_type: 'recipe',
        entity_id: recipe.id,
        metadata: {
            source: 'merchant_dashboard',
            idempotency_key: idempotencyKey,
        },
        new_value: {
            name: recipe.name,
            ingredient_count: insertedIngredients?.length ?? 0,
            output_qty: recipe.output_qty,
            output_uom: recipe.output_uom,
        },
    });

    return apiSuccess(
        {
            recipe: {
                ...recipe,
                ingredients: insertedIngredients ?? [],
            },
            idempotency_key: idempotencyKey,
        },
        201
    );
}
