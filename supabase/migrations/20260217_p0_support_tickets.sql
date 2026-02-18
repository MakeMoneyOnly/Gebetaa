-- P0 Support Tickets Foundation
-- Date: 2026-02-17
-- Purpose: in-product support ticketing for merchant help center

BEGIN;

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'merchant_dashboard',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    diagnostics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_status_created
    ON public.support_tickets(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_priority
    ON public.support_tickets(restaurant_id, priority, created_at DESC);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'set_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS trg_support_tickets_set_updated_at ON public.support_tickets;
        CREATE TRIGGER trg_support_tickets_set_updated_at
            BEFORE UPDATE ON public.support_tickets
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view support tickets" ON public.support_tickets;
CREATE POLICY "Tenant staff can view support tickets"
    ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = support_tickets.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR support_tickets.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage support tickets" ON public.support_tickets;
CREATE POLICY "Tenant staff can manage support tickets"
    ON public.support_tickets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = support_tickets.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR support_tickets.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = support_tickets.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR support_tickets.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
