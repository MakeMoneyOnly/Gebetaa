-- P2 Payments Foundation
-- Date: 2026-02-20
-- Purpose: capture payment transactions for settlement and reconciliation

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

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'telebirr', 'chapa', 'gift_card', 'bank_transfer', 'other')),
    provider TEXT NOT NULL DEFAULT 'internal',
    provider_reference TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    tip_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tip_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    status TEXT NOT NULL DEFAULT 'captured' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'voided', 'partially_refunded', 'refunded')),
    authorized_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_restaurant_provider_ref
    ON public.payments(restaurant_id, provider, provider_reference)
    WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_restaurant_created
    ON public.payments(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant_status
    ON public.payments(restaurant_id, status, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant_method
    ON public.payments(restaurant_id, method, captured_at DESC);

DROP TRIGGER IF EXISTS trg_payments_set_updated_at ON public.payments;
CREATE TRIGGER trg_payments_set_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view payments" ON public.payments;
CREATE POLICY "Tenant staff can view payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payments.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payments.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage payments" ON public.payments;
CREATE POLICY "Tenant staff can manage payments"
    ON public.payments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payments.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payments.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = payments.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR payments.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
