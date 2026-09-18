/*
  # Add Active Column and Worker Orders Audit Table

  ## Changes Made
  
  ### 1. worker_shifts Table Enhancement
  - **Add `active` column** (boolean, default TRUE)
    - Tracks whether a shift is currently active
    - Provides explicit state management instead of relying on `ended_at IS NULL`
    - Indexed for fast lookups of active shifts
  - **Update existing shifts**: Set `active = FALSE` where `ended_at IS NOT NULL`
  
  ### 2. worker_orders Audit Table (NEW)
  - **Purpose**: Track all worker actions on orders for audit trail
  - **Columns**:
    - `id` (uuid, primary key) - Unique identifier
    - `order_id` (integer, foreign key) - Links to orders table
    - `worker_id` (uuid, foreign key) - Worker performing action
    - `action` (text) - Action type: 'CLAIMED', 'SERVED', 'DELIVERED'
    - `created_at` (timestamptz) - When action occurred
  - **Constraints**:
    - Foreign keys to orders and user_profiles
    - CHECK constraint on action values
  
  ### 3. Security (RLS Policies)
  - **worker_orders table**:
    - Workers can view their own actions
    - Workers can insert their own actions
    - All authenticated users can view all worker actions (for transparency)
  
  ### 4. Indexes
  - `worker_shifts.active` - Fast lookup of active shifts
  - `worker_orders.order_id` - Fast lookup by order
  - `worker_orders.worker_id` - Fast lookup by worker
  - `worker_orders.created_at` - Chronological queries
  
  ## Important Notes
  
  1. This migration is safe and backwards compatible
  2. Existing shifts with `ended_at IS NOT NULL` are automatically set to `active = FALSE`
  3. New shifts should set `active = TRUE` on INSERT
  4. The worker_orders table provides complete audit trail of order handling
  5. All changes maintain referential integrity with existing tables
*/

-- Add active column to worker_shifts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'worker_shifts' AND column_name = 'active'
  ) THEN
    ALTER TABLE worker_shifts ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Update existing shifts: set active = FALSE where ended_at is not null
UPDATE worker_shifts SET active = false WHERE ended_at IS NOT NULL;

-- Update existing shifts: set active = TRUE where ended_at is null
UPDATE worker_shifts SET active = true WHERE ended_at IS NULL;

-- Create index on active column for fast lookups
CREATE INDEX IF NOT EXISTS idx_worker_shifts_active ON worker_shifts(active) WHERE active = true;

-- Create worker_orders audit table
CREATE TABLE IF NOT EXISTS worker_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id integer REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('CLAIMED', 'SERVED', 'DELIVERED', 'CANCELLED')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on worker_orders
ALTER TABLE worker_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_orders
CREATE POLICY "Workers can view own actions"
  ON worker_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = worker_id);

CREATE POLICY "All authenticated users can view worker actions"
  ON worker_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Workers can log own actions"
  ON worker_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

-- Create indexes for worker_orders
CREATE INDEX IF NOT EXISTS idx_worker_orders_order_id ON worker_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_worker_orders_worker_id ON worker_orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_orders_created_at ON worker_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_orders_action ON worker_orders(action);