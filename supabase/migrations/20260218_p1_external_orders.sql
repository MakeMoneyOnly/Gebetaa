-- P1 Channels Foundation - External Orders
-- Date: 2026-02-18
-- Purpose: store normalized delivery/online orders from external channels

BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.external_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    delivery_partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('ubereats', 'doordash', 'glovo', 'direct_web', 'custom')),
    provider_order_id TEXT NOT NULL,
    source_channel TEXT NOT NULL DEFAULT 'delivery' CHECK (source_channel IN ('delivery', 'online_ordering', 'pickup')),
    normalized_status TEXT NOT NULL DEFAULT 'new' CHECK (normalized_status IN ('new', 'acknowledged', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled', 'failed')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    acked_at TIMESTAMPTZ,
    acked_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS idx_external_orders_restaurant_created
    ON public.external_orders(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_orders_restaurant_status
    ON public.external_orders(restaurant_id, normalized_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_orders_restaurant_provider
    ON public.external_orders(restaurant_id, provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_orders_partner
    ON public.external_orders(delivery_partner_id)
    WHERE delivery_partner_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_external_orders_set_updated_at ON public.external_orders;
CREATE TRIGGER trg_external_orders_set_updated_at
    BEFORE UPDATE ON public.external_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.external_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view external orders" ON public.external_orders;
CREATE POLICY "Tenant staff can view external orders"
    ON public.external_orders
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = external_orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR external_orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage external orders" ON public.external_orders;
CREATE POLICY "Tenant staff can manage external orders"
    ON public.external_orders
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = external_orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR external_orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = external_orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR external_orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
