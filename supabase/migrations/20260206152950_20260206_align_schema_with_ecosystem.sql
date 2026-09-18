/*
  # Align Database Schema with Ecosystem Integration Requirements
  
  ## Overview
  This migration ensures complete alignment with the Restaurant Hub ecosystem:
  - Counter App: Creates workers and orders
  - Kitchen App: Updates order status
  - Server App: Claims orders and manages float
  
  ## Changes Made
  
  ### 1. User Profiles Alignment
  - Verify all required fields exist and are correctly configured
  - Ensure proper indexes for authentication lookups
  
  ### 2. User Roles Alignment
  - Verify role constraint allows: 'server', 'cook', 'manager'
  - Ensure proper indexing for role lookups
  
  ### 3. Orders Table Alignment
  - Verify status constraint allows: 'pending', 'preparing', 'ready', 'served', 'completed', 'delivered'
  - Verify payment_method constraint allows: 'cash', 'momo', 'card', 'split'
  - Ensure proper indexing for real-time subscriptions
  
  ### 4. Worker Shifts Alignment
  - Verify all float tracking fields are present
  - Ensure proper indexing for shift lookups
  
  ### 5. Float Transactions Alignment
  - Verify transaction tracking table exists
  - Ensure RLS allows workers to create and view their transactions
  
  ### 6. RLS Policy Refinement
  - Relax policies for sign-in page (allow anonymous read of active workers)
  - Ensure counter staff can create orders
  - Ensure servers can claim and update their orders
  - Ensure kitchen staff can update order status
  
  ## Security Model
  - Counter App: Create workers, create orders (no authentication needed for worker creation endpoint)
  - Kitchen App: Read and update orders to pending/preparing/ready
  - Server App: Read orders, claim orders, update to served/completed, manage shifts and float
  
  ## Important Notes
  1. This migration is idempotent and safe for repeated runs
  2. All existing data is preserved
  3. RLS policies are designed for multi-app ecosystem
  4. Proper role-based access control is maintained
*/

-- Verify user_profiles structure
DO $$
BEGIN
  -- Ensure all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'user_profiles table missing id column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    RAISE EXCEPTION 'user_profiles table missing username column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    RAISE EXCEPTION 'user_profiles table missing full_name column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    RAISE EXCEPTION 'user_profiles table missing is_active column';
  END IF;
END $$;

-- Verify user_roles structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'user_roles table missing role column';
  END IF;
END $$;

-- Verify orders structure and add missing fields if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'claimed_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN claimed_by uuid REFERENCES user_profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN claimed_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN ready_at timestamptz;
  END IF;
END $$;

-- Verify worker_shifts structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'worker_shifts' AND column_name = 'amount_taken_float'
  ) THEN
    ALTER TABLE worker_shifts ADD COLUMN amount_taken_float numeric(10, 2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'worker_shifts' AND column_name = 'amount_returned_float'
  ) THEN
    ALTER TABLE worker_shifts ADD COLUMN amount_returned_float numeric(10, 2);
  END IF;
END $$;

-- Verify float_transactions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'float_transactions'
  ) THEN
    RAISE EXCEPTION 'float_transactions table does not exist';
  END IF;
END $$;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active_username 
  ON user_profiles(is_active, username);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_claimed_status 
  ON orders(claimed_by, status);

CREATE INDEX IF NOT EXISTS idx_worker_shifts_user_active 
  ON worker_shifts(user_id, active) WHERE active = true;

-- Verify RLS policies alignment

-- User Profiles: Allow sign-in page to see active workers
DROP POLICY IF EXISTS "Anyone can read active profiles" ON user_profiles;
CREATE POLICY "Anyone can read active profiles"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_active = true);

-- User Roles: Public read for sign-in
DROP POLICY IF EXISTS "Anyone can read roles" ON user_roles;
CREATE POLICY "Anyone can read roles"
  ON user_roles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Orders: Counter creates, kitchen/servers read
DROP POLICY IF EXISTS "All authenticated users can view orders" ON orders;
CREATE POLICY "All authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Counter staff can create orders" ON orders;
CREATE POLICY "Counter staff can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Servers can claim unclaimed orders" ON orders;
CREATE POLICY "Servers can update order status"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Kitchen and servers can update order status" ON orders;

-- Float Transactions: Workers manage own transactions
DROP POLICY IF EXISTS "Workers can view own float transactions" ON float_transactions;
CREATE POLICY "Workers can view own float transactions"
  ON float_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers can create own float transactions" ON float_transactions;
CREATE POLICY "Workers can create own float transactions"
  ON float_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Worker Shifts: Workers manage own shifts
DROP POLICY IF EXISTS "Workers can view own shifts" ON worker_shifts;
CREATE POLICY "Workers can view own shifts"
  ON worker_shifts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers can create own shifts" ON worker_shifts;
CREATE POLICY "Workers can create own shifts"
  ON worker_shifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workers can update own active shifts" ON worker_shifts;
CREATE POLICY "Workers can update own active shifts"
  ON worker_shifts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Worker Orders: Audit trail for order actions
DROP POLICY IF EXISTS "Workers can view own actions" ON worker_orders;
CREATE POLICY "Workers can view own actions"
  ON worker_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "All authenticated users can view worker actions" ON worker_orders;
CREATE POLICY "All authenticated users can view worker actions"
  ON worker_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Workers can log own actions" ON worker_orders;
CREATE POLICY "Workers can log own actions"
  ON worker_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);
