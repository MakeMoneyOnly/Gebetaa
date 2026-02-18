-- P0 Alert Rules Foundation
-- Date: 2026-02-17
-- Purpose: define rule configuration for command center alerting

BEGIN;

CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    target_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_restaurant_enabled
    ON public.alert_rules(restaurant_id, enabled);

CREATE INDEX IF NOT EXISTS idx_alert_rules_restaurant_severity
    ON public.alert_rules(restaurant_id, severity);

CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at
    ON public.alert_rules(created_at DESC);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'set_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS trg_alert_rules_set_updated_at ON public.alert_rules;
        CREATE TRIGGER trg_alert_rules_set_updated_at
            BEFORE UPDATE ON public.alert_rules
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view alert rules" ON public.alert_rules;
CREATE POLICY "Tenant staff can view alert rules"
    ON public.alert_rules
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_rules.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_rules.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage alert rules" ON public.alert_rules;
CREATE POLICY "Tenant staff can manage alert rules"
    ON public.alert_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_rules.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_rules.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = alert_rules.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR alert_rules.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
