/*
  # Add XP and Streak System

  1. New Columns
    - Add `xp_total`, `xp_today`, `xp_streak`, `last_activity_at` to profiles table
    - Add `xp_multiplier` to user_subscriptions table
    - Add `streak_reset_at` to profiles table

  2. Changes
    - Add functions for XP tracking and streak management
    - Add triggers for daily XP reset and streak updates

  3. Security
    - Maintain existing RLS policies
*/

-- Add XP and streak columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS streak_reset_at timestamptz DEFAULT (now() + interval '48 hours');

-- Add XP multiplier to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS xp_multiplier numeric DEFAULT 1.0;

-- Create function to add XP
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id uuid,
  p_amount integer,
  p_source text
)
RETURNS void AS $$
DECLARE
  v_multiplier numeric;
  v_final_amount integer;
  v_streak_bonus numeric;
  v_tier_id uuid;
BEGIN
  -- Get user's XP multiplier from subscription
  SELECT 
    COALESCE(us.xp_multiplier, 1.0),
    us.tier_id
  INTO 
    v_multiplier,
    v_tier_id
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.status = 'active';
  
  -- Calculate streak bonus (max 2x on day 7)
  SELECT 
    CASE 
      WHEN xp_streak >= 7 THEN 2.0
      WHEN xp_streak >= 5 THEN 1.5
      WHEN xp_streak >= 3 THEN 1.25
      ELSE 1.0
    END
  INTO v_streak_bonus
  FROM profiles
  WHERE id = p_user_id;
  
  -- Apply tier-specific bonuses
  IF v_tier_id IS NOT NULL THEN
    -- Elite Legend Squad (double XP)
    IF v_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'Elite Legend Squad') THEN
      v_multiplier := v_multiplier * 2.0;
    -- All Access Plan (1.5x XP)
    ELSIF v_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'All Access Plan') THEN
      v_multiplier := v_multiplier * 1.5;
    -- 5 Tutor Plan (1.25x XP)
    ELSIF v_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'All Access Plan') THEN
      v_multiplier := v_multiplier * 1.25;
    -- Single Tutor Plan (1.1x XP)
    ELSIF v_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'Single Tutor Plan') THEN
      v_multiplier := v_multiplier * 1.1;
    END IF;
  END IF;
  
  -- Calculate final XP amount with all multipliers
  v_final_amount := ROUND(p_amount * v_multiplier * v_streak_bonus);
  
  -- Update user's XP
  UPDATE profiles
  SET 
    xp_total = xp_total + v_final_amount,
    xp_today = xp_today + v_final_amount,
    last_activity_at = now(),
    streak_reset_at = now() + interval '48 hours'
  WHERE id = p_user_id;
  
  -- Log XP transaction
  INSERT INTO xp_transactions (
    user_id,
    amount,
    source,
    multiplier,
    streak_bonus,
    final_amount
  ) VALUES (
    p_user_id,
    p_amount,
    p_source,
    v_multiplier,
    v_streak_bonus,
    v_final_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_streak()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user
  FOR user_record IN SELECT id, last_activity_at, streak_reset_at FROM profiles
  LOOP
    -- If streak has expired (no activity for 48 hours)
    IF user_record.streak_reset_at < now() THEN
      -- Reset streak
      UPDATE profiles
      SET 
        xp_streak = 0,
        streak_reset_at = now() + interval '48 hours'
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset daily XP
CREATE OR REPLACE FUNCTION reset_daily_xp()
RETURNS void AS $$
DECLARE
  today_date date := current_date;
  user_record RECORD;
BEGIN
  -- For each user with activity today
  FOR user_record IN 
    SELECT 
      id, 
      xp_streak,
      (last_activity_at::date = today_date) as active_today
    FROM profiles
    WHERE last_activity_at IS NOT NULL
  LOOP
    -- Reset daily XP
    UPDATE profiles
    SET xp_today = 0
    WHERE id = user_record.id;
    
    -- If user was active today, increment streak
    IF user_record.active_today THEN
      UPDATE profiles
      SET 
        xp_streak = xp_streak + 1,
        streak_reset_at = now() + interval '48 hours'
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create XP transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL,
  multiplier numeric DEFAULT 1.0,
  streak_bonus numeric DEFAULT 1.0,
  final_amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on XP transactions
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for XP transactions
CREATE POLICY "Users can read their XP transactions"
  ON xp_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to award login XP
CREATE OR REPLACE FUNCTION award_login_xp()
RETURNS trigger AS $$
BEGIN
  -- Check if user has already received login XP today
  IF NOT EXISTS (
    SELECT 1 FROM xp_transactions
    WHERE user_id = NEW.id
    AND source = 'daily_login'
    AND created_at::date = current_date
  ) THEN
    -- Award login XP
    PERFORM add_user_xp(NEW.id, 5, 'daily_login');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for login XP
DROP TRIGGER IF EXISTS award_login_xp_trigger ON profiles;
CREATE TRIGGER award_login_xp_trigger
  AFTER UPDATE OF last_activity_at
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_login_xp();