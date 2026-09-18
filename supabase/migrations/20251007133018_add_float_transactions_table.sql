/*
  # Add Float Transactions Table

  This migration adds support for multiple float transactions per shift.
  Workers can now take and return multiple floats during a single shift.
  
  ## New Tables
  
  ### float_transactions
  - `id` (uuid, primary key) - Unique transaction ID
  - `shift_id` (uuid, foreign key) - Links to worker_shifts
  - `user_id` (uuid, foreign key) - Worker who performed transaction
  - `transaction_type` (text) - 'take' or 'return'
  - `amount` (numeric) - Amount taken or returned
  - `created_at` (timestamptz) - Transaction timestamp
  
  ## Security
  
  - Enable RLS on float_transactions table
  - Workers can view their own transactions
  - Workers can create transactions for their own shifts
  
  ## Changes to worker_shifts
  
  - Keep amount_taken_float and amount_returned_float for backward compatibility
  - These will now store cumulative totals
*/

-- Create float_transactions table
CREATE TABLE IF NOT EXISTS float_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES worker_shifts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('take', 'return')),
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE float_transactions ENABLE ROW LEVEL SECURITY;

-- Workers can view their own transactions
CREATE POLICY "Workers can view own float transactions"
  ON float_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Workers can create transactions for their own shifts
CREATE POLICY "Workers can create own float transactions"
  ON float_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_float_transactions_shift_id ON float_transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_float_transactions_user_id ON float_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_float_transactions_created_at ON float_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_float_transactions_type ON float_transactions(transaction_type);
