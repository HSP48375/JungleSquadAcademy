/*
  # Update Subscription Tiers and Prices

  1. Changes
    - Add new subscription tiers with updated pricing
    - Add unique constraint on stripe_price_id
    - Add new columns for features and perks
    - Add subscription access control
*/

-- Ensure stripe_price_id is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscription_tiers_stripe_price_id_key'
  ) THEN
    ALTER TABLE subscription_tiers
    ADD CONSTRAINT subscription_tiers_stripe_price_id_key UNIQUE (stripe_price_id);
  END IF;
END $$;

-- Add new columns if they don't exist
ALTER TABLE subscription_tiers
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS perks jsonb DEFAULT '{}'::jsonb;

-- Insert or update subscription tiers
INSERT INTO subscription_tiers (
  name,
  price,
  tutor_limit,
  questions_per_week,
  stripe_price_id,
  features,
  perks
) VALUES
  (
    'Single Tutor Plan',
    4.99,
    1,
    -1,
    'price_single_tutor',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    '5 Tutor Plan',
    19.99,
    5,
    -1,
    'price_five_tutors',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'All Access Plan',
    29.99,
    -1,
    -1,
    'price_all_access',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{"premium_features": true}'::jsonb
  ),
  (
    'Elite Legend Squad',
    49.99,
    -1,
    -1,
    'price_elite_legend',
    '{"curriculum": true, "games": true, "flashcards": true, "challenges": true, "analytics": true}'::jsonb,
    '{"premium_features": true, "double_xp": true, "exclusive_cosmetics": true, "beta_access": true}'::jsonb
  )
ON CONFLICT ON CONSTRAINT subscription_tiers_stripe_price_id_key
DO UPDATE SET
  price = EXCLUDED.price,
  tutor_limit = EXCLUDED.tutor_limit,
  features = EXCLUDED.features,
  perks = EXCLUDED.perks;

-- Add function to check subscription access
CREATE OR REPLACE FUNCTION check_subscription_access(
  p_user_id uuid,
  p_tutor_id uuid
) RETURNS boolean AS $$
DECLARE
  v_subscription record;
  v_tutor_count integer;
BEGIN
  -- Get user's subscription
  SELECT s.*, t.tutor_limit
  INTO v_subscription
  FROM user_subscriptions s
  JOIN subscription_tiers t ON t.id = s.tier_id
  WHERE s.user_id = p_user_id
  AND s.status = 'active';

  -- No active subscription
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Unlimited tutors
  IF v_subscription.tutor_limit = -1 THEN
    RETURN true;
  END IF;

  -- Check if tutor is in user's allowed list
  SELECT COUNT(*)
  INTO v_tutor_count
  FROM user_tutors
  WHERE user_id = p_user_id;

  -- Check if under limit and tutor is allowed
  RETURN v_tutor_count < v_subscription.tutor_limit
    OR EXISTS (
      SELECT 1 FROM user_tutors
      WHERE user_id = p_user_id
      AND tutor_id = p_tutor_id
    );
END;
$$ LANGUAGE plpgsql;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Check subscription for tutor access" ON tutors;

-- Add policies for subscription-based access
CREATE POLICY "Check subscription for tutor access"
  ON tutors
  FOR SELECT
  TO authenticated
  USING (
    check_subscription_access(auth.uid(), id)
    OR id IN (
      SELECT tutor_id
      FROM daily_challenges
      WHERE expires_at > now()
      LIMIT 1
    )
  );