-- P1 Channels Localization - Addis Delivery Partners
-- Date: 2026-02-18
-- Purpose: replace non-local delivery provider enums with Addis-focused providers.

BEGIN;

-- Normalize existing legacy provider values before tightening constraints.
UPDATE public.delivery_partners
SET provider = 'custom_local'
WHERE provider IN ('ubereats', 'doordash', 'glovo', 'custom');

UPDATE public.external_orders
SET provider = 'custom_local'
WHERE provider IN ('ubereats', 'doordash', 'glovo', 'custom');

-- Drop existing provider check constraints dynamically (names can vary).
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
            AND t.relname = 'delivery_partners'
            AND c.contype = 'c'
            AND pg_get_constraintdef(c.oid) ILIKE '%provider%'
    LOOP
        EXECUTE format('ALTER TABLE public.delivery_partners DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
            AND t.relname = 'external_orders'
            AND c.contype = 'c'
            AND pg_get_constraintdef(c.oid) ILIKE '%provider%'
    LOOP
        EXECUTE format('ALTER TABLE public.external_orders DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.delivery_partners
    ADD CONSTRAINT delivery_partners_provider_check
    CHECK (provider IN ('beu', 'deliver_addis', 'zmall', 'esoora', 'custom_local'));

ALTER TABLE public.external_orders
    ADD CONSTRAINT external_orders_provider_check
    CHECK (provider IN ('beu', 'deliver_addis', 'zmall', 'esoora', 'direct_web', 'custom_local'));

COMMIT;
