-- Security Hardening Migration
-- 1. Enable RLS on missing tables
ALTER TABLE "public"."tables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."global_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."workflow_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_health" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_health_monitor" ENABLE ROW LEVEL SECURITY;

-- 2. Fix service_requests policies
DROP POLICY IF EXISTS "Anyone can update service requests" ON "public"."service_requests";
DROP POLICY IF EXISTS "Anyone can read service requests" ON "public"."service_requests";
DROP POLICY IF EXISTS "Tenants update requests" ON "public"."service_requests";
DROP POLICY IF EXISTS "Tenants view requests" ON "public"."service_requests";

CREATE POLICY "Tenants view requests" ON "public"."service_requests"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agency_users 
    WHERE agency_users.user_id = auth.uid() 
    AND (agency_users.role = 'admin' OR service_requests.restaurant_id = ANY(agency_users.restaurant_ids))
  )
);

CREATE POLICY "Tenants update requests" ON "public"."service_requests"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agency_users 
    WHERE agency_users.user_id = auth.uid() 
    AND (agency_users.role = 'admin' OR service_requests.restaurant_id = ANY(agency_users.restaurant_ids))
  )
);

-- 3. Fix orders policies
DROP POLICY IF EXISTS "Anyone can view their own order" ON "public"."orders";
DROP POLICY IF EXISTS "Orders are viewable by restaurant association" ON "public"."orders";
DROP POLICY IF EXISTS "Orders can be updated by restaurant association" ON "public"."orders";

CREATE POLICY "Staff can view orders" ON "public"."orders"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agency_users 
    WHERE agency_users.user_id = auth.uid() 
    AND (agency_users.role = 'admin' OR orders.restaurant_id = ANY(agency_users.restaurant_ids))
  )
);

CREATE POLICY "Staff can update orders" ON "public"."orders"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agency_users 
    WHERE agency_users.user_id = auth.uid() 
    AND (agency_users.role = 'admin' OR orders.restaurant_id = ANY(agency_users.restaurant_ids))
  )
);

-- 4. Secure Functions search_path
ALTER FUNCTION "public"."update_order_acknowledged_at" SET search_path = public;
ALTER FUNCTION "public"."validate_item_update" SET search_path = public;
ALTER FUNCTION "public"."notify_n8n_on_order" SET search_path = public;
ALTER FUNCTION "public"."check_merchant_item_updates" SET search_path = public;
