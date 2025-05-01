/*
  # Create transactions table for POS system

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `subtotal` (numeric, not null)
      - `tax` (numeric, not null)
      - `total` (numeric, not null)
      - `state` (text, not null)
      - `created_at` (timestamp with time zone)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on transactions table
    - Add policies for authenticated users to:
      - Insert their own transactions
      - Read their own transactions
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);