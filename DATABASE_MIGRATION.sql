-- =====================================================
-- KIRANA STORE DATABASE MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- 2. Add missing columns to sales table  
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Add missing columns to sale_items table
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 4. Add missing columns to purchases table
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);

-- 6. Update RLS policies for new columns
-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
  -- Drop and recreate sales policies
  DROP POLICY IF EXISTS "Users can read own sales" ON sales;
  DROP POLICY IF EXISTS "Users can insert sales" ON sales;
  DROP POLICY IF EXISTS "Users can read sale_items" ON sale_items;
  DROP POLICY IF EXISTS "Users can insert sale_items" ON sale_items;
END $$;

-- Create policies
CREATE POLICY "Users can read own sales"
  ON sales FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'owner'
  ));

CREATE POLICY "Users can insert sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read sale_items"
  ON sale_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert sale_items"
  ON sale_items FOR INSERT
  WITH CHECK (true);

-- 7. Create a function to migrate existing data (optional)
-- This moves supplier_id data to supplier_name
CREATE OR REPLACE FUNCTION migrate_supplier_data()
RETURNS void AS $$
BEGIN
  -- Migrate products
  UPDATE products p
  SET supplier_name = s.name
  FROM suppliers s
  WHERE p.supplier_id = s.id
    AND p.supplier_name IS NULL;

  -- Migrate purchases
  UPDATE purchases pu
  SET supplier_name = s.name
  FROM suppliers s
  WHERE pu.supplier_id = s.id
    AND pu.supplier_name IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Run the migration (uncomment to execute)
-- SELECT migrate_supplier_data();

-- 9. Create expense categories table (if not exists)
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Add category to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 11. Insert default expense categories
INSERT INTO expense_categories (name) VALUES
  ('Rent'),
  ('Utilities'),
  ('Salaries'),
  ('Supplies'),
  ('Marketing'),
  ('Maintenance'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- =====================================================

-- Check products table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('supplier_name');

-- Check sales table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('customer_name');

-- Check sale_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
  AND column_name IN ('product_name');

-- Check expenses table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND column_name IN ('category');

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

-- Uncomment and run if you need to rollback
/*
ALTER TABLE products DROP COLUMN IF EXISTS supplier_name;
ALTER TABLE sales DROP COLUMN IF EXISTS customer_name;
ALTER TABLE sale_items DROP COLUMN IF EXISTS product_name;
ALTER TABLE purchases DROP COLUMN IF EXISTS supplier_name;
ALTER TABLE expenses DROP COLUMN IF EXISTS category;
DROP TABLE IF EXISTS expense_categories;
DROP FUNCTION IF EXISTS migrate_supplier_data();
*/
