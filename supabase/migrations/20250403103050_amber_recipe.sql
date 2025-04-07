/*
  # Add Jungle Coins System

  1. New Tables
    - `user_coins`
      - Tracks user's coin balance and cooldown timers
    - `coin_purchases`
      - Records coin purchase transactions
    - `coin_transactions`
      - Logs all coin-related activities (spending, earning, etc.)

  2. Changes
    - Add coin requirements to games table
    - Add coin rewards to challenge completions

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create user_coins table
CREATE TABLE IF NOT EXISTS user_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  balance integer DEFAULT 5 NOT NULL,
  last_free_coin_at timestamptz DEFAULT now(),
  next_free_coin_at timestamptz DEFAULT now() + interval '2 hours',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Create coin_purchases table
CREATE TABLE IF NOT EXISTS coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  cost_usd numeric(10,2) NOT NULL,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('spend', 'earn', 'purchase', 'reward')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add coin requirements to games
ALTER TABLE daily_challenges 
ADD COLUMN coin_cost integer DEFAULT 0,
ADD COLUMN coin_reward integer DEFAULT 0;

-- Enable RLS
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own coin balance"
  ON user_coins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their coin purchases"
  ON coin_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their coin transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle coin transactions
CREATE OR REPLACE FUNCTION handle_coin_transaction(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text
) RETURNS void AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);

  -- Update user balance
  UPDATE user_coins
  SET 
    balance = CASE 
      WHEN p_type IN ('earn', 'purchase', 'reward') THEN balance + p_amount
      WHEN p_type = 'spend' THEN balance - p_amount
      ELSE balance
    END,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can earn free coin
CREATE OR REPLACE FUNCTION can_earn_free_coin(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  last_coin_time timestamptz;
BEGIN
  SELECT next_free_coin_at INTO last_coin_time
  FROM user_coins
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(last_coin_time <= now(), true);
END;
$$ LANGUAGE plpgsql;

-- Create function to earn free coin
CREATE OR REPLACE FUNCTION earn_free_coin(p_user_id uuid)
RETURNS void AS $$
BEGIN
  IF can_earn_free_coin(p_user_id) THEN
    -- Update coin balance and timestamps
    UPDATE user_coins
    SET 
      balance = balance + 1,
      last_free_coin_at = now(),
      next_free_coin_at = now() + interval '2 hours'
    WHERE user_id = p_user_id;

    -- Record transaction
    PERFORM handle_coin_transaction(p_user_id, 1, 'earn', 'Free coin earned');
  END IF;
END;
$$ LANGUAGE plpgsql;