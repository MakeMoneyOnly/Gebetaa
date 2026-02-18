-- P0 Alert Events Foundation
-- Date: 2026-02-17
-- Purpose: runtime alert instances for command center operations

BEGIN;

CREATE TABLE IF NOT EXISTS public.alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alert_events_restaurant_severity_status
    ON public.alert_events(restaurant_id, severity, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_restaurant_status_created
    ON public.alert_events(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_entity
    ON public.alert_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_alert_events_open_restaurant
    ON public.alert_events(restaurant_id, created_at DESC)
    WHERE status = 'open';

ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view alert events" ON public.alert_events;
CREATE POLICY "Tenant staff can view alert events"
    ON public.alert_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_events.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_events.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage alert events" ON public.alert_events;
CREATE POLICY "Tenant staff can manage alert events"
    ON public.alert_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_events.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_events.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_events.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_events.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
