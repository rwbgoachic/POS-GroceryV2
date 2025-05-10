/*
  # Add expiry date tracking for products

  1. Changes
    - Add expiry_date column to products table
    - Create function to check for expiring products
    - Create cron job trigger for expiry alerts

  2. Security
    - Maintain existing RLS policies
*/

-- Add expiry_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE products ADD COLUMN expiry_date timestamptz;
  END IF;
END $$;

-- Function to check for expiring products
CREATE OR REPLACE FUNCTION check_expiring_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert alerts for products expiring in the next 7 days
  INSERT INTO alerts (product_id, type, message, created_at)
  SELECT 
    id,
    'expiry_warning',
    'Product expiring in ' || 
    EXTRACT(DAY FROM (expiry_date - CURRENT_TIMESTAMP)) || ' days',
    CURRENT_TIMESTAMP
  FROM products
  WHERE 
    expiry_date IS NOT NULL
    AND expiry_date > CURRENT_TIMESTAMP
    AND expiry_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
    AND id NOT IN (
      SELECT product_id 
      FROM alerts 
      WHERE type = 'expiry_warning' 
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    );
END;
$$;

-- Create cron job trigger (runs daily at midnight)
SELECT cron.schedule(
  'check-expiring-products',
  '0 0 * * *',
  'SELECT check_expiring_products()'
);