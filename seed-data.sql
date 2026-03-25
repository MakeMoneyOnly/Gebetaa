-- =============================================================================
-- ሔዳ ምግብ ቤት (Heda Restaurant) — Realistic Seed Data
-- Gebeta POS · Addis Ababa · March 2026
--
-- Usage:
--   supabase db seed  (if placed in supabase/seed.sql)
--   OR: psql $DATABASE_URL -f seed.sql
--
-- What this creates:
--   1 restaurant  — ሔዳ ምግብ ቤት, Bole Road, Addis Ababa
--   12 tables     — A1–A6 (indoor), B1–B4 (outdoor), VIP1–VIP2
--   8 categories  — ቁርስ, ምሳ ልዩ, ምሳ, ጥብስ & ቁሳ, መጠጥ, ቡና & ሻይ, ጭማቂ, ጣፋጭ
--   60 menu items — All with Amharic + English names, realistic ETB prices
--   8 staff       — Owner, manager, 3 waiters, 2 kitchen, 1 cashier (with PINs)
--   1 loyalty programme
--   12 guests     — Mix of anonymous and loyalty members
--   ~500 orders   — 30 days of realistic trade (weekends busier, lunch/dinner peaks)
--   ~500 order items + payments + loyalty transactions
--   Inventory items + stock levels
-- =============================================================================

BEGIN;

-- =============================================================================
-- RESTAURANT
-- =============================================================================

INSERT INTO restaurants (
  id, name_en, name_am, slug,
  address_en, address_am,
  phone, email, timezone, currency_code,
  tin_number, vat_number,
  is_active, plan, plan_expires_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Heda Restaurant',
  'ሔዳ ምግብ ቤት',
  'heda-restaurant',
  'Bole Road, Near Edna Mall, Addis Ababa',
  'ቦሌ መንገድ፣ ኤድና ሞል አቅራቢያ፣ አዲስ አበባ',
  '+251911234567',
  'heda@gebeta.app',
  'Africa/Addis_Ababa',
  'ETB',
  '0023456789',
  'VAT-ET-0023456789',
  true,
  'pro',
  NOW() + INTERVAL '11 months'
);

-- =============================================================================
-- TABLES (12 tables across 3 zones)
-- =============================================================================

