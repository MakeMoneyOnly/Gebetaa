-- P1 Channels Foundation - Delivery Partners
-- Date: 2026-02-18
-- Purpose: store per-restaurant delivery partner integrations and sync status

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

CREATE TABLE IF NOT EXISTS public.delivery_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('ubereats', 'doordash', 'glovo', 'custom')),
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('disconnected', 'pending', 'connected', 'error')),
    credentials_ref TEXT,
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_restaurant_status
    ON public.delivery_partners(restaurant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_restaurant_provider
    ON public.delivery_partners(restaurant_id, provider);

DROP TRIGGER IF EXISTS trg_delivery_partners_set_updated_at ON public.delivery_partners;
CREATE TRIGGER trg_delivery_partners_set_updated_at
    BEFORE UPDATE ON public.delivery_partners
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view delivery partners" ON public.delivery_partners;
CREATE POLICY "Tenant staff can view delivery partners"
    ON public.delivery_partners
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = delivery_partners.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR delivery_partners.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage delivery partners" ON public.delivery_partners;
CREATE POLICY "Tenant staff can manage delivery partners"
    ON public.delivery_partners
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = delivery_partners.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR delivery_partners.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = delivery_partners.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR delivery_partners.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
