-- Auth bootstrap for merchant onboarding
-- Creates a default restaurant + owner staff membership for each new auth user.

BEGIN;

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE OR REPLACE FUNCTION public.bootstrap_merchant_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_slug text;
    restaurant_slug text;
    restaurant_name text;
    v_restaurant_id uuid;
BEGIN
    base_slug := regexp_replace(lower(coalesce(split_part(NEW.email, '@', 1), 'merchant')), '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN
        base_slug := 'merchant';
    END IF;

    restaurant_slug := base_slug || '-' || substring(NEW.id::text from 1 for 8);
    restaurant_name := coalesce(
        NEW.raw_user_meta_data ->> 'restaurant_name',
        initcap(replace(base_slug, '-', ' ')) || ' Restaurant'
    );

    INSERT INTO public.restaurants (name, slug, contact_email, is_active)
    VALUES (restaurant_name, restaurant_slug, NEW.email, true)
    RETURNING id INTO v_restaurant_id;

    INSERT INTO public.restaurant_staff (user_id, restaurant_id, role, is_active)
    VALUES (NEW.id, v_restaurant_id, 'owner', true)
    ON CONFLICT (user_id, restaurant_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_merchant ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap_merchant
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.bootstrap_merchant_for_auth_user();

-- Backfill for existing auth users missing merchant staff membership.
DO $$
DECLARE
    usr record;
    base_slug text;
    restaurant_slug text;
    restaurant_name text;
    v_restaurant_id uuid;
BEGIN
    FOR usr IN
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.restaurant_staff rs
            WHERE rs.user_id = u.id
        )
    LOOP
        base_slug := regexp_replace(lower(coalesce(split_part(usr.email, '@', 1), 'merchant')), '[^a-z0-9]+', '-', 'g');
        base_slug := trim(both '-' from base_slug);
        IF base_slug = '' THEN
            base_slug := 'merchant';
        END IF;

        restaurant_slug := base_slug || '-' || substring(usr.id::text from 1 for 8);
        restaurant_name := coalesce(
            usr.raw_user_meta_data ->> 'restaurant_name',
            initcap(replace(base_slug, '-', ' ')) || ' Restaurant'
        );

        INSERT INTO public.restaurants (name, slug, contact_email, is_active)
        VALUES (restaurant_name, restaurant_slug, usr.email, true)
        RETURNING id INTO v_restaurant_id;

        INSERT INTO public.restaurant_staff (user_id, restaurant_id, role, is_active)
        VALUES (usr.id, v_restaurant_id, 'owner', true)
        ON CONFLICT (user_id, restaurant_id) DO NOTHING;
    END LOOP;
END;
$$;

COMMIT;
