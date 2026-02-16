-- Reliable role resolution for authenticated users
-- Uses SECURITY DEFINER so client-side role checks are not blocked by RLS edge cases.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_staff_role(p_restaurant_id uuid DEFAULT NULL)
RETURNS TABLE(role text, restaurant_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT rs.role, rs.restaurant_id
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND COALESCE(rs.is_active, true) = true
      AND (p_restaurant_id IS NULL OR rs.restaurant_id = p_restaurant_id)
    ORDER BY rs.created_at ASC
    LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_my_staff_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_staff_role(uuid) TO authenticated;

COMMIT;
