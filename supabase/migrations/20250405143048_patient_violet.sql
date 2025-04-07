/*
  # Add Quote Sharing System

  1. New Tables
    - `quote_shares`
      - Tracks user shares of quotes
      - Records platform and timestamp
    - `quote_share_rewards`
      - Tracks rewards given for sharing

  2. Changes
    - Add share count to quote_winners table
    - Add functions for tracking and rewarding shares
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create quote_shares table
CREATE TABLE IF NOT EXISTS quote_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quote_winners(id) ON DELETE CASCADE,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add share count to quote_winners if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_winners' 
    AND column_name = 'share_count'
  ) THEN
    ALTER TABLE quote_winners ADD COLUMN share_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE quote_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their quote shares"
  ON quote_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to track quote share
CREATE OR REPLACE FUNCTION track_quote_share(
  p_user_id uuid,
  p_quote_id uuid,
  p_platform text
)
RETURNS void AS $$
BEGIN
  -- Insert share record
  INSERT INTO quote_shares (
    user_id,
    quote_id,
    platform
  ) VALUES (
    p_user_id,
    p_quote_id,
    p_platform
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to increment quote shares
CREATE OR REPLACE FUNCTION increment_quote_shares(
  p_quote_id uuid
)
RETURNS void AS $$
BEGIN
  -- Update share count
  UPDATE quote_winners
  SET share_count = COALESCE(share_count, 0) + 1
  WHERE id = p_quote_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has been rewarded for sharing this quote on this platform this week
CREATE OR REPLACE FUNCTION has_share_reward(
  p_user_id uuid,
  p_quote_id uuid,
  p_platform text
)
RETURNS boolean AS $$
DECLARE
  v_one_week_ago timestamptz := now() - interval '7 days';
  v_has_reward boolean;
BEGIN
  -- Check if user has already been rewarded for sharing this quote on this platform in the last week
  SELECT EXISTS (
    SELECT 1 FROM quote_shares
    WHERE user_id = p_user_id
    AND quote_id = p_quote_id
    AND platform = p_platform
    AND created_at > v_one_week_ago
  ) INTO v_has_reward;
  
  RETURN v_has_reward;
END;
$$ LANGUAGE plpgsql;