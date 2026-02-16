-- Service Requests Table Migration
-- Baseline-safe: handles fresh databases where foundational tables may not exist yet.

DO $$
BEGIN
    IF to_regclass('public.service_requests') IS NULL THEN
        IF to_regclass('public.restaurants') IS NOT NULL THEN
            CREATE TABLE public.service_requests (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
                table_number TEXT NOT NULL,
                request_type TEXT NOT NULL CHECK (request_type IN ('waiter', 'bill', 'cutlery')),
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        ELSE
            -- Create without FK first; a later reconciliation migration adds the FK when restaurants exists.
            CREATE TABLE public.service_requests (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                restaurant_id UUID NOT NULL,
                table_number TEXT NOT NULL,
                request_type TEXT NOT NULL CHECK (request_type IN ('waiter', 'bill', 'cutlery')),
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_requests_restaurant_id ON public.service_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can read service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can update service requests" ON public.service_requests;

CREATE POLICY "Anyone can create service requests" ON public.service_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read service requests" ON public.service_requests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update service requests" ON public.service_requests
    FOR UPDATE USING (true);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'service_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
    END IF;
END $$;

COMMENT ON TABLE public.service_requests IS
    'Stores guest service requests like Call Waiter, Request Bill, Extra Cutlery for real-time merchant notifications';
