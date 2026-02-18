-- P0 Order Events Foundation
-- Date: 2026-02-17
-- Purpose: canonical event timeline for order state changes and operational auditing

BEGIN;

CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_restaurant_order_created
    ON public.order_events(restaurant_id, order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_events_order_created
    ON public.order_events(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_events_type_created
    ON public.order_events(event_type, created_at DESC);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view order events" ON public.order_events;
CREATE POLICY "Tenant staff can view order events"
    ON public.order_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = order_events.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR order_events.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can create order events" ON public.order_events;
CREATE POLICY "Tenant staff can create order events"
    ON public.order_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = order_events.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR order_events.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
