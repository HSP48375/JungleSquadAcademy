/*
  # Add Quote Submissions and Avatar of Week Features

  1. Changes
    - Add quote_submissions table if not exists
    - Add policies for quote submissions
    - Add function for selecting Avatar of the Week

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies for authenticated users
*/

-- Create quote_submissions table if not exists
CREATE TABLE IF NOT EXISTS quote_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false,
  featured_at timestamptz,
  CONSTRAINT quote_length CHECK (char_length(quote_text) <= 200)
);

-- Enable RLS on quote_submissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'quote_submissions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create or replace policies for quote submissions
DROP POLICY IF EXISTS "Users can submit quotes" ON quote_submissions;
CREATE POLICY "Users can submit quotes"
  ON quote_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM quote_submissions
      WHERE user_id = auth.uid()
      AND created_at > now() - interval '7 days'
    )
  );

DROP POLICY IF EXISTS "Users can read their quote submissions" ON quote_submissions;
CREATE POLICY "Users can read their quote submissions"
  ON quote_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR approved = true);

-- Create or replace function for Avatar of the Week selection
CREATE OR REPLACE FUNCTION select_avatar_of_week()
RETURNS void AS $$
DECLARE
  v_week_start timestamptz;
  v_week_end timestamptz;
  v_winner_id uuid;
  v_selection_criteria jsonb;
  v_stats jsonb;
BEGIN
  -- Set week boundaries
  v_week_start := date_trunc('week', now());
  v_week_end := v_week_start + interval '7 days';

  -- Select winner based on XP and streak
  WITH user_stats AS (
    SELECT
      p.id as user_id,
      SUM(up.xp_points) as weekly_xp,
      COUNT(DISTINCT date_trunc('day', cs.created_at)) as active_days,
      COUNT(DISTINCT cs.tutor_id) as tutors_engaged
    FROM profiles p
    LEFT JOIN user_progress up ON up.user_id = p.id
    LEFT JOIN chat_sessions cs ON cs.user_id = p.id
    WHERE cs.created_at >= v_week_start
    GROUP BY p.id
    ORDER BY weekly_xp DESC, active_days DESC
    LIMIT 1
  )
  SELECT
    us.user_id,
    jsonb_build_object(
      'weekly_xp', us.weekly_xp,
      'active_days', us.active_days,
      'tutors_engaged', us.tutors_engaged
    ),
    jsonb_build_object(
      'criteria', 'highest_weekly_xp',
      'threshold', us.weekly_xp
    )
  INTO v_winner_id, v_stats, v_selection_criteria
  FROM user_stats us;

  -- Insert new Avatar of the Week if winner exists
  IF v_winner_id IS NOT NULL THEN
    INSERT INTO avatar_of_week (
      user_id,
      week_start,
      week_end,
      selection_criteria,
      stats
    ) VALUES (
      v_winner_id,
      v_week_start,
      v_week_end,
      v_selection_criteria,
      v_stats
    )
    ON CONFLICT (week_start) DO UPDATE
    SET
      user_id = EXCLUDED.user_id,
      stats = EXCLUDED.stats,
      selection_criteria = EXCLUDED.selection_criteria;
  END IF;
END;
$$ LANGUAGE plpgsql;