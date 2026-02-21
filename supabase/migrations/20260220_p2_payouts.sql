-- P2 Payouts Foundation
-- Date: 2026-02-20
-- Purpose: track provider payout windows for merchant settlement

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

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'omni' CHECK (channel IN ('in_store', 'online', 'delivery', 'omni')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    gross NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (gross >= 0),
    fees NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
    adjustments NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'ETB',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled')),
    paid_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payouts_period_valid CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS idx_payouts_restaurant_created
    ON public.payouts(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_restaurant_status
    ON public.payouts(restaurant_id, status, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_restaurant_provider_period
    ON public.payouts(restaurant_id, provider, period_start DESC, period_end DESC);

DROP TRIGGER IF EXISTS trg_payouts_set_updated_at ON public.payouts;
CREATE TRIGGER trg_payouts_set_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view payouts" ON public.payouts;
CREATE POLICY "Tenant staff can view payouts"
    ON public.payouts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payouts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payouts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage payouts" ON public.payouts;
CREATE POLICY "Tenant staff can manage payouts"
    ON public.payouts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payouts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payouts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payouts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payouts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