INSERT INTO tables (id, restaurant_id, name, capacity, qr_secret, is_active) VALUES
-- Indoor zone A
('tab-a1-0001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A1', 4, 'secret_a1_heda_bole_2026', true),
('tab-a2-0002-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A2', 4, 'secret_a2_heda_bole_2026', true),
('tab-a3-0003-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A3', 6, 'secret_a3_heda_bole_2026', true),
('tab-a4-0004-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A4', 4, 'secret_a4_heda_bole_2026', true),
('tab-a5-0005-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A5', 2, 'secret_a5_heda_bole_2026', true),
('tab-a6-0006-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A6', 2, 'secret_a6_heda_bole_2026', true),
-- Outdoor zone B
('tab-b1-0007-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B1 (ውጭ)', 4, 'secret_b1_heda_bole_2026', true),
('tab-b2-0008-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B2 (ውጭ)', 4, 'secret_b2_heda_bole_2026', true),
('tab-b3-0009-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B3 (ውጭ)', 6, 'secret_b3_heda_bole_2026', true),
('tab-b4-0010-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B4 (ውጭ)', 4, 'secret_b4_heda_bole_2026', true),
-- VIP rooms
('tab-v1-0011-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VIP 1', 10, 'secret_v1_heda_bole_2026', true),
('tab-v2-0012-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'VIP 2', 12, 'secret_v2_heda_bole_2026', true);

-- =============================================================================
-- STAFF (8 people with PINs)
-- =============================================================================

INSERT INTO restaurant_staff (id, restaurant_id, full_name, role, pin_code, is_active, hired_at) VALUES
('stf-own-0001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Almaz Tadesse',    'owner',   '1001', true, '2024-01-15'),
('stf-mgr-0002-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bereket Haile',    'manager', '2002', true, '2024-01-20'),
('stf-wtr-0003-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tigist Mekonnen',  'waiter',  '3003', true, '2024-02-01'),
('stf-wtr-0004-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Solomon Girma',   'waiter',  '4004', true, '2024-02-15'),
('stf-wtr-0005-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mekdes Abebe',    'waiter',  '5005', true, '2024-03-01'),
('stf-ktn-0006-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dawit Bekele',    'kitchen', '6006', true, '2024-01-25'),
('stf-ktn-0007-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hanan Mohammed',  'kitchen', '7007', true, '2024-02-10'),
('stf-cas-0008-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Yonas Tesfaye',   'cashier', '8008', true, '2024-02-20');

-- =============================================================================
-- CATEGORIES (8 categories, each with correct KDS station)
-- =============================================================================

INSERT INTO categories (id, restaurant_id, name_en, name_am, kds_station, sort_order, is_available) VALUES
('cat-bkf-0001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Breakfast',       'ቁርስ',       'kitchen',  1, true),
('cat-lsp-0002-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lunch Special',   'ምሳ ልዩ',    'kitchen',  2, true),
('cat-mls-0003-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Main Dishes',     'ምሳ',        'kitchen',  3, true),
('cat-grl-0004-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Grills & Tibs',   'ጥብስ & ቁሳ', 'kitchen',  4, true),
('cat-drk-0005-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cold Drinks',     'መጠጥ',       'bar',       5, true),
('cat-cof-0006-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Coffee & Tea',    'ቡና & ሻይ',  'coffee',   6, true),
('cat-jce-0007-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fresh Juices',    'ጭማቂ',       'coffee',   7, true),
('cat-dst-0008-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Desserts',        'ጣፋጭ',       'dessert',  8, true);

-- =============================================================================
-- MENU ITEMS (60 items, realistic ETB prices in santim)
-- All prices are tax-inclusive
-- =============================================================================

INSERT INTO menu_items (id, restaurant_id, category_id, name_en, name_am, price, is_available, available_for_delivery, sort_order, preparation_time_minutes) VALUES

-- BREAKFAST (8 items) ———————————————————————————————————————
('itm-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Ful with Bread',          'ፉል ከዳቦ ጋር',           8500,  true, true,  1, 12),
('itm-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Egg Ful (2 eggs)',        'እንቁላል ፉል (2 እንቁ)',    11000, true, true,  2, 12),
('itm-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Firfir with Egg',         'ፍርፍር ከእንቁ ጋር',        12000, true, true,  3, 15),
('itm-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Breakfast Combo',         'ቁርስ ጥምር',              18000, true, true,  4, 20),
('itm-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Chechebsa',               'ጨጨብሳ',                 13000, true, true,  5, 15),
('itm-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Genfo (Porridge)',        'ገንፎ',                   10000, true, false, 6, 20),
('itm-007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Scrambled Eggs',         'የተቀቀለ እንቁላል',           9000,  true, true,  7, 10),
('itm-008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-bkf-0001-0000-0000-000000000001',
 'Tirr Sega (raw meat)',   'ጥሬ ሥጋ',                 22000, true, false, 8, 10),

-- LUNCH SPECIALS (6 items, daily rotating) ————————————————————
('itm-009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Monday Special – Doro Wat',    'ሰኞ ልዩ — ዶሮ ወጥ',         22000, true, true,  1, 25),
('itm-010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Tuesday Special – Shiro Fit-Fit', 'ማክሰኞ ልዩ — ሽሮ ፍትፍት',  18000, true, true,  2, 20),
('itm-011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Wednesday Special – Tibs',    'ረቡዕ ልዩ — ጥብስ',            25000, true, true,  3, 20),
('itm-012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Thursday Special – Kitfo',    'ሐሙስ ልዩ — ክትፎ',             28000, true, true,  4, 15),
('itm-013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Friday Special – Beyaynetu',  'አርብ ልዩ — በያይነቱ',           32000, true, true,  5, 30),
('itm-014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-lsp-0002-0000-0000-000000000002',
 'Weekend Special – Full Combo', 'ቅዳሜ/እሁድ — ሙሉ ጥምር',       38000, true, true,  6, 35),

-- MAIN DISHES (12 items) ——————————————————————————————————————
('itm-015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Doro Wat',                'ዶሮ ወጥ',                 23000, true, true,  1, 30),
('itm-016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Shiro Wat',               'ሽሮ ወጥ',                 15000, true, true,  2, 20),
('itm-017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Misir Wat (Red Lentils)', 'ምስር ወጥ',                13000, true, true,  3, 20),
('itm-018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Yetsom Beyaynetu',        'የጾም በያይነቱ',             28000, true, true,  4, 25),
('itm-019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Kitfo (Ethiopian Tartare)','ክትፎ',                  30000, true, false, 5, 15),
('itm-020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Gomen (Collard Greens)',  'ጎመን',                   12000, true, true,  6, 20),
('itm-021', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Ayib (Fresh Cottage Cheese)','አይብ',                10000, true, true,  7, 5),
('itm-022', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Fasolia (Green Beans)',   'ፋሶሊያ',                  12000, true, true,  8, 20),
('itm-023', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Atkilt (Vegetable Mix)',  'አትክልት',                 13000, true, true,  9, 20),
('itm-024', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Tibs Firfir',             'ጥብስ ፍርፍር',              20000, true, true,  10, 20),
('itm-025', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Injera (extra)',          'ተጨማሪ እንጀራ',              2000,  true, true,  11, 5),
('itm-026', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-mls-0003-0000-0000-000000000003',
 'Dulet (Minced Offal)',    'ዱለት',                   22000, true, false, 12, 20),

-- GRILLS & TIBS (10 items) ————————————————————————————————————
('itm-027', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Beef Tibs (200g)',        'የበሬ ጥብስ (200 ግ)',        28000, true, true,  1, 15),
('itm-028', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Beef Tibs (400g)',        'የበሬ ጥብስ (400 ግ)',        52000, true, true,  2, 20),
('itm-029', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Lamb Tibs (200g)',        'የበግ ጥብስ (200 ግ)',         32000, true, true,  3, 15),
('itm-030', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Mixed Tibs',              'ምስቱ ጥብስ',               35000, true, true,  4, 18),
('itm-031', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Grilled Chicken (half)',  'የተጠበሰ ዶሮ (ግማሽ)',        35000, true, true,  5, 25),
('itm-032', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Grilled Chicken (whole)', 'የተጠበሰ ዶሮ (ሙሉ)',          65000, true, true,  6, 35),
('itm-033', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Fish Tibs',               'የዓሳ ጥብስ',               30000, true, true,  7, 20),
('itm-034', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Vegetable Tibs',          'የአትክልት ጥብስ',             18000, true, true,  8, 12),
('itm-035', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Kurt (spiced raw beef)',  'ቁርጥ',                   35000, true, false, 9, 8),
('itm-036', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-grl-0004-0000-0000-000000000004',
 'Grill Platter (4 persons)','ጥብስ ፕሌት (4 ሰዎች)',      120000,true, false, 10, 40),

-- COLD DRINKS (7 items) ————————————————————————————————————————
('itm-037', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Water (500ml)',            'ውሃ (500 ሚሊ)',             2500,  true, true,  1, 1),
('itm-038', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Water (1.5L)',             'ውሃ (1.5 ሊ)',               4000,  true, true,  2, 1),
('itm-039', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Coca-Cola',                'ኮካ ኮላ',                   5000,  true, true,  3, 1),
('itm-040', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Fanta Orange',             'ፋንታ',                     5000,  true, true,  4, 1),
('itm-041', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'St. George Beer (bottle)', 'ቅዱስ ጊዮርጊስ ቢራ',           8000,  true, true,  5, 2),
('itm-042', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Harar Beer (bottle)',      'ሐረር ቢራ',                  8000,  true, true,  6, 2),
('itm-043', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-drk-0005-0000-0000-000000000005',
 'Tej (Honey Wine, 500ml)',  'ጠጅ (500 ሚሊ)',              12000, true, false, 7, 2),

-- COFFEE & TEA (7 items) ——————————————————————————————————————
('itm-044', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Ethiopian Macchiato',      'ማኪያቶ',                   2500,  true, false, 1, 4),
('itm-045', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Buna (Ethiopian Coffee)',  'ቡና',                      3500,  true, false, 2, 8),
('itm-046', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Coffee Ceremony (3 cups)', 'የቡና ሥነ ሥርዓት',             15000, true, false, 3, 20),
('itm-047', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Cappuccino',               'ካፑቺኖ',                   4500,  true, false, 4, 5),
('itm-048', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Black Tea',                'ጥቁር ሻይ',                  2000,  true, false, 5, 4),
('itm-049', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Milk Tea',                 'ሻይ በወተት',                 2500,  true, false, 6, 4),
('itm-050', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-cof-0006-0000-0000-000000000006',
 'Hot Chocolate',            'ሞቅ ቸኮሌት',                5000,  true, false, 7, 5),

-- FRESH JUICES (5 items) ——————————————————————————————————————
('itm-051', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-jce-0007-0000-0000-000000000007',
 'Avocado Juice',           'አቡካዶ ጭማቂ',               9000,  true, true,  1, 5),
('itm-052', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-jce-0007-0000-0000-000000000007',
 'Mango Juice',             'ማንጎ ጭማቂ',                8000,  true, true,  2, 5),
('itm-053', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-jce-0007-0000-0000-000000000007',
 'Layered Juice (3 fruits)', 'ሦስት ፍሬ ጭማቂ',            12000, true, true,  3, 8),
('itm-054', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-jce-0007-0000-0000-000000000007',
 'Orange Juice',            'ብርቱካን ጭማቂ',              7000,  true, true,  4, 5),
('itm-055', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-jce-0007-0000-0000-000000000007',
 'Papaya Juice',            'ፓፓያ ጭማቂ',                8000,  true, true,  5, 5),

-- DESSERTS (5 items) ——————————————————————————————————————————
('itm-056', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-dst-0008-0000-0000-000000000008',
 'Honey Cake',              'ማር ኬክ',                  8000,  true, true,  1, 5),
('itm-057', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-dst-0008-0000-0000-000000000008',
 'Ice Cream (2 scoops)',    'አይስ ክሬም (2 ስኩፕ)',         7000,  true, true,  2, 3),
('itm-058', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-dst-0008-0000-0000-000000000008',
 'Baklava',                 'ባቅላዋ',                   9000,  true, true,  3, 3),
('itm-059', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-dst-0008-0000-0000-000000000008',
 'Flan (caramel custard)',  'ፍላን',                    7500,  true, true,  4, 5),
('itm-060', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-dst-0008-0000-0000-000000000008',
 'Fresh Fruit Plate',       'ትኩስ ፍሬ ፕሌት',             10000, true, true,  5, 5);

-- =============================================================================
-- LOYALTY PROGRAMME
-- =============================================================================

INSERT INTO loyalty_programs (id, restaurant_id, name_en, name_am, points_per_etb, redemption_rate, is_active) VALUES
('loy-pgm-0001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Heda Rewards', 'ሔዳ ሽልማቶች', 1, 100, true);
-- 1 point per ETB spent; 100 points = 1 ETB discount

-- =============================================================================
-- GUESTS (12 guests — mix of anonymous and enrolled loyalty members)
-- =============================================================================

INSERT INTO guests (id, restaurant_id, phone, name, is_anonymous, created_at) VALUES
('gst-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251911111001', 'Selamawit Alemu',  false, NOW() - INTERVAL '28 days'),
('gst-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251922222002', 'Biruk Tesfaye',    false, NOW() - INTERVAL '25 days'),
('gst-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251933333003', 'Hiwot Bekele',     false, NOW() - INTERVAL '22 days'),
('gst-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251944444004', 'Nahom Girma',      false, NOW() - INTERVAL '20 days'),
('gst-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251955555005', 'Meron Haile',      false, NOW() - INTERVAL '18 days'),
('gst-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251966666006', 'Dawit Tadesse',    false, NOW() - INTERVAL '15 days'),
('gst-007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251977777007', 'Tigist Abebe',     false, NOW() - INTERVAL '12 days'),
('gst-008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251988888008', 'Yonas Kebede',     false, NOW() - INTERVAL '10 days'),
('gst-009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL,            NULL,               true,  NOW() - INTERVAL '8 days'),
('gst-010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL,            NULL,               true,  NOW() - INTERVAL '6 days'),
('gst-011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251999999011', 'Rahel Solomon',    false, NOW() - INTERVAL '5 days'),
('gst-012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '+251900000012', 'Eyob Mulugeta',    false, NOW() - INTERVAL '3 days');

-- Loyalty accounts for enrolled guests
INSERT INTO loyalty_accounts (id, restaurant_id, guest_id, program_id, points_balance, tier, total_earned, total_redeemed, enrolled_at) VALUES
('lac-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'gst-001', 'loy-pgm-0001-0000-0000-000000000001', 1240, 'silver', 1890, 650, NOW() - INTERVAL '28 days'),
('lac-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'gst-002', 'loy-pgm-0001-0000-0000-000000000001', 580,  'bronze', 580,  0,   NOW() - INTERVAL '25 days'),
('lac-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'gst-003', 'loy-pgm-0001-0000-0000-000000000001', 320,  'bronze', 320,  0,   NOW() - INTERVAL '22 days'),
('lac-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'gst-004', 'loy-pgm-0001-0000-0000-000000000001', 2840, 'gold',   3290, 450, NOW() - INTERVAL '20 days'),
('lac-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'gst-005', 'loy-pgm-0001-0000-0000-000000000001', 190,  'bronze', 190,  0,   NOW() - INTERVAL '18 days');

-- =============================================================================
-- ORDERS + ITEMS + PAYMENTS
-- 30 days of orders: weekday avg 18 orders/day, weekend avg 34 orders/day
-- Peaks: 12–14h (lunch), 19–21h (dinner)
-- Payment mix: 55% Telebirr, 30% cash, 15% Chapa
-- ~520 total orders generated by this SQL
-- =============================================================================

-- Helper: generate orders using a DO block for the 30-day window
DO $$
DECLARE
  r_id TEXT := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  -- Table IDs
  tables TEXT[] := ARRAY[
    'tab-a1-0001-0000-0000-000000000001','tab-a2-0002-0000-0000-000000000002',
    'tab-a3-0003-0000-0000-000000000003','tab-a4-0004-0000-0000-000000000004',
    'tab-a5-0005-0000-0000-000000000005','tab-a6-0006-0000-0000-000000000006',
    'tab-b1-0007-0000-0000-000000000007','tab-b2-0008-0000-0000-000000000008',
    'tab-b3-0009-0000-0000-000000000009','tab-b4-0010-0000-0000-000000000010'
  ];

  -- Staff IDs (waiters only)
  waiters TEXT[] := ARRAY[
    'stf-wtr-0003-0000-0000-000000000003',
    'stf-wtr-0004-0000-0000-000000000004',
    'stf-wtr-0005-0000-0000-000000000005'
  ];

  -- High-frequency item pool: item_id, price_santim, kds_station
  item_pool RECORD[];

  day_offset INT;
  dow INT;           -- day of week (0=Sun, 6=Sat)
  daily_orders INT;
  hour_val INT;
  i INT;
  j INT;
  order_id UUID;
  item_count INT;
  item_idx INT;
  order_ts TIMESTAMPTZ;
  total_santim INT;
  payment_method TEXT;
  waiter_idx INT;
  table_idx INT;
  order_num TEXT;
  order_counter INT := 0;

  -- Individual item data
  item_ids TEXT[] := ARRAY[
    'itm-015','itm-027','itm-044','itm-037','itm-039','itm-041',
    'itm-016','itm-028','itm-045','itm-051','itm-019','itm-031',
    'itm-009','itm-013','itm-040','itm-042','itm-025','itm-053',
    'itm-056','itm-038','itm-017','itm-018','itm-022','itm-046'
  ];
  item_prices INT[] := ARRAY[
    23000, 28000, 2500,  2500,  5000,  8000,
    15000, 52000, 3500,  9000,  30000, 35000,
    22000, 32000, 5000,  8000,  2000,  12000,
    8000,  4000,  13000, 28000, 12000, 15000
  ];
  item_stations TEXT[] := ARRAY[
    'kitchen','kitchen','coffee','bar',   'bar',   'bar',
    'kitchen','kitchen','coffee','coffee','kitchen','kitchen',
    'kitchen','kitchen','bar',   'bar',   'kitchen','coffee',
    'dessert','bar',    'kitchen','kitchen','kitchen','coffee'
  ];

  chosen_item_id TEXT;
  chosen_price INT;
  chosen_station TEXT;
  qty INT;
  line_total INT;
  pay_method TEXT;
  tx_ref TEXT;
  pay_status TEXT;

BEGIN
  FOR day_offset IN 0..29 LOOP
    -- Determine day of week for this day (going backwards from today)
    dow := EXTRACT(DOW FROM (CURRENT_DATE - day_offset * INTERVAL '1 day'))::INT;

    -- Weekdays: 16–20 orders; Fri/Sat: 30–38 orders
    IF dow IN (5, 6) THEN
      daily_orders := 30 + (RANDOM() * 8)::INT;
    ELSE
      daily_orders := 16 + (RANDOM() * 4)::INT;
    END IF;

    FOR i IN 1..daily_orders LOOP
      order_counter := order_counter + 1;
      order_id := gen_random_uuid();
      order_num := LPAD(order_counter::TEXT, 4, '0');

      -- Realistic hour distribution: breakfast 7–10, lunch 11–14, dinner 18–21
      CASE (RANDOM() * 10)::INT
        WHEN 0, 1    THEN hour_val := 7  + (RANDOM() * 3)::INT;    -- breakfast 20%
        WHEN 2, 3, 4 THEN hour_val := 11 + (RANDOM() * 3)::INT;    -- lunch 30%
        ELSE              hour_val := 18 + (RANDOM() * 3)::INT;    -- dinner 50%
      END CASE;

      order_ts := (CURRENT_DATE - day_offset * INTERVAL '1 day')
                  + hour_val * INTERVAL '1 hour'
                  + (RANDOM() * 59)::INT * INTERVAL '1 minute'
                  + INTERVAL '3 hours'; -- Convert to EAT (UTC+3 stored as UTC)

      table_idx  := (RANDOM() * 9)::INT + 1;
      waiter_idx := (RANDOM() * 2)::INT + 1;
      item_count := 1 + (RANDOM() * 3)::INT;  -- 1–4 items per order
      total_santim := 0;

      -- Insert order header (status: completed for historical orders)
      INSERT INTO orders (id, restaurant_id, order_number, table_id, source, status,
                          total_price, waiter_id, created_at, updated_at)
      VALUES (
        order_id, r_id, order_num,
        tables[table_idx],
        'dine_in', 'completed',
        0,  -- will update after items
        waiters[waiter_idx],
        order_ts, order_ts + INTERVAL '45 minutes'
      );

      -- Insert order items
      FOR j IN 1..item_count LOOP
        item_idx     := (RANDOM() * 23)::INT + 1;
        chosen_item_id := item_ids[item_idx];
        chosen_price   := item_prices[item_idx];
        chosen_station := item_stations[item_idx];
        qty := 1 + (RANDOM() * 2)::INT;  -- 1–3 of each item
        line_total := chosen_price * qty;
        total_santim := total_santim + line_total;

        INSERT INTO order_items (id, restaurant_id, order_id, menu_item_id,
                                 quantity, unit_price, kds_status, kds_station,
                                 created_at, updated_at)
        VALUES (
          gen_random_uuid(), r_id, order_id, chosen_item_id,
          qty, chosen_price, 'served', chosen_station,
          order_ts, order_ts + INTERVAL '20 minutes'
        );
      END LOOP;

      -- Update order total
      UPDATE orders SET total_price = total_santim WHERE id = order_id;

      -- Payment: 55% Telebirr, 30% cash, 15% Chapa
      CASE
        WHEN RANDOM() < 0.55 THEN
          pay_method := 'telebirr';
          tx_ref := 'TLB-' || TO_CHAR(order_ts, 'YYYYMMDD') || '-' || LPAD((RANDOM() * 99999)::INT::TEXT, 5, '0');
          pay_status := 'captured';
        WHEN RANDOM() < 0.86 THEN  -- 30% cash (cumulative)
          pay_method := 'cash';
          tx_ref := NULL;
          pay_status := 'captured';
        ELSE
          pay_method := 'chapa';
          tx_ref := 'CHP-' || TO_CHAR(order_ts, 'YYYYMMDD') || '-' || LPAD((RANDOM() * 99999)::INT::TEXT, 5, '0');
          pay_status := 'captured';
      END CASE;

      INSERT INTO payments (id, restaurant_id, order_id, method, status,
                            amount, provider_transaction_id, captured_at,
                            created_at, updated_at)
      VALUES (
        gen_random_uuid(), r_id, order_id, pay_method, pay_status,
        total_santim, tx_ref,
        order_ts + INTERVAL '2 minutes',
        order_ts, order_ts + INTERVAL '2 minutes'
      );

    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- INVENTORY ITEMS (key ingredients)
-- =============================================================================

INSERT INTO inventory_items (id, restaurant_id, name_en, name_am, unit, current_stock, reorder_threshold, cost_per_unit) VALUES
('inv-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Teff Flour',       'ጤፍ ዱቄት',     'kg',     38.5,  10.0, 8500),
('inv-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Berbere Spice',    'በርበሬ',         'kg',      4.2,   5.0, 32000),
('inv-003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken (whole)',  'ዶሮ (ሙሉ)',      'piece',  28.0,  10.0, 45000),
('inv-004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef (kg)',        'የበሬ ሥጋ',      'kg',     12.5,   5.0, 65000),
('inv-005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Red Onion',        'ቀይ ሽንኩርት',   'kg',     22.0,   8.0, 4500),
('inv-006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cooking Oil',      'የምግብ ዘይት',   'litre',   8.5,   3.0, 22000),
('inv-007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Coffee Beans',     'ቡና ፍሬ',       'kg',      6.8,   2.0, 85000),
('inv-008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Avocado',          'አቡካዶ',         'piece',  45.0,  15.0, 1500),
('inv-009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mango',            'ማንጎ',          'piece',  38.0,  12.0, 800),
('inv-010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'St George Beer',   'ቅዱስ ጊዮርጊስ',  'bottle', 96.0,  24.0, 4500),
('inv-011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Shiro Powder',     'ሽሮ ዱቄት',      'kg',     14.5,   5.0, 18000),
('inv-012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Niter Kibbeh',     'ንጥር ቅቤ',      'kg',      3.2,   2.0, 45000),
('inv-013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fava Beans (Ful)', 'ፉል',           'kg',      8.0,   3.0, 6000),
('inv-014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Water (5L bottle)','ውሃ (5 ሊ)',    'bottle', 24.0,   8.0, 1200),
('inv-015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Coca-Cola (case)', 'ኮካ ኮላ (ካዝ)',  'case',    6.0,   2.0, 28000);

-- =============================================================================
-- FEATURE FLAGS (all off at seed time — activate per sprint)
-- =============================================================================

INSERT INTO feature_flags (flag_key, description, enabled_globally, rollout_percent) VALUES
('payment_webhooks',       'Auto-confirm Telebirr and Chapa payments via webhook',         false, 0),
('amharic_pos',            'Amharic default locale on waiter POS',                        false, 0),
('amharic_kds',            'Amharic default locale on KDS stations',                      false, 0),
('amharic_dashboard',      'Amharic default locale on merchant dashboard',                false, 0),
('redis_event_bus',        'Publish/consume events via Upstash Redis Streams',            false, 0),
('loyalty_earning',        'Award points on order.completed event',                       false, 0),
('inventory_deduction',    'Auto-deduct stock on order confirm DB trigger',               false, 0),
('powersync_offline',      'Replace Dexie.js with PowerSync CRDT sync',                  false, 0),
('discount_engine',        'Discount picker in waiter POS and guest checkout',            false, 0),
('modifier_tables',        'Serve modifiers from relational tables (not JSONB)',          false, 0),
('graphql_federation',     'Route POS/dashboard through Apollo Router federation',        false, 0),
('erca_submission',        'Auto-submit ERCA e-invoice on order.completed',               false, 0),
('subscription_gating',    'Enforce plan limits (Pro, Business features)',                false, 0),
('eod_telegram_report',    'Send daily EOD report to owner via Telegram at 22:00 EAT',   false, 0),
('timescaledb_analytics',  'Route analytics queries to TimescaleDB hypertable',           false, 0),
('delivery_channels',      'Enable BEU / Deliver Addis order intake',                    false, 0),
('gebeta_now_app',         'Enable manager app API access',                               false, 0),
('multi_location',         'Cross-location dashboard for multi-site owners',              false, 0);

-- Activate the Heda restaurant for the payment_webhooks feature once Sprint 1 is ready:
-- UPDATE feature_flags SET enabled_globally = true WHERE flag_key = 'payment_webhooks';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run after seeding to confirm correctness)
-- =============================================================================

-- Should return: 1 restaurant, 12 tables, 8 staff, 8 categories, 60 items
SELECT
  (SELECT COUNT(*) FROM restaurants WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS restaurants,
  (SELECT COUNT(*) FROM tables WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS tables,
  (SELECT COUNT(*) FROM restaurant_staff WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS staff,
  (SELECT COUNT(*) FROM categories WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS categories,
  (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS menu_items,
  (SELECT COUNT(*) FROM orders WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS orders,
  (SELECT COUNT(*) FROM order_items WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS order_items,
  (SELECT COUNT(*) FROM payments WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') AS payments,
  (SELECT ROUND(SUM(amount) / 100.0, 2) FROM payments WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND status = 'captured') AS total_revenue_etb;

-- Top 5 selling items by quantity (for demo: leads with a recognisable winner)
SELECT mi.name_am, mi.name_en, SUM(oi.quantity) AS qty_sold, SUM(oi.line_total) / 100.0 AS revenue_etb
FROM order_items oi
JOIN menu_items mi ON mi.id = oi.menu_item_id
WHERE oi.restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY mi.id, mi.name_am, mi.name_en
ORDER BY qty_sold DESC
LIMIT 5;

-- Santim integrity check — must return 0
SELECT COUNT(*) AS broken_rows
FROM payments
WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND (amount != amount::INTEGER OR amount < 0);