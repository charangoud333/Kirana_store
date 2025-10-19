/*
  # Kirana Store Management System - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for a Kirana store management system.
  It includes tables for users, products, inventory transactions, sales, expenses, suppliers, and customer credit management.

  ## Tables Created

  ### 1. users
  Extended user profile table linked to auth.users
  - id (uuid, references auth.users)
  - role (text): owner, cashier, or helper
  - full_name (text)
  - phone (text)
  - status (text): active or inactive
  - created_at, updated_at (timestamptz)

  ### 2. suppliers
  Store supplier contact and payment information
  - id (uuid, primary key)
  - name (text)
  - contact_number (text)
  - email (text)
  - address (text)
  - outstanding_balance (numeric, default 0)
  - created_at, updated_at (timestamptz)

  ### 3. customers
  Track customers who buy on credit
  - id (uuid, primary key)
  - name (text)
  - contact_number (text)
  - address (text)
  - credit_limit (numeric, default 0)
  - outstanding_balance (numeric, default 0)
  - created_at, updated_at (timestamptz)

  ### 4. products
  Product catalog and inventory
  - id (uuid, primary key)
  - name (text)
  - category (text)
  - brand (text)
  - unit (text): kg, liter, piece, etc.
  - quantity (numeric, default 0)
  - buying_price (numeric)
  - selling_price (numeric)
  - supplier_id (uuid, references suppliers)
  - reorder_level (numeric, default 10)
  - expiry_date (date, nullable)
  - sku (text, unique)
  - created_at, updated_at (timestamptz)

  ### 5. purchases
  Record of stock purchases from suppliers
  - id (uuid, primary key)
  - product_id (uuid, references products)
  - supplier_id (uuid, references suppliers)
  - quantity (numeric)
  - cost_price (numeric)
  - total_amount (numeric)
  - invoice_number (text)
  - purchase_date (date)
  - notes (text)
  - created_by (uuid, references users)
  - created_at, updated_at (timestamptz)

  ### 6. sales
  Record of product sales transactions
  - id (uuid, primary key)
  - bill_number (text, unique)
  - sale_date (date)
  - payment_type (text): cash, upi, or credit
  - customer_id (uuid, references customers, nullable)
  - total_amount (numeric)
  - notes (text)
  - created_by (uuid, references users)
  - created_at, updated_at (timestamptz)

  ### 7. sale_items
  Line items for each sale
  - id (uuid, primary key)
  - sale_id (uuid, references sales)
  - product_id (uuid, references products)
  - quantity (numeric)
  - sale_price (numeric)
  - total_amount (numeric)
  - created_at (timestamptz)

  ### 8. expenses
  Daily store expenses tracking
  - id (uuid, primary key)
  - expense_type (text): rent, electricity, wages, delivery, misc
  - description (text)
  - amount (numeric)
  - expense_date (date)
  - payment_method (text): cash, upi, bank
  - created_by (uuid, references users)
  - created_at, updated_at (timestamptz)

  ### 9. payments
  Track payments to suppliers and from customers
  - id (uuid, primary key)
  - payment_type (text): supplier_payment or customer_payment
  - supplier_id (uuid, references suppliers, nullable)
  - customer_id (uuid, references customers, nullable)
  - amount (numeric)
  - payment_method (text): cash, upi, bank
  - payment_date (date)
  - notes (text)
  - created_by (uuid, references users)
  - created_at (timestamptz)

  ### 10. store_settings
  Store configuration and preferences
  - id (uuid, primary key)
  - store_name (text)
  - store_address (text)
  - store_phone (text)
  - store_email (text)
  - currency_symbol (text, default '₹')
  - low_stock_threshold (numeric, default 10)
  - tax_rate (numeric, default 0)
  - logo_url (text)
  - updated_at (timestamptz)

  ## Security
  - Row Level Security (RLS) is enabled on all tables
  - Policies are created based on user roles and ownership
  - authenticated users can access data according to their role
  - Owners have full access, cashiers have limited access, helpers are read-only

  ## Indexes
  - Added indexes on foreign keys for better query performance
  - Added indexes on commonly filtered columns (dates, status, etc.)
*/

-- Create users profile table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'cashier', 'helper')),
  full_name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_number text,
  email text,
  address text,
  outstanding_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_number text,
  address text,
  credit_limit numeric DEFAULT 0,
  outstanding_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  brand text,
  unit text DEFAULT 'piece',
  quantity numeric DEFAULT 0,
  buying_price numeric NOT NULL,
  selling_price numeric NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  reorder_level numeric DEFAULT 10,
  expiry_date date,
  sku text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity numeric NOT NULL,
  cost_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  invoice_number text,
  purchase_date date DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  sale_date date DEFAULT CURRENT_DATE,
  payment_type text NOT NULL DEFAULT 'cash' CHECK (payment_type IN ('cash', 'upi', 'credit')),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  sale_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type text NOT NULL CHECK (expense_type IN ('rent', 'electricity', 'wages', 'delivery', 'misc')),
  description text NOT NULL,
  amount numeric NOT NULL,
  expense_date date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type text NOT NULL CHECK (payment_type IN ('supplier_payment', 'customer_payment')),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank')),
  payment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text DEFAULT 'My Kirana Store',
  store_address text,
  store_phone text,
  store_email text,
  currency_symbol text DEFAULT '₹',
  low_stock_threshold numeric DEFAULT 10,
  tax_rate numeric DEFAULT 0,
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Insert default store settings
INSERT INTO store_settings (store_name) VALUES ('My Kirana Store')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_payments_supplier ON payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for suppliers table
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for customers table
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for products table
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for purchases table
CREATE POLICY "Authenticated users can view purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for sales table
CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for sale_items table
CREATE POLICY "Authenticated users can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update sale items"
  ON sale_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete sale items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for expenses table
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners and cashiers can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for payments table
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and cashiers can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'cashier')
    )
  );

CREATE POLICY "Owners can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- RLS Policies for store_settings table
CREATE POLICY "Authenticated users can view store settings"
  ON store_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can update store settings"
  ON store_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();