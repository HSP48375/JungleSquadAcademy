/*
  # Fix Quote Competition System Migrations

  1. Changes
    - Safely check for existing tables, policies, and functions
    - Use IF NOT EXISTS for all table creation statements
    - Drop existing policies and functions before recreating them
    - Wrap operations in transaction blocks for safety
    - Ensure idempotent operations that can be run multiple times

  2. Security
    - Maintain all existing RLS policies
    - Ensure proper access control for quote competition system
*/

-- Wrap everything in a transaction for safety
BEGIN;

-- Create quote_themes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create quote_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES quote_themes(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT quote_length CHECK (char_length(quote_text) <= 180),
  UNIQUE(user_id, theme_id)
);

-- Create quote_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES quote_entries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_id)
);

-- Create quote_winners table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES quote_entries(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES quote_themes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  votes_count integer NOT NULL,
  coins_awarded integer NOT NULL DEFAULT 50,
  xp_awarded integer NOT NULL DEFAULT 100,
  announced_at timestamptz DEFAULT now(),
  UNIQUE(theme_id)
);

-- Enable RLS with safety checks
DO $$ 
BEGIN
  -- Enable RLS on tables if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'quote_themes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quote_themes ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'quote_entries' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quote_entries ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'quote_votes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quote_votes ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'quote_winners' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quote_winners ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies with safety checks
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read quote themes" ON quote_themes;
  DROP POLICY IF EXISTS "Users can submit one quote per theme" ON quote_entries;
  DROP POLICY IF EXISTS "Users can read all quote entries" ON quote_entries;
  DROP POLICY IF EXISTS "Users can vote once per entry" ON quote_votes;
  DROP POLICY IF EXISTS "Users can read all votes" ON quote_votes;
  DROP POLICY IF EXISTS "Anyone can read quote winners" ON quote_winners;
  
  -- Create new policies
  CREATE POLICY "Anyone can read quote themes"
    ON quote_themes FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can submit one quote per theme"
    ON quote_entries FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id = auth.uid() AND
      NOT EXISTS (
        SELECT 1 FROM quote_entries
        WHERE user_id = auth.uid() AND theme_id = NEW.theme_id
      )
    );

  CREATE POLICY "Users can read all quote entries"
    ON quote_entries FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can vote once per entry"
    ON quote_votes FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id = auth.uid() AND
      NOT EXISTS (
        SELECT 1 FROM quote_votes
        WHERE user_id = auth.uid() AND entry_id = NEW.entry_id
      ) AND
      NOT EXISTS (
        SELECT 1 FROM quote_entries qe
        JOIN quote_votes qv ON qv.entry_id = qe.id
        WHERE qv.user_id = auth.uid()
        AND qe.theme_id = (
          SELECT theme_id FROM quote_entries WHERE id = NEW.entry_id
        )
        AND qv.created_at::date = CURRENT_DATE
      )
    );

  CREATE POLICY "Users can read all votes"
    ON quote_votes FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Anyone can read quote winners"
    ON quote_winners FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Create or replace functions with safety checks
DO $$
BEGIN
  -- Drop existing functions if they exist
  DROP FUNCTION IF EXISTS get_active_quote_theme();
  DROP FUNCTION IF EXISTS get_entry_vote_count(uuid);
  DROP FUNCTION IF EXISTS has_voted_today(uuid, uuid);
  DROP FUNCTION IF EXISTS select_quote_winner(uuid);
END $$;

-- Create new functions
CREATE OR REPLACE FUNCTION get_active_quote_theme()
RETURNS uuid AS $$
DECLARE
  v_theme_id uuid;
BEGIN
  SELECT id INTO v_theme_id
  FROM quote_themes
  WHERE is_active = true
  AND now() BETWEEN start_date AND end_date
  ORDER BY start_date DESC
  LIMIT 1;
  
  RETURN v_theme_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_entry_vote_count(p_entry_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM quote_votes
  WHERE entry_id = p_entry_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_voted_today(p_user_id uuid, p_theme_id uuid)
RETURNS boolean AS $$
DECLARE
  v_has_voted boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM quote_votes qv
    JOIN quote_entries qe ON qe.id = qv.entry_id
    WHERE qv.user_id = p_user_id
    AND qe.theme_id = p_theme_id
    AND qv.created_at::date = CURRENT_DATE
  ) INTO v_has_voted;
  
  RETURN v_has_voted;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION select_quote_winner(p_theme_id uuid)
