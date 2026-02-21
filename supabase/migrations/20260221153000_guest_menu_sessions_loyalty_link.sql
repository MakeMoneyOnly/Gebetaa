-- QR Pre-Menu Session + Loyalty Attribution
-- Date: 2026-02-21
-- Purpose: persist guest/authenticated QR sessions and link orders for loyalty accrual

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

CREATE TABLE IF NOT EXISTS public.guest_menu_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    slug TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'qr' CHECK (source IN ('qr', 'campaign_qr', 'direct_link', 'other')),
    auth_state TEXT NOT NULL DEFAULT 'guest' CHECK (auth_state IN ('guest', 'authenticated')),
    user_id UUID,
    converted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_menu_sessions_restaurant_started
    ON public.guest_menu_sessions(restaurant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_menu_sessions_table_started
    ON public.guest_menu_sessions(table_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_menu_sessions_user_started
    ON public.guest_menu_sessions(user_id, started_at DESC)
    WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_guest_menu_sessions_set_updated_at ON public.guest_menu_sessions;
CREATE TRIGGER trg_guest_menu_sessions_set_updated_at
    BEFORE UPDATE ON public.guest_menu_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.guest_menu_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view guest menu sessions" ON public.guest_menu_sessions;
CREATE POLICY "Tenant staff can view guest menu sessions"
    ON public.guest_menu_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guest_menu_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guest_menu_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage guest menu sessions" ON public.guest_menu_sessions;
CREATE POLICY "Tenant staff can manage guest menu sessions"
    ON public.guest_menu_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guest_menu_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guest_menu_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guest_menu_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guest_menu_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

CREATE TABLE IF NOT EXISTS public.order_guest_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    guest_menu_session_id UUID REFERENCES public.guest_menu_sessions(id) ON DELETE SET NULL,
    auth_state TEXT NOT NULL CHECK (auth_state IN ('guest', 'authenticated')),
    user_id UUID,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_guest_attributions_restaurant_created
    ON public.order_guest_attributions(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_guest_attributions_user_created
    ON public.order_guest_attributions(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_order_guest_attributions_set_updated_at ON public.order_guest_attributions;
CREATE TRIGGER trg_order_guest_attributions_set_updated_at
    BEFORE UPDATE ON public.order_guest_attributions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_guest_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view order guest attributions" ON public.order_guest_attributions;
CREATE POLICY "Tenant staff can view order guest attributions"
    ON public.order_guest_attributions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = order_guest_attributions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR order_guest_attributions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage order guest attributions" ON public.order_guest_attributions;
CREATE POLICY "Tenant staff can manage order guest attributions"
    ON public.order_guest_attributions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = order_guest_attributions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR order_guest_attributions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = order_guest_attributions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR order_guest_attributions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
