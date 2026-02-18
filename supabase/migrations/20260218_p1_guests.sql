-- P1 Guests Foundation
-- Date: 2026-02-18
-- Purpose: establish guest CRM starter table and tenant-safe access controls

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

CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    identity_key TEXT NOT NULL,
    name TEXT,
    phone_hash TEXT,
    email_hash TEXT,
    fingerprint_hash TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'am')),
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    notes TEXT,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
    lifetime_value NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (lifetime_value >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, identity_key)
);

CREATE INDEX IF NOT EXISTS idx_guests_restaurant_last_seen
    ON public.guests(restaurant_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_guests_restaurant_ltv
    ON public.guests(restaurant_id, lifetime_value DESC);

CREATE INDEX IF NOT EXISTS idx_guests_restaurant_vip
    ON public.guests(restaurant_id, is_vip, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_guests_phone_hash
    ON public.guests(restaurant_id, phone_hash)
    WHERE phone_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_email_hash
    ON public.guests(restaurant_id, email_hash)
    WHERE email_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_fingerprint_hash
    ON public.guests(restaurant_id, fingerprint_hash)
    WHERE fingerprint_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_tags_gin
    ON public.guests
    USING gin(tags);

DROP TRIGGER IF EXISTS trg_guests_set_updated_at ON public.guests;
CREATE TRIGGER trg_guests_set_updated_at
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view guests" ON public.guests;
CREATE POLICY "Tenant staff can view guests"
    ON public.guests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage guests" ON public.guests;
CREATE POLICY "Tenant staff can manage guests"
    ON public.guests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = guests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR guests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
