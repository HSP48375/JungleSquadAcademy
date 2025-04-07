/*
  # Add Referral System and Leaderboard

  1. New Tables
    - `referrals`
      - Tracks user referrals and rewards
      - Links referrer to referred user
      - Records reward status and amounts

  2. Changes
    - Add referral code to profiles table
    - Add functions for referral processing
    - Add policies for data access

  3. Security
    - Enable RLS on new table
    - Add appropriate policies for authenticated users
*/

-- Add referral code to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  coins_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text := '';
  i integer := 0;
BEGIN
  LOOP
    -- Generate 8-character code
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate referral code for new profiles
CREATE OR REPLACE FUNCTION trigger_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_referral_code();

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count integer DEFAULT 25)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  avatar_name text,
  species_name text,
  primary_color text,
  total_referrals bigint,
  coins_earned bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC, SUM(r.coins_earned) DESC) as rank,
    p.id as user_id,
    ua.avatar_name,
    as_info.name as species_name,
    ua.primary_color,
    COUNT(r.id) as total_referrals,
    COALESCE(SUM(r.coins_earned), 0) as coins_earned
  FROM profiles p
  LEFT JOIN referrals r ON r.referrer_id = p.id AND r.status = 'completed'
  LEFT JOIN user_avatar ua ON ua.user_id = p.id
  LEFT JOIN avatar_species as_info ON as_info.id = ua.species_id
  GROUP BY p.id, ua.avatar_name, as_info.name, ua.primary_color
  ORDER BY total_referrals DESC, coins_earned DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;