-- P2 Loyalty Accounts Foundation
-- Date: 2026-02-18
-- Purpose: track guest participation and balances for loyalty programs

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

CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    tier TEXT NOT NULL DEFAULT 'base',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, guest_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_restaurant_program
    ON public.loyalty_accounts(restaurant_id, program_id, points_balance DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_restaurant_guest
    ON public.loyalty_accounts(restaurant_id, guest_id);

DROP TRIGGER IF EXISTS trg_loyalty_accounts_set_updated_at ON public.loyalty_accounts;
CREATE TRIGGER trg_loyalty_accounts_set_updated_at
    BEFORE UPDATE ON public.loyalty_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view loyalty accounts" ON public.loyalty_accounts;
CREATE POLICY "Tenant staff can view loyalty accounts"
    ON public.loyalty_accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = loyalty_accounts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR loyalty_accounts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage loyalty accounts" ON public.loyalty_accounts;
CREATE POLICY "Tenant staff can manage loyalty accounts"
    ON public.loyalty_accounts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = loyalty_accounts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR loyalty_accounts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = loyalty_accounts.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR loyalty_accounts.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;