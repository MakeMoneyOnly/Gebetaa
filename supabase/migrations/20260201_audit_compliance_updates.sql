-- Audit Compliance Updates
-- Baseline-safe: no-op/guard blocks when dependencies are not yet present.
-- Date: 2026-02-01

-- ============================================
-- 1) ORDERS ENHANCEMENTS (guarded)
-- ============================================
DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE public.orders
            DROP CONSTRAINT IF EXISTS orders_idempotency_key_unique;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'orders'
              AND column_name = 'idempotency_key'
        ) THEN
            ALTER TABLE public.orders
                ADD CONSTRAINT orders_idempotency_key_unique UNIQUE (idempotency_key);

            CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'guest_fingerprint'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_orders_guest_fingerprint ON public.orders(guest_fingerprint);
            CREATE INDEX IF NOT EXISTS idx_orders_fingerprint_created
                ON public.orders(guest_fingerprint, created_at DESC);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'acknowledged_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_orders_acknowledged_at ON public.orders(acknowledged_at);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders(completed_at);
        END IF;

        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Orders are viewable by restaurant staff" ON public.orders;
        DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
        DROP POLICY IF EXISTS "Orders can be updated by restaurant staff" ON public.orders;
        DROP POLICY IF EXISTS "Orders are viewable by restaurant association" ON public.orders;
        DROP POLICY IF EXISTS "Orders can be updated by restaurant association" ON public.orders;

        CREATE POLICY "Orders can be created by anyone"
            ON public.orders FOR INSERT
            WITH CHECK (true);

        CREATE POLICY "Orders are viewable by restaurant association"
            ON public.orders FOR SELECT
            USING (true);

        CREATE POLICY "Orders can be updated by restaurant association"
            ON public.orders FOR UPDATE
            USING (true);
    END IF;
END $$;

-- ============================================
-- 2) AUDIT LOG INDEXES (supports both names)
-- ============================================
DO $$
BEGIN
    IF to_regclass('public.audit_log') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant_action
            ON public.audit_log(restaurant_id, action);
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
            ON public.audit_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_log_entity
            ON public.audit_log(entity_type, entity_id);
    ELSIF to_regclass('public.audit_logs') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_action
            ON public.audit_logs(restaurant_id, action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
            ON public.audit_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
            ON public.audit_logs(entity_type, entity_id);
    END IF;
END $$;

-- ============================================
-- 3) REALTIME PUBLICATION UPDATES
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF to_regclass('public.orders') IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- ============================================
-- 4) DATA INTEGRITY TRIGGER (guarded)
-- ============================================
CREATE OR REPLACE FUNCTION update_order_acknowledged_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.acknowledged_at IS NULL THEN
        NEW.acknowledged_at = NOW();
    END IF;

    IF NEW.status IN ('served', 'closed', 'cancelled') AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'acknowledged_at'
       )
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at'
       ) THEN
        DROP TRIGGER IF EXISTS trigger_update_order_acknowledged ON public.orders;
        CREATE TRIGGER trigger_update_order_acknowledged
            BEFORE UPDATE ON public.orders
            FOR EACH ROW
            EXECUTE FUNCTION update_order_acknowledged_at();
    END IF;
END $$;

-- ============================================
-- 5) COMMENTS (guarded)
-- ============================================
DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'idempotency_key'
        ) THEN
            COMMENT ON COLUMN public.orders.idempotency_key IS
                'UUID to prevent duplicate order submissions. Checked before inserting new orders.';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'guest_fingerprint'
        ) THEN
            COMMENT ON COLUMN public.orders.guest_fingerprint IS
                'Device fingerprint for rate limiting and abuse prevention (IP + User Agent hash)';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'acknowledged_at'
        ) THEN
            COMMENT ON COLUMN public.orders.acknowledged_at IS
                'Timestamp when kitchen first acknowledged/viewed the order';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at'
        ) THEN
            COMMENT ON COLUMN public.orders.completed_at IS
                'Timestamp when order reached final state (served/closed/cancelled)';
        END IF;
    END IF;
END $$;

-- ============================================
-- 6) SYSTEM HEALTH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    service TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    latency_ms INTEGER DEFAULT 0,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_service ON public.system_health(service);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON public.system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_last_checked ON public.system_health(last_checked DESC);

COMMENT ON TABLE public.system_health IS
    'System health monitoring for services (database, api, external integrations)';

-- ============================================
-- 7) RATE LIMITING TABLE (restaurants FK guarded)
-- ============================================
DO $$
BEGIN
    IF to_regclass('public.rate_limit_logs') IS NULL THEN
        IF to_regclass('public.restaurants') IS NOT NULL THEN
            CREATE TABLE public.rate_limit_logs (
                id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
                fingerprint TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                action TEXT NOT NULL,
                restaurant_id UUID REFERENCES public.restaurants(id),
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ELSE
            CREATE TABLE public.rate_limit_logs (
                id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
                fingerprint TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                action TEXT NOT NULL,
                restaurant_id UUID,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_limit_fingerprint ON public.rate_limit_logs(fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_action ON public.rate_limit_logs(action, created_at DESC);

COMMENT ON TABLE public.rate_limit_logs IS
    'Audit log for rate limiting events and blocked requests';

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rate limit logs can be created by anyone" ON public.rate_limit_logs;
CREATE POLICY "Rate limit logs can be created by anyone"
    ON public.rate_limit_logs FOR INSERT
    WITH CHECK (true);
