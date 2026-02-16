-- P0 RLS Hardening (Phase 1)
-- Date: 2026-02-15
-- Goal: Remove permissive public policies and enforce tenant/staff access controls

BEGIN;

-- Ensure referenced tenancy table exists for agency-scoped policy branches.
CREATE TABLE IF NOT EXISTS public.agency_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    restaurant_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled on critical tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- ORDERS
-- =========================================================
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;
DROP POLICY IF EXISTS "Orders are viewable by restaurant association" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated by restaurant association" ON public.orders;

-- Guest insert with basic data/tenant validation
CREATE POLICY "Guest can create orders with valid tenant data"
    ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = orders.restaurant_id
                AND COALESCE(r.is_active, true) = true
        )
        AND length(trim(COALESCE(orders.table_number, ''))) > 0
        AND jsonb_typeof(orders.items) = 'array'
        AND COALESCE(orders.total_price, 0) >= 0
    );

-- Staff/agency reads are tenant-scoped
CREATE POLICY "Tenant staff can view orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

CREATE POLICY "Tenant staff can update orders"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = orders.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR orders.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

-- =========================================================
-- ORDER ITEMS
-- =========================================================
DROP POLICY IF EXISTS "Order items viewable by public (guest) and staff" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON public.order_items;

CREATE POLICY "Tenant staff can view order items"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.restaurant_staff rs ON rs.restaurant_id = o.restaurant_id
            WHERE o.id = order_items.order_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE o.id = order_items.order_id
                AND (
                    au.role = 'admin'
                    OR o.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

CREATE POLICY "Tenant staff can insert order items"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.restaurant_staff rs ON rs.restaurant_id = o.restaurant_id
            WHERE o.id = order_items.order_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE o.id = order_items.order_id
                AND (
                    au.role = 'admin'
                    OR o.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

CREATE POLICY "Tenant staff can update order items"
    ON public.order_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.restaurant_staff rs ON rs.restaurant_id = o.restaurant_id
            WHERE o.id = order_items.order_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE o.id = order_items.order_id
                AND (
                    au.role = 'admin'
                    OR o.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.restaurant_staff rs ON rs.restaurant_id = o.restaurant_id
            WHERE o.id = order_items.order_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.orders o
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE o.id = order_items.order_id
                AND (
                    au.role = 'admin'
                    OR o.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

-- =========================================================
-- SERVICE REQUESTS
-- =========================================================
DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Guests can create requests" ON public.service_requests;
DROP POLICY IF EXISTS "Tenants update requests" ON public.service_requests;
DROP POLICY IF EXISTS "Tenants view requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can read service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Anyone can update service requests" ON public.service_requests;

CREATE POLICY "Guest can create service requests with valid tenant data"
    ON public.service_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = service_requests.restaurant_id
                AND COALESCE(r.is_active, true) = true
        )
        AND length(trim(COALESCE(service_requests.table_number, ''))) > 0
    );

CREATE POLICY "Tenant staff can view service requests"
    ON public.service_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = service_requests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR service_requests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

CREATE POLICY "Tenant staff can update service requests"
    ON public.service_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = service_requests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR service_requests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = service_requests.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR service_requests.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

-- =========================================================
-- TABLES + RESTAURANT STAFF
-- =========================================================
DROP POLICY IF EXISTS "Public tables are viewable" ON public.tables;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;

CREATE POLICY "Public tables are viewable"
    ON public.tables
    FOR SELECT
    TO anon, authenticated
    USING (COALESCE(is_active, true) = true);

CREATE POLICY "Tenant staff can manage tables"
    ON public.tables
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = tables.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR tables.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = tables.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR tables.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Staff viewable by self or admin" ON public.restaurant_staff;

CREATE POLICY "Staff viewable by self or tenant admin"
    ON public.restaurant_staff
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.restaurant_staff s
            WHERE s.user_id = auth.uid()
                AND s.restaurant_id = restaurant_staff.restaurant_id
                AND COALESCE(s.is_active, true) = true
                AND s.role = ANY (ARRAY['owner', 'admin', 'manager'])
        )
        OR EXISTS (
            SELECT 1
            FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR restaurant_staff.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
