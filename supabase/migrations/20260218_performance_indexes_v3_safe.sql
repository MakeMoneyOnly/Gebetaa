-- Performance Indexes Migration (Schema-safe variant)
-- Date: 2026-02-18
-- Purpose: Add critical indexes while handling menu_items schema drift safely.
-- Reconciles remote migration: performance_indexes_v3_safe

BEGIN;

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created
    ON public.orders(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key
    ON public.orders(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_table
    ON public.orders(restaurant_id, table_number)
    WHERE status NOT IN ('served', 'cancelled', 'closed');

CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status
    ON public.orders(restaurant_id, kitchen_status)
    WHERE kitchen_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_available
    ON public.menu_items(category_id, is_available);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'restaurant_id'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(category_id, restaurant_id)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_menu_items_category_only ON public.menu_items(category_id)';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_menu_items_popularity
    ON public.menu_items(popularity DESC)
    WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_menu_items_name_search
    ON public.menu_items USING gin(to_tsvector('simple', name));

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_order
    ON public.categories(restaurant_id, order_index);

CREATE INDEX IF NOT EXISTS idx_categories_section
    ON public.categories(restaurant_id, section)
    WHERE section IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_status
    ON public.order_items(order_id, status)
    WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_station
    ON public.order_items(station, status)
    WHERE station IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_pending
    ON public.service_requests(restaurant_id, status, created_at DESC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_service_requests_table
    ON public.service_requests(restaurant_id, table_number);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant
    ON public.tables(restaurant_id, table_number);

CREATE INDEX IF NOT EXISTS idx_tables_active
    ON public.tables(restaurant_id, status)
    WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug
    ON public.restaurants(slug);

CREATE INDEX IF NOT EXISTS idx_restaurants_active
    ON public.restaurants(is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant
    ON public.audit_logs(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user
    ON public.restaurant_staff(user_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant
    ON public.restaurant_staff(restaurant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_fingerprint
    ON public.rate_limit_logs(fingerprint, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_item
    ON public.reviews(item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant
    ON public.reviews(restaurant_id, created_at DESC);

COMMIT;
