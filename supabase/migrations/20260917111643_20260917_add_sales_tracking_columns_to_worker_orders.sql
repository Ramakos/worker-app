/*
# Add Sales Tracking Columns to worker_orders

## Purpose
Enable per-worker sales performance tracking by storing the order's monetary value
and service mode directly on each serve-log entry, so historical sales figures
remain accurate even if the underlying order is later edited or refunded.

## Changes to existing table: worker_orders

1. New column: `amount` (numeric, nullable)
   - Stores the order's total_paid value at the moment the worker served the order.
   - Nullable so existing rows (and non-serve actions like "claimed") are not forced to have a value.
   - This is a point-in-time snapshot — later edits to the order do not change this value.

2. New column: `mode` (text, nullable)
   - Stores the order's mode (dine_in, takeaway, pickup, delivery) at the moment of serving.
   - Nullable for the same reason as amount.

3. New index: `idx_worker_orders_worker_created`
   - Composite index on (worker_id, created_at DESC) for fast per-worker date-range queries.

## Security changes (RLS)

The existing SELECT policy "All authenticated users can view worker actions"
allowed every authenticated user to read every worker's action log. This is
too broad for sales tracking — a worker should only see their own serve records.

1. DROP the existing broad SELECT policy "All authenticated users can view worker actions".
2. CREATE new SELECT policy "Workers can view own worker_orders":
   - A worker can read rows where worker_id = auth.uid().
   - A manager can read all rows (managers need visibility for performance comparison).
3. Keep the existing INSERT policy "Workers can log own actions" unchanged
   (workers can only insert rows where worker_id = auth.uid()).

## Important notes
- No data is lost: existing rows keep their current values; amount and mode are NULL for them.
- The INSERT policy already enforces worker_id = auth.uid(), so new rows are owner-scoped.
- The migration is idempotent: uses IF NOT EXISTS for columns and index, DROP IF EXISTS for policies.
*/

-- Add amount column (point-in-time order total snapshot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_orders' AND column_name = 'amount'
  ) THEN
    ALTER TABLE worker_orders ADD COLUMN amount numeric(12, 2);
  END IF;
END $$;

-- Add mode column (point-in-time order mode snapshot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'worker_orders' AND column_name = 'mode'
  ) THEN
    ALTER TABLE worker_orders ADD COLUMN mode text;
  END IF;
END $$;

-- Composite index for per-worker date-range queries
CREATE INDEX IF NOT EXISTS idx_worker_orders_worker_created
  ON worker_orders (worker_id, created_at DESC);

-- Tighten SELECT policy: workers see only their own rows, managers see all
DROP POLICY IF EXISTS "All authenticated users can view worker actions" ON worker_orders;
DROP POLICY IF EXISTS "Workers can view own worker_orders" ON worker_orders;

CREATE POLICY "Workers can view own worker_orders"
  ON worker_orders FOR SELECT
  TO authenticated
  USING (
    worker_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'manager'
    )
  );
