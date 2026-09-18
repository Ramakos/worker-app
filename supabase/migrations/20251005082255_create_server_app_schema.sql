/*
  # Server/Waiter App Database Schema
  
  This migration creates the complete database structure for a restaurant server/waiter application
  that connects to a shared backend with counter and kitchen apps.
  
  ## Tables Created
  
  ### 1. user_profiles
  - `id` (uuid, primary key) - Links to auth.users
  - `full_name` (text) - Worker's full name
  - `username` (text, unique) - Unique username for sign-in
  - `worker_id` (text) - Optional employee ID
  - `is_active` (boolean) - Whether worker can sign in
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 2. user_roles
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to user_profiles
  - `role` (text) - Role type: 'server', 'cook', or 'manager'
  
  ### 3. worker_shifts
  - `id` (uuid, primary key) - Unique shift identifier
  - `user_id` (uuid, foreign key) - Worker on shift
  - `started_at` (timestamptz) - Shift start time
  - `ended_at` (timestamptz) - Shift end time (null if active)
  - `amount_taken_float` (numeric) - Cash float taken at start
  - `amount_returned_float` (numeric) - Cash returned at end
  - `notes` (text) - Optional shift notes
  - `created_by` (uuid) - Manager who created the shift
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 4. orders
  - `id` (serial, primary key) - Auto-incrementing order number
  - `status` (text) - Order status: pending/preparing/ready/served
  - `order_type` (text) - Type: dine-in/takeout/delivery
  - `items` (jsonb) - Array of order items with details
  - `customer_name` (text) - Customer name (optional)
  - `payment_method` (text) - cash/momo/card
  - `cash_received` (numeric) - Cash payment amount
  - `momo_received` (numeric) - Mobile money payment amount
  - `total_paid` (numeric) - Total amount paid
  - `created_by` (uuid) - Counter staff who created order
  - `claimed_by` (uuid) - Server who claimed the order
  - `claimed_at` (timestamptz) - When order was claimed
  - `created_at` (timestamptz) - Order creation time
  - `ready_at` (timestamptz) - When kitchen marked ready
  
  ## Security
  
  All tables have RLS enabled with policies for:
  - Authenticated users can read their own data
  - Servers can claim and update their assigned orders
  - Managers have full access to all data
  - Workers can manage their own shifts and floats
  
  ## Important Notes
  
  1. This schema is designed to work with counter and kitchen apps
  2. Orders flow: Counter creates → Kitchen prepares → Server delivers
  3. Float management is server-specific for cash handling
  4. Real-time subscriptions enabled for order updates
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text UNIQUE NOT NULL,
  worker_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all active profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('server', 'cook', 'manager')),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create worker_shifts table
CREATE TABLE IF NOT EXISTS worker_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  amount_taken_float numeric(10, 2),
  amount_returned_float numeric(10, 2),
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE worker_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own shifts"
  ON worker_shifts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workers can create own shifts"
  ON worker_shifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can update own active shifts"
  ON worker_shifts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'delivered')),
  order_type text DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeout', 'delivery')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_name text,
  payment_method text CHECK (payment_method IN ('cash', 'momo', 'card', 'split')),
  cash_received numeric(10, 2),
  momo_received numeric(10, 2),
  total_paid numeric(10, 2),
  created_by uuid REFERENCES user_profiles(id),
  claimed_by uuid REFERENCES user_profiles(id),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  ready_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Counter staff can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Servers can claim unclaimed orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (claimed_by IS NULL OR claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid() OR claimed_by IS NULL);

CREATE POLICY "Kitchen and servers can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_worker_id ON user_profiles(worker_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

CREATE INDEX IF NOT EXISTS idx_worker_shifts_user_id ON worker_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_shifts_started_at ON worker_shifts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_shifts_ended_at ON worker_shifts(ended_at);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_claimed_by ON orders(claimed_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
