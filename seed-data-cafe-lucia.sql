-- =============================================================================
-- Cafe Lucia — Seed Data Reference File for Gebeta POS
-- 
-- STATUS: ✓ ALREADY SEEDED IN DATABASE
-- This file serves as documentation of what was seeded.
--
-- Usage:
--   This file is for reference only - the data is already in the database.
--   To re-seed or modify, use the Supabase SQL editor.
--
-- Restaurant ID: 25476b92-712a-494f-a954-3b05b577f4cd
-- Owner user_id: bcc7f071-ccc5-4911-8cd2-2fa524c0b69c (makeemoneyonly@gmail.com)
--
-- CURRENT DATABASE STATE:
--   ✓ Restaurant: Cafe Lucia (1)
--   ✓ Tables: 12 (A1-A6 indoor, B1-B4 outdoor, VIP1-VIP2)
--   ✓ Staff: 8 (owner, manager, 3 waiters, 2 kitchen, 1 bar)
--   ✓ Categories: 8
--   ✓ Menu Items: 60
--   ✓ Guests: 10
--   ✓ Loyalty Program: 1 (Cafe Lucia Rewards)
--   ✓ Loyalty Accounts: 5
--   ✗ Orders: 0 (can be generated for testing)
-- =============================================================================

-- =============================================================================
-- RECOMMENDATIONS FOR IMPROVING SEED DATA
-- =============================================================================

-- 1. ADD ORDERS FOR TESTING
-- Currently there are 0 orders. For full platform testing, you need:
--   - ~500 orders across 30 days
--   - Mix of order statuses (pending, completed, cancelled)
--   - Order items with various quantities
--   - Payments (cash, telebirr, chapa)
--   - Loyalty transactions

-- 2. ADD COMPLETE LOYALTY TRANSACTIONS
-- The loyalty accounts exist but have no transaction history.
-- This prevents testing:
--   - Points earning on orders
--   - Points redemption
--   - Tier upgrades/downgrades

-- 3. ENHANCE GUEST DATA
-- Consider adding:
--   - More visit history per guest
--   - Campaign delivery history
--   - More detailed preference data

-- 4. ADD SAMPLE DISCOUNTS AND HAPPY HOUR SCHEDULES
-- Test discount application logic with:
--   - Percentage discounts
--   - Fixed amount discounts
--   - Category-specific discounts
--   - Happy hour pricing

-- 5. ADD PAYMENT SESSIONS AND REFUNDS
-- For payment testing:
--   - Payment session records
--   - Partial refunds
--   - Split check scenarios

-- =============================================================================
-- SAMPLE QUERY: Generate 30 days of test orders
-- =============================================================================

/*
-- This is a sample DO block to generate orders - run in SQL editor if needed
DO $$
DECLARE
  r_id TEXT := '25476b92-712a-494f-a954-3b05b577f4cd';
  tables TEXT[] := ARRAY[
    'tab-id-1','tab-id-2','tab-id-3','tab-id-4','tab-id-5','tab-id-6',
    'tab-id-7','tab-id-8','tab-id-9','tab-id-10'
  ];
  day_offset INT;
  daily_orders INT;
  i INT;
  order_id UUID;
  item_count INT;
  total INT;
  
  -- Get category and item IDs
  cat_ids TEXT[];
  item_data RECORD;
  
BEGIN
  -- Get category IDs for this restaurant
  SELECT array_agg(id) INTO cat_ids FROM categories WHERE restaurant_id = r_id;
  
  FOR day_offset IN 0..29 LOOP
    daily_orders := 15 + (RANDOM() * 10)::INT;
    
    FOR i IN 1..daily_orders LOOP
      order_id := gen_random_uuid();
      item_count := 1 + (RANDOM() * 3)::INT;
      total := 0;
      
      -- Insert order
      INSERT INTO orders (id, restaurant_id, order_number, table_number, status, total_price, created_at)
      VALUES (order_id, r_id, LPAD(i::TEXT, 4, '0'), tables[1 + (RANDOM() * 9)::INT], 
              'completed', 0, CURRENT_DATE - day_offset * INTERVAL '1 day' + (RANDOM() * 12 + 7) * INTERVAL '1 hour');
      
      -- Add items (simplified - in production would use actual menu_item_ids)
      -- INSERT INTO order_items ...
      
    END LOOP;
  END LOOP;
END $$;
*/

-- =============================================================================
-- SCHEMA NOTES FOR FUTURE SEED SCRIPTS
-- =============================================================================

-- Key differences from original seed-data.sql to note:
--
-- 1. UUIDs: Use gen_random_uuid() or proper UUIDs, not custom strings
-- 2. Staff.user_id: MUST be set for owner to enable authentication
-- 3. Column names: name_en → name, name_am → name_am, etc.
-- 4. Price column: price (integer in sat/santim = 1/100 ETB)
-- 5. Table zones: Use 'indoor', 'outdoor', 'vip' not different tables
-- 6. Categories: section = 'food' or 'drinks' (not kds_station)
-- 7. Orders: items stored as JSONB, not separate table for simple cases
-- 8. Guests: identity_key is required, phone/name optional for anonymous

-- =============================================================================
