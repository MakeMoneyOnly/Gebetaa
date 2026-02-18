-- P0 Tables and Sessions Foundation
-- Date: 2026-02-17
-- Purpose: harden existing tables model and add table session tracking for service ops

BEGIN;

-- Ensure helper exists for updated_at maintenance.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Existing tables model upgrades.
ALTER TABLE public.tables
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4 CHECK (capacity > 0),
    ADD COLUMN IF NOT EXISTS zone TEXT,
    ADD COLUMN IF NOT EXISTS qr_version INTEGER DEFAULT 1 CHECK (qr_version > 0);

UPDATE public.tables
SET capacity = 4
WHERE capacity IS NULL;

UPDATE public.tables
SET qr_version = 1
WHERE qr_version IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_restaurant_table_number_unique
    ON public.tables(restaurant_id, table_number);

DROP TRIGGER IF EXISTS trg_tables_set_updated_at ON public.tables;
CREATE TRIGGER trg_tables_set_updated_at
    BEFORE UPDATE ON public.tables
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- New canonical table sessions model.
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    assigned_staff_id UUID REFERENCES public.restaurant_staff(id) ON DELETE SET NULL,
    guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count > 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'transferred', 'closed', 'cancelled')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant_status_opened
    ON public.table_sessions(restaurant_id, status, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_table_sessions_table_status
    ON public.table_sessions(table_id, status);

CREATE INDEX IF NOT EXISTS idx_table_sessions_staff_status
    ON public.table_sessions(assigned_staff_id, status)
    WHERE assigned_staff_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_one_open_per_table
    ON public.table_sessions(table_id)
    WHERE status = 'open';

DROP TRIGGER IF EXISTS trg_table_sessions_set_updated_at ON public.table_sessions;
CREATE TRIGGER trg_table_sessions_set_updated_at
    BEFORE UPDATE ON public.table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Access control.
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view table sessions" ON public.table_sessions;
CREATE POLICY "Tenant staff can view table sessions"
    ON public.table_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = table_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR table_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage table sessions" ON public.table_sessions;
CREATE POLICY "Tenant staff can manage table sessions"
    ON public.table_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = table_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR table_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = table_sessions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR table_sessions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
