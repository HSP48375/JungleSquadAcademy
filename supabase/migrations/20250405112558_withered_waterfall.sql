/*
  # Add Weekly Learning Journal System

  1. New Tables
    - `weekly_journals`
      - Stores user journal entries and AI summaries
      - Supports both text and voice entries
      - Tracks weekly learning reflections

  2. Changes
    - Add functions for AI summary generation
    - Add XP rewards for consistent journaling
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create weekly_journals table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start timestamptz NOT NULL,
  text_entry text,
  voice_entry_url text,
  ai_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'weekly_journals' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE weekly_journals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their journal entries" ON weekly_journals;

-- Create policies
CREATE POLICY "Users can manage their journal entries"
  ON weekly_journals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to generate AI summary
CREATE OR REPLACE FUNCTION generate_journal_summary(
  p_entry_id uuid,
  p_summary text
)
RETURNS void AS $$
BEGIN
  -- Update the journal entry with the AI summary
  UPDATE weekly_journals
  SET 
    ai_summary = p_summary,
    updated_at = now()
  WHERE id = p_entry_id;
  
  -- Award XP for getting a summary
  WITH entry_info AS (
    SELECT user_id
    FROM weekly_journals
    WHERE id = p_entry_id
  )
  SELECT add_user_xp(
    entry_info.user_id,
    5,
    'journal_summary'
  )
  FROM entry_info;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate journal streak
CREATE OR REPLACE FUNCTION get_journal_streak(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_streak integer := 0;
  v_current_week timestamptz;
  v_prev_week timestamptz;
  v_has_entry boolean;
BEGIN
  -- Get current week start (Sunday)
  v_current_week := date_trunc('week', now());
  
  -- Check if user has an entry for current week
  SELECT EXISTS (
    SELECT 1 FROM weekly_journals
    WHERE user_id = p_user_id
    AND week_start = v_current_week
  ) INTO v_has_entry;
  
  -- If no entry for current week, return 0
  IF NOT v_has_entry THEN
    RETURN 0;
  END IF;
  
  -- Start streak at 1 for current week
  v_streak := 1;
  v_prev_week := v_current_week - interval '7 days';
  
  -- Check previous weeks
  WHILE EXISTS (
    SELECT 1 FROM weekly_journals
    WHERE user_id = p_user_id
    AND week_start = v_prev_week
  ) LOOP
    v_streak := v_streak + 1;
    v_prev_week := v_prev_week - interval '7 days';
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Create function to award streak bonus
CREATE OR REPLACE FUNCTION award_journal_streak_bonus(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_streak integer;
  v_bonus integer;
BEGIN
  -- Get current streak
  SELECT get_journal_streak(p_user_id) INTO v_streak;
  
  -- Determine bonus based on streak
  v_bonus := CASE
    WHEN v_streak >= 4 THEN 50
    WHEN v_streak >= 3 THEN 25
    WHEN v_streak >= 2 THEN 10
    ELSE 0
  END;
  
  -- Award bonus if applicable
  IF v_bonus > 0 THEN
    PERFORM add_user_xp(
      p_user_id,
      v_bonus,
      'journal_streak_bonus'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to check streak on new entries
CREATE OR REPLACE FUNCTION check_journal_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_streak integer;
  v_new_streak integer;
BEGIN
  -- Get streak before this entry
  SELECT COALESCE(get_journal_streak(NEW.user_id), 0) INTO v_prev_streak;
  
  -- Calculate new streak (will include this entry)
  v_new_streak := v_prev_streak + 1;
  
  -- If streak milestone reached, award bonus
  IF v_new_streak IN (2, 3, 4) AND v_prev_streak < v_new_streak THEN
    PERFORM award_journal_streak_bonus(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_journal_streak_trigger ON weekly_journals;

-- Create trigger for streak checking
CREATE TRIGGER check_journal_streak_trigger
  AFTER INSERT ON weekly_journals
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_streak();