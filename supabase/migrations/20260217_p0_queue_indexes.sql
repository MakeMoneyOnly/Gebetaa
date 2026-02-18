-- P0 Queue and Table State Indexes
-- Date: 2026-02-17
-- Purpose: optimize order queue and table-state query patterns

BEGIN;

-- Order queue index for restaurant-scoped status + recency sorting.
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created
    ON public.orders(restaurant_id, status, created_at DESC);

-- Table state index for active table state lookups in service ops.
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_status_active
    ON public.tables(restaurant_id, status, updated_at DESC)
    WHERE COALESCE(is_active, true) = true;

COMMIT;
