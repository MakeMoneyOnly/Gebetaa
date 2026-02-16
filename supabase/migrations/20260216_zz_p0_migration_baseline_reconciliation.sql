-- P0-6 Migration Baseline Reconciliation
-- Date: 2026-02-16
-- Goal: Fresh environments bootstrap cleanly and converge to one canonical runtime schema.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Canonical audit table name/shape
-- =========================================================
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NULL AND to_regclass('public.audit_log') IS NOT NULL THEN
        ALTER TABLE public.audit_log RENAME TO audit_logs;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID,
    telegram_user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS restaurant_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'details'
    ) THEN
        EXECUTE '
            UPDATE public.audit_logs
            SET metadata = COALESCE(metadata, details::jsonb)
            WHERE metadata IS NULL AND details IS NOT NULL
        ';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_action ON public.audit_logs(restaurant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =========================================================
-- Restaurants: auth bootstrap compatibility
-- =========================================================
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================
-- Orders: canonical runtime fields
-- =========================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_fingerprint TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bar_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        UPDATE public.orders
        SET total_price = COALESCE(total_price, total_amount, 0)
        WHERE total_price IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'table_id'
    ) THEN
        UPDATE public.orders o
        SET table_number = t.table_number
        FROM public.tables t
        WHERE o.table_id = t.id
          AND o.table_number IS NULL;
    END IF;
END $$;

UPDATE public.orders
SET table_number = 'unknown'
WHERE table_number IS NULL;

UPDATE public.orders
SET items = '[]'::jsonb
WHERE items IS NULL;

UPDATE public.orders
SET order_number = concat('ORD-', upper(substring(replace(id::text, '-', '') from 1 for 6)))
WHERE order_number IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'idempotency_key'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_idempotency_key_unique'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_idempotency_key_unique UNIQUE (idempotency_key);
    END IF;
END $$;

-- =========================================================
-- Order items: reconcile legacy and runtime variants
-- =========================================================
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS modifiers JSONB;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS station TEXT DEFAULT 'kitchen';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'menu_item_id'
    ) THEN
        UPDATE public.order_items
        SET item_id = menu_item_id
        WHERE item_id IS NULL AND menu_item_id IS NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'unit_price'
    ) THEN
        UPDATE public.order_items
        SET price = unit_price
        WHERE price IS NULL AND unit_price IS NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'total_price'
    ) THEN
        UPDATE public.order_items
        SET price = COALESCE(price, total_price / NULLIF(quantity, 0), total_price)
        WHERE price IS NULL AND total_price IS NOT NULL;
    END IF;
END $$;

DO $$
DECLARE
    menu_name_type TEXT;
BEGIN
    SELECT data_type
    INTO menu_name_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'menu_items'
      AND column_name = 'name';

    IF menu_name_type = 'jsonb' THEN
        UPDATE public.order_items oi
        SET name = COALESCE(oi.name, mi.name ->> 'en', mi.name::text, 'Item')
        FROM public.menu_items mi
        WHERE oi.item_id = mi.id
          AND oi.name IS NULL;
    ELSE
        UPDATE public.order_items oi
        SET name = COALESCE(oi.name, mi.name::text, 'Item')
        FROM public.menu_items mi
        WHERE oi.item_id = mi.id
          AND oi.name IS NULL;
    END IF;
END $$;

UPDATE public.order_items
SET name = 'Item'
WHERE name IS NULL;

DO $$
BEGIN
    IF to_regclass('public.menu_items') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'item_id'
       )
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'order_items_item_id_fkey'
       ) THEN
        ALTER TABLE public.order_items
            ADD CONSTRAINT order_items_item_id_fkey
            FOREIGN KEY (item_id) REFERENCES public.menu_items(id);
    END IF;
END $$;

-- =========================================================
-- FK reconciliation for early migrations that ran before parents
-- =========================================================
DO $$
BEGIN
    IF to_regclass('public.service_requests') IS NOT NULL
       AND to_regclass('public.restaurants') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'service_requests_restaurant_id_fkey'
       ) THEN
        ALTER TABLE public.service_requests
            ADD CONSTRAINT service_requests_restaurant_id_fkey
            FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.rate_limit_logs') IS NOT NULL
       AND to_regclass('public.restaurants') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'rate_limit_logs_restaurant_id_fkey'
       ) THEN
        ALTER TABLE public.rate_limit_logs
            ADD CONSTRAINT rate_limit_logs_restaurant_id_fkey
            FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);
    END IF;
END $$;

-- =========================================================
-- Realtime publication canonical set
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF to_regclass('public.orders') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF to_regclass('public.order_items') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    END IF;

    IF to_regclass('public.tables') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tables'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
    END IF;

    IF to_regclass('public.menu_items') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
    END IF;

    IF to_regclass('public.service_requests') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
    END IF;
END $$;

COMMIT;
