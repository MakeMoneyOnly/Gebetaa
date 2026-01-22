-- ============================================
-- AR Menu - Supabase Database Schema
-- Multi-tenant architecture with RLS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RESTAURANTS TABLE
-- Core tenant table - each restaurant is a tenant
-- ============================================
CREATE TABLE restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  brand_color TEXT DEFAULT '#88F026',
  telegram_chat_id TEXT,
  owner_telegram_chat_id TEXT,
  location TEXT,
  description TEXT,
  currency TEXT DEFAULT 'ETB',
  currency_symbol TEXT DEFAULT 'Br',
  contact_phone TEXT,
  contact_email TEXT,
  hours_weekday TEXT,
  hours_weekend TEXT,
  features JSONB DEFAULT '{"ar": true, "fasting": true, "languages": ["en", "am"]}',
  social JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CATEGORIES TABLE
-- Menu categories per restaurant
-- ============================================
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_am TEXT, -- Amharic translation
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ITEMS TABLE (Menu Items)
-- Individual dishes/drinks per category
-- ============================================
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_am TEXT,
  description TEXT,
  description_am TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_fasting BOOLEAN DEFAULT false,
  is_chef_special BOOLEAN DEFAULT false,
  station TEXT DEFAULT 'kitchen' CHECK (station IN ('kitchen', 'bar', 'dessert', 'coffee')),
  rating NUMERIC(2,1) DEFAULT 4.5,
  popularity INT DEFAULT 0,
  order_count INT DEFAULT 0,
  ingredients TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  pairings UUID[] DEFAULT '{}',
  has_ar BOOLEAN DEFAULT false,
  model_glb TEXT,
  model_usdz TEXT,
  model_scale TEXT DEFAULT '1 1 1',
  nutrition JSONB DEFAULT '{"protein": "0g", "carbs": "0g", "fats": "0g"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORDERS TABLE
-- Customer orders with JSONB items
-- ============================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL, -- Human-readable order ID like ORD-001
  table_number TEXT NOT NULL,
  items JSONB NOT NULL, -- [{id, name, quantity, price, notes, image_url}]
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'closed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STATIONS TABLE
-- Kitchen/Bar/Dessert/Coffee station config per restaurant
-- ============================================
CREATE TABLE stations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  station_type TEXT NOT NULL CHECK (station_type IN ('kitchen', 'bar', 'dessert', 'coffee')),
  name TEXT NOT NULL,
  telegram_chat_id TEXT,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, station_type)
);

-- ============================================
-- AGENCY USERS TABLE
-- For admin access to onboarding factory
-- ============================================
CREATE TABLE agency_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'staff')),
  restaurant_ids UUID[] DEFAULT '{}', -- Restaurants this user can manage
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_available ON items(is_available);
CREATE INDEX idx_items_fasting ON items(is_fasting);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_stations_restaurant ON stations(restaurant_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;

-- RESTAURANTS: Public read, authenticated admin write
CREATE POLICY "Public can view restaurants" ON restaurants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage restaurants" ON restaurants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR id = ANY(restaurant_ids))
    )
  );

-- CATEGORIES: Public read, owner write
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR restaurant_id = ANY(restaurant_ids))
    )
  );

-- ITEMS: Public read, owner write
CREATE POLICY "Public can view available items" ON items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_users au
      JOIN categories c ON c.id = items.category_id
      WHERE au.user_id = auth.uid() 
      AND (au.role = 'admin' OR c.restaurant_id = ANY(au.restaurant_ids))
    )
  );

-- ORDERS: Restaurant-specific access
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurant owners can view their orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR restaurant_id = ANY(restaurant_ids))
    )
  );

CREATE POLICY "Restaurant owners can update their orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR restaurant_id = ANY(restaurant_ids))
    )
  );

-- STATIONS: Public read, owner write
CREATE POLICY "Public can view stations" ON stations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stations" ON stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR restaurant_id = ANY(restaurant_ids))
    )
  );

-- AGENCY_USERS: Self read, admin all
CREATE POLICY "Users can view own record" ON agency_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage agency users" ON agency_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agency_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(
    (SELECT COUNT(*) + 1 FROM orders WHERE restaurant_id = NEW.restaurant_id AND DATE(created_at) = CURRENT_DATE)::TEXT, 
    3, '0'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample restaurant
INSERT INTO restaurants (name, slug, brand_color, location, description) VALUES
('Café Lucia', 'cafe-lucia', '#88F026', 'Bole, Addis Ababa', 'A modern Italian-Ethiopian fusion café');

-- Get the restaurant ID for foreign keys
DO $$
DECLARE
  cafe_id UUID;
  cat_breakfast UUID;
  cat_mains UUID;
  cat_drinks UUID;
BEGIN
  SELECT id INTO cafe_id FROM restaurants WHERE slug = 'cafe-lucia';
  
  -- Insert categories
  INSERT INTO categories (restaurant_id, name, name_am, order_index) VALUES
  (cafe_id, 'Breakfast', 'ቁርስ', 1) RETURNING id INTO cat_breakfast;
  
  INSERT INTO categories (restaurant_id, name, name_am, order_index) VALUES
  (cafe_id, 'Main Dishes', 'ዋና ምግቦች', 2) RETURNING id INTO cat_mains;
  
  INSERT INTO categories (restaurant_id, name, name_am, order_index) VALUES
  (cafe_id, 'Drinks', 'መጠጦች', 3) RETURNING id INTO cat_drinks;
  
  -- Insert sample items
  INSERT INTO items (category_id, name, name_am, description, price, station, is_fasting) VALUES
  (cat_breakfast, 'Firfir', 'ፍርፍር', 'Traditional Ethiopian breakfast with injera pieces', 120.00, 'kitchen', true),
  (cat_mains, 'Doro Wot', 'ዶሮ ወጥ', 'Spicy chicken stew with hard-boiled egg', 250.00, 'kitchen', false),
  (cat_drinks, 'Buna', 'ቡና', 'Traditional Ethiopian coffee ceremony', 50.00, 'coffee', true);
  
  -- Insert stations
  INSERT INTO stations (restaurant_id, station_type, name, enabled, description) VALUES
  (cafe_id, 'kitchen', 'Kitchen', true, 'Mains, starters, hot food'),
  (cafe_id, 'bar', 'Bar', true, 'Alcoholic drinks, mocktails'),
  (cafe_id, 'dessert', 'Dessert', false, 'Desserts, cakes, ice cream'),
  (cafe_id, 'coffee', 'Coffee', true, 'Coffee, tea, juice');
END $$;