RETURNS uuid AS $$
DECLARE
  v_winner_id uuid;
  v_entry_id uuid;
  v_user_id uuid;
  v_votes_count integer;
BEGIN
  -- Check if winner already announced
  IF EXISTS (
    SELECT 1 FROM quote_winners
    WHERE theme_id = p_theme_id
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Get entry with most votes
  SELECT 
    qe.id,
    qe.user_id,
    COUNT(qv.id) as votes_count
  INTO
    v_entry_id,
    v_user_id,
    v_votes_count
  FROM quote_entries qe
  LEFT JOIN quote_votes qv ON qv.entry_id = qe.id
  WHERE qe.theme_id = p_theme_id
  GROUP BY qe.id, qe.user_id
  ORDER BY votes_count DESC
  LIMIT 1;
  
  -- If no entries, return null
  IF v_entry_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Record winner
  INSERT INTO quote_winners (
    entry_id,
    theme_id,
    user_id,
    votes_count,
    coins_awarded,
    xp_awarded
  ) VALUES (
    v_entry_id,
    p_theme_id,
    v_user_id,
    v_votes_count,
    50, -- Default coin reward
    100 -- Default XP reward
  )
  RETURNING id INTO v_winner_id;
  
  -- Award coins to winner if handle_coin_transaction function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_coin_transaction'
  ) THEN
    BEGIN
      PERFORM handle_coin_transaction(
        v_user_id,
        50,
        'reward',
        'Quote competition winner'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently handle errors in coin transaction
      NULL;
    END;
  END IF;
  
  -- Award XP to winner if add_user_xp function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'add_user_xp'
  ) THEN
    BEGIN
      PERFORM add_user_xp(
        v_user_id,
        100,
        'quote_competition_winner'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently handle errors in XP award
      NULL;
    END;
  END IF;
  
  -- Award XP to all voters if xp_transactions table exists
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'xp_transactions'
  ) THEN
    BEGIN
      INSERT INTO xp_transactions (
        user_id,
        amount,
        source,
        multiplier,
        streak_bonus,
        final_amount
      )
      SELECT 
        qv.user_id,
        10,
        'quote_competition_voter',
        1.0,
        1.0,
        10
      FROM quote_votes qv
      JOIN quote_entries qe ON qe.id = qv.entry_id
      WHERE qe.theme_id = p_theme_id;
    EXCEPTION WHEN OTHERS THEN
      -- Silently handle errors in XP awards
      NULL;
    END;
  END IF;
  
  -- Update user XP totals if profiles table has xp columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'xp_total'
  ) THEN
    BEGIN
      UPDATE profiles p
      SET xp_total = xp_total + 10,
          xp_today = xp_today + 10
      FROM quote_votes qv
      JOIN quote_entries qe ON qe.id = qv.entry_id
      WHERE qe.theme_id = p_theme_id
      AND p.id = qv.user_id;
    EXCEPTION WHEN OTHERS THEN
      -- Silently handle errors in XP updates
      NULL;
    END;
  END IF;
  
  RETURN v_winner_id;
END;
$$ LANGUAGE plpgsql;

-- Insert initial quote themes if they don't exist
DO $$
DECLARE
  theme_count integer;
BEGIN
  SELECT COUNT(*) INTO theme_count FROM quote_themes;
  
  IF theme_count = 0 THEN
    INSERT INTO quote_themes (theme, description, start_date, end_date, is_active)
    VALUES 
      ('Courage', 'Share quotes about finding courage in challenging times', now(), now() + interval '7 days', true),
      ('Resilience', 'Quotes about bouncing back from setbacks', now() + interval '7 days', now() + interval '14 days', false),
      ('Creativity', 'Inspirational quotes about creative thinking', now() + interval '14 days', now() + interval '21 days', false),
      ('Growth', 'Quotes about personal and intellectual growth', now() + interval '21 days', now() + interval '28 days', false);
  END IF;
END $$;

COMMIT;