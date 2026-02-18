-- P1 Guest Visits Foundation
-- Date: 2026-02-18
-- Purpose: track guest visit history and spend across channels

BEGIN;

CREATE TABLE IF NOT EXISTS public.guest_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'dine_in' CHECK (channel IN ('dine_in', 'pickup', 'delivery', 'online', 'walk_in', 'other')),
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    spend NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_visits_restaurant_visited
    ON public.guest_visits(restaurant_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_visits_guest_visited
    ON public.guest_visits(guest_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_visits_order
    ON public.guest_visits(order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_visits_channel_visited
    ON public.guest_visits(restaurant_id, channel, visited_at DESC);

ALTER TABLE public.guest_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view guest visits" ON public.guest_visits;
CREATE POLICY "Tenant staff can view guest visits"
    ON public.guest_visits
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guest_visits.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guest_visits.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can create guest visits" ON public.guest_visits;
CREATE POLICY "Tenant staff can create guest visits"
    ON public.guest_visits
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guest_visits.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guest_visits.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
