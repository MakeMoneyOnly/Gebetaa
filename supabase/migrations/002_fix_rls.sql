-- ============================================
-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor to fix the 404/Recursion error
-- ============================================

-- 1. Create a secure function to check admin status
-- This function runs as superuser (SECURITY DEFINER) to bypass RLS
-- preventing the infinite loop when querying agency_users.
CREATE OR REPLACE FUNCTION is_agency_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_users
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage agency users" ON agency_users;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Admins can manage agency users" ON agency_users
  FOR ALL USING ( is_agency_admin() );

-- 4. Ensure other tables can query agency_users without recursion
-- The recursion happens because other tables query agency_users, 
-- triggering agency_users RLS, which queried itself.
-- Now agency_users RLS uses the function, which bypasses RLS, breaking the loop.
