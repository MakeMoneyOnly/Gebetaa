-- P2 Recipe Ingredients Foundation
-- Date: 2026-02-19
-- Purpose: define ingredient quantities and waste factors per recipe

BEGIN;

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    qty_per_recipe NUMERIC(12, 3) NOT NULL CHECK (qty_per_recipe > 0),
    uom TEXT NOT NULL DEFAULT 'unit',
    waste_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (waste_pct >= 0 AND waste_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (recipe_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_restaurant_recipe
    ON public.recipe_ingredients(restaurant_id, recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_item
    ON public.recipe_ingredients(inventory_item_id);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Tenant staff can view recipe ingredients"
    ON public.recipe_ingredients
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = recipe_ingredients.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR recipe_ingredients.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Tenant staff can manage recipe ingredients"
    ON public.recipe_ingredients
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = recipe_ingredients.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR recipe_ingredients.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = recipe_ingredients.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR recipe_ingredients.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
