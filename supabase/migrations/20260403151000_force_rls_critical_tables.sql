-- ============================================================================
-- Security: Add FORCE ROW LEVEL SECURITY to critical tenant tables
-- Date: 2026-04-03
-- Purpose: Ensure RLS policies are enforced even for table owners
-- Reference: AGENTS.md - Platform Guardrails
-- ============================================================================

BEGIN;

-- Force RLS on restaurants (core tenant table)
ALTER TABLE public.restaurants FORCE ROW LEVEL SECURITY;

-- Force RLS on TimescaleDB analytics tables
ALTER TABLE public.hourly_sales FORCE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales FORCE ROW LEVEL SECURITY;

-- Add comments documenting the security rationale
COMMENT ON TABLE public.restaurants IS 'Core tenant table. FORCE RLS ensures all queries respect tenant isolation policies.';
COMMENT ON TABLE public.hourly_sales IS 'TimescaleDB hypertable for hourly sales analytics. FORCE RLS ensures tenant isolation.';
COMMENT ON TABLE public.daily_sales IS 'TimescaleDB hypertable for daily sales analytics. FORCE RLS ensures tenant isolation.';

COMMIT;
