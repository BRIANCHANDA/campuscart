-- Professional seed: real product/shop imagery + a fuller catalog.
-- Idempotent — safe to re-run. Images are stable Unsplash CDN URLs.
BEGIN;

-- Shop covers
UPDATE shops SET image_url = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80'
  WHERE slug = 'riverside-grill';
UPDATE shops SET image_url = 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80'
  WHERE slug = 'mama-nkoloso';
UPDATE shops SET image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', address = COALESCE(address, 'Main Gate, CBU Kitwe')
  WHERE slug LIKE 'bravos-shops-%';

-- Existing products → real photos
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&h=300&fit=crop&q=80', description = 'Grilled beef, fresh salad, garlic sauce and chilli in warm pita.'
  WHERE name = 'Beef shawarma';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop&q=80', description = 'Golden chips with crispy fried chicken.'
  WHERE name = 'Chips and chicken';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop&q=80', description = 'Chilled 500ml Coca-Cola.'
  WHERE name = 'Coca-Cola 500ml';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop&q=80', description = '80-page ruled A4 notebook.'
  WHERE name = 'A4 notebook';

-- A fuller catalog so the feed reads like a real store.
-- Riverside Grill (food)
INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Classic beef burger', 'Beef patty, cheddar, lettuce, tomato and house sauce.', 'food', 6500, 'ZMW', 24,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug = 'riverside-grill'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Classic beef burger');

INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Pepperoni pizza', 'Wood-fired 9-inch pepperoni pizza.', 'food', 8500, 'ZMW', 12,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug = 'riverside-grill'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pepperoni pizza');

INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Grilled chicken wrap', 'Grilled chicken, veggies and garlic mayo.', 'food', 5200, 'ZMW', 3,
  'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug = 'riverside-grill'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Grilled chicken wrap');

-- Mama Nkoloso (drinks + snacks)
INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Fresh orange juice', 'Freshly squeezed, 400ml.', 'drinks', 2200, 'ZMW', 30,
  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug = 'mama-nkoloso'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Fresh orange juice');

INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Cappuccino', 'Hot cappuccino to keep you going through lectures.', 'drinks', 1800, 'ZMW', 40,
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug = 'mama-nkoloso'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cappuccino');

-- Bravos (stationery + electronics)
INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Ballpoint pens (10 pack)', 'Smooth-writing blue ballpoint pens.', 'stationery', 4500, 'ZMW', 50,
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug LIKE 'bravos-shops-%'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Ballpoint pens (10 pack)');

INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Study textbook set', 'Second-hand engineering reference books.', 'books', 12000, 'ZMW', 6,
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug LIKE 'bravos-shops-%'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Study textbook set');

INSERT INTO products (shop_id, name, description, category, price_minor, currency, stock_qty, image_url, is_active)
SELECT id, 'Wired earphones', 'In-ear wired earphones with mic.', 'electronics', 8000, 'ZMW', 15,
  'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop&q=80', true
FROM shops WHERE slug LIKE 'bravos-shops-%'
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wired earphones');

COMMIT;
SELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM shops WHERE image_url IS NOT NULL) AS shops_with_cover;
