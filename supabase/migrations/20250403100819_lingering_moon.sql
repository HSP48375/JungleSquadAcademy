/*
  # Update subscription system tables

  1. Changes
    - Safely update subscription tiers with new pricing
    - Add any missing policies
    - Update existing subscription tiers with new prices
*/

-- Update subscription tier prices and features
DO $$ 
BEGIN
  -- Update existing tiers if they exist, otherwise do nothing
  UPDATE subscription_tiers
  SET 
    price = CASE name
      WHEN 'Basic' THEN 4.99
      WHEN 'Pro' THEN 14.99
      WHEN 'Ultimate' THEN 24.99
      ELSE price
    END,
    tutor_limit = CASE name
      WHEN 'Free' THEN 1
      WHEN 'Basic' THEN 1
      WHEN 'Pro' THEN 5
      WHEN 'Ultimate' THEN -1
      ELSE tutor_limit
    END,
    questions_per_week = CASE name
      WHEN 'Free' THEN 5
      WHEN 'Basic' THEN -1
      WHEN 'Pro' THEN -1
      WHEN 'Ultimate' THEN -1
      ELSE questions_per_week
    END
  WHERE name IN ('Free', 'Basic', 'Pro', 'Ultimate');

  -- Insert tiers if they don't exist
  INSERT INTO subscription_tiers (name, price, tutor_limit, questions_per_week, stripe_price_id)
  SELECT d.*
  FROM (VALUES
    ('Free', 0, 1, 5, 'price_free'),
    ('Basic', 4.99, 1, -1, 'price_basic'),
    ('Pro', 14.99, 5, -1, 'price_pro'),
    ('Ultimate', 24.99, -1, -1, 'price_ultimate')
  ) AS d(name, price, tutor_limit, questions_per_week, stripe_price_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM subscription_tiers WHERE name = d.name
  );
END $$;

-- Ensure RLS is enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscription_tiers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_subscriptions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_tutors' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_tutors ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Recreate policies (will not error if they already exist)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read subscription tiers" ON subscription_tiers;
  DROP POLICY IF EXISTS "Users can read their own subscriptions" ON user_subscriptions;
  DROP POLICY IF EXISTS "Users can read their tutor access" ON user_tutors;
  
  -- Create new policies
  CREATE POLICY "Anyone can read subscription tiers"
    ON subscription_tiers
    FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Users can read their own subscriptions"
    ON user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can read their tutor access"
    ON user_tutors
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
END $$;