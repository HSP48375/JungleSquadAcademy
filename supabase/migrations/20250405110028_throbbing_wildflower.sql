/*
  # Add Referral Rewards System

  1. New Tables
    - `referral_rewards`
      - Tracks claimed tier rewards
      - Prevents duplicate claims

  2. Changes
    - Add functions for tier reward processing
    - Add policies for data access

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for authenticated users
*/

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
  bonus_amount integer NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tier)
);

-- Enable RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to check if user can claim a tier reward
CREATE OR REPLACE FUNCTION can_claim_tier_reward(
  p_user_id uuid,
  p_tier text
) RETURNS boolean AS $$
DECLARE
  v_referral_count integer;
  v_required_count integer;
  v_already_claimed boolean;
BEGIN
  -- Check if already claimed
  SELECT EXISTS (
    SELECT 1 FROM referral_rewards
    WHERE user_id = p_user_id AND tier = p_tier
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN false;
  END IF;
  
  -- Get referral count
  SELECT COUNT(*)
  INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id
  AND status = 'completed';
  
  -- Set required count based on tier
  v_required_count := CASE p_tier
    WHEN 'Diamond' THEN 25
    WHEN 'Gold' THEN 10
    WHEN 'Silver' THEN 5
    ELSE 0
  END;
  
  -- Check if eligible
  RETURN v_referral_count >= v_required_count;
END;
$$ LANGUAGE plpgsql;

-- Function to claim tier reward
CREATE OR REPLACE FUNCTION claim_tier_reward(
  p_user_id uuid,
  p_tier text
) RETURNS boolean AS $$
DECLARE
  v_bonus_amount integer;
  v_can_claim boolean;
BEGIN
  -- Check eligibility
  SELECT can_claim_tier_reward(p_user_id, p_tier) INTO v_can_claim;
  
  IF NOT v_can_claim THEN
    RETURN false;
  END IF;
  
  -- Set bonus amount based on tier
  v_bonus_amount := CASE p_tier
    WHEN 'Diamond' THEN 100
    WHEN 'Gold' THEN 50
    WHEN 'Silver' THEN 25
    ELSE 0
  END;
  
  -- Record the claim
  INSERT INTO referral_rewards (
    user_id,
    tier,
    bonus_amount
  ) VALUES (
    p_user_id,
    p_tier,
    v_bonus_amount
  );
  
  -- Award the coins
  PERFORM handle_coin_transaction(
    p_user_id,
    v_bonus_amount,
    'reward',
    p_tier || ' tier referral bonus'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral leaderboard with tier info
CREATE OR REPLACE FUNCTION get_referral_leaderboard_with_tiers(limit_count integer DEFAULT 25)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  avatar_name text,
  species_name text,
  primary_color text,
  total_referrals bigint,
  coins_earned bigint,
  tier text
) AS $$
BEGIN
  RETURN QUERY
  WITH referral_counts AS (
    SELECT
      p.id as user_id,
      COUNT(r.id) as total_referrals
    FROM profiles p
    LEFT JOIN referrals r ON r.referrer_id = p.id AND r.status = 'completed'
    GROUP BY p.id
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY rc.total_referrals DESC, COALESCE(SUM(r.coins_earned), 0) DESC) as rank,
    p.id as user_id,
    ua.avatar_name,
    as_info.name as species_name,
    ua.primary_color,
    rc.total_referrals,
    COALESCE(SUM(r.coins_earned), 0) as coins_earned,
    CASE
      WHEN rc.total_referrals >= 25 THEN 'Diamond'
      WHEN rc.total_referrals >= 10 THEN 'Gold'
      WHEN rc.total_referrals >= 5 THEN 'Silver'
      ELSE 'Bronze'
    END as tier
  FROM referral_counts rc
  JOIN profiles p ON p.id = rc.user_id
  LEFT JOIN referrals r ON r.referrer_id = p.id AND r.status = 'completed'
  LEFT JOIN user_avatar ua ON ua.user_id = p.id
  LEFT JOIN avatar_species as_info ON as_info.id = ua.species_id
  GROUP BY p.id, ua.avatar_name, as_info.name, ua.primary_color, rc.total_referrals
  ORDER BY total_referrals DESC, coins_earned DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;