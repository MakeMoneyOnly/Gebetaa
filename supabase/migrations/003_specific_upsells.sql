
-- Specific pairings for Kitfo
UPDATE items 
SET pairings = (
  SELECT array_agg(id) 
  FROM items 
  WHERE name ILIKE '%Ayibe%' OR name ILIKE '%Kocho%' OR name ILIKE '%Gomen%'
)
WHERE name ILIKE '%Kitfo%';

-- Specific pairings for Burgers
UPDATE items 
SET pairings = (
  SELECT array_agg(id) 
  FROM items 
  WHERE name ILIKE '%Fries%' OR name ILIKE '%Onion%' OR name ILIKE '%Beer%'
)
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Burger%');

-- Specific pairings for Pizza
UPDATE items 
SET pairings = (
  SELECT array_agg(id) 
  FROM items 
  WHERE name ILIKE '%Garlic Bread%' OR name ILIKE '%Coke%' OR name ILIKE '%Sprite%'
)
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%Pizza%');
