-- P2 Stock Movements Foundation
-- Date: 2026-02-19
-- Purpose: append-only stock in/out/waste movement log for variance analysis

BEGIN;

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste', 'count')),
    qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
    unit_cost NUMERIC(12, 2) CHECK (unit_cost >= 0),
    reason TEXT,
    reference_type TEXT NOT NULL DEFAULT 'manual' CHECK (reference_type IN ('manual', 'order', 'purchase_order', 'invoice', 'waste_audit', 'stock_count')),
    reference_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_created
    ON public.stock_movements(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item_created
    ON public.stock_movements(inventory_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_type
    ON public.stock_movements(restaurant_id, movement_type, created_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view stock movements" ON public.stock_movements;
CREATE POLICY "Tenant staff can view stock movements"
    ON public.stock_movements
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = stock_movements.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR stock_movements.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage stock movements" ON public.stock_movements;
CREATE POLICY "Tenant staff can manage stock movements"
    ON public.stock_movements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = stock_movements.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR stock_movements.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = stock_movements.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR stock_movements.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
