/*
  # Add Avatar of the Week and Quote Submissions

  1. New Tables
    - `avatar_of_week`
      - Tracks weekly featured avatars
      - Stores selection criteria and stats
    - `quote_submissions`
      - User-submitted motivational quotes
      - Moderation status and approval tracking

  2. Changes
    - Add auto-selection function for Avatar of the Week
    - Add policies for submissions and viewing

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create avatar_of_week table
CREATE TABLE avatar_of_week (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start timestamptz NOT NULL,
  week_end timestamptz NOT NULL,
  selection_criteria jsonb NOT NULL,
  stats jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(week_start)
);

-- Create quote_submissions table
CREATE TABLE quote_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  quote_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false,
  featured_at timestamptz,
  CONSTRAINT quote_length CHECK (char_length(quote_text) <= 200)
);

-- Enable RLS
ALTER TABLE avatar_of_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read avatar of week"
  ON avatar_of_week FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "Users can read their quote submissions"
  ON quote_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR approved = true);

-- Create function to select Avatar of the Week
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

  -- Insert new Avatar of the Week
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
  );
END;
$$ LANGUAGE plpgsql;