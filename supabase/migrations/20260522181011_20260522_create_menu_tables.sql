/*
  # Create Menu Reference Tables

  1. New Tables
    - `menu_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `sort_order` (integer) - Display order
      - `created_at` (timestamp)
    - `menu_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to menu_categories)
      - `name` (text) - Item name
      - `price` (numeric) - Item price in GHS
      - `is_available` (boolean) - Whether item is currently available
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - All authenticated users can read (servers need to view menu)
    - Only managers can insert/update/delete (menu management)

  3. Seed Data
    - Sample categories: Mains, Drinks, Sides, Specials
    - Sample items with realistic Ghana restaurant prices
*/

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policies for menu_categories
CREATE POLICY "Authenticated users can view categories"
  ON menu_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage categories"
  ON menu_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'manager'
    )
  );

-- Policies for menu_items
CREATE POLICY "Authenticated users can view menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'manager'
    )
  );

-- Seed categories
INSERT INTO menu_categories (name, sort_order) VALUES
  ('Mains', 1),
  ('Drinks', 2),
  ('Sides', 3),
  ('Specials', 4);

-- Seed menu items (Ghana restaurant pricing in GHS)
INSERT INTO menu_items (category_id, name, price, is_available) VALUES
  -- Mains
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Jollof Rice with Chicken', 25.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Jollof Rice with Fish', 28.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Waakye with Wele', 20.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Waakye with Fish', 28.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Fufu with Light Soup', 30.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Banku with Tilapia', 35.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Kenkey with Fish', 22.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Fried Rice with Chicken', 28.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Mains'), 'Plain Rice with Stew', 18.00, true),
  -- Drinks
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Sobolo', 5.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Palm Wine', 8.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Club Beer', 10.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Guinness', 12.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Malt', 8.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Coca-Cola', 6.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'FanChoco', 5.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Drinks'), 'Mineral Water', 3.00, true),
  -- Sides
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Extra Meat', 15.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Extra Fish', 18.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Shito', 3.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Salad', 8.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Avocado', 10.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Sides'), 'Kelewele', 12.00, true),
  -- Specials
  ((SELECT id FROM menu_categories WHERE name = 'Specials'), 'Grilled Tilapia Full', 55.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Specials'), 'Grilled Tilapia Half', 32.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Specials'), 'Goat Meat Special', 45.00, true),
  ((SELECT id FROM menu_categories WHERE name = 'Specials'), 'Jollof Party Pack', 120.00, true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON menu_categories(sort_order);
