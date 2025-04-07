/*
  # Add Weekly Learning Recap System

  1. New Tables
    - `user_recap_preferences`
      - Stores user preferences for recap delivery
    - `weekly_recaps`
      - Stores generated weekly recap data
    - `recap_shares`
      - Tracks shared recap recipients

  2. Changes
    - Add functions for recap generation and delivery
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create user_recap_preferences table
CREATE TABLE IF NOT EXISTS user_recap_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  mentor_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create weekly_recaps table
CREATE TABLE IF NOT EXISTS weekly_recaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start timestamptz NOT NULL,
  week_end timestamptz NOT NULL,
  total_xp integer NOT NULL,
  tutors_used jsonb NOT NULL,
  challenges_completed integer NOT NULL,
  badges_unlocked jsonb,
  suggested_tutor uuid REFERENCES tutors(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create recap_shares table
CREATE TABLE IF NOT EXISTS recap_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_id uuid REFERENCES weekly_recaps(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recap_id, recipient_email)
);

-- Enable RLS
ALTER TABLE user_recap_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recap_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their recap preferences"
  ON user_recap_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their weekly recaps"
  ON weekly_recaps
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their recap shares"
  ON recap_shares
  FOR SELECT
  TO authenticated
  USING (
    recap_id IN (
      SELECT id FROM weekly_recaps WHERE user_id = auth.uid()
    )
  );

-- Create function to generate weekly recap
CREATE OR REPLACE FUNCTION generate_weekly_recap(p_user_id uuid, p_week_start timestamptz)
RETURNS uuid AS $$
DECLARE
  v_week_end timestamptz;
  v_recap_id uuid;
BEGIN
  -- Calculate week end
  v_week_end := p_week_start + interval '7 days';

  -- Insert new recap
  INSERT INTO weekly_recaps (
    user_id,
    week_start,
    week_end,
    total_xp,
    tutors_used,
    challenges_completed,
    badges_unlocked,
    suggested_tutor
  )
  SELECT
    p_user_id,
    p_week_start,
    v_week_end,
    COALESCE(SUM(xp_points), 0),
    (
      SELECT jsonb_object_agg(t.name, COUNT(*))
      FROM chat_sessions cs
      JOIN tutors t ON t.id = cs.tutor_id
      WHERE cs.user_id = p_user_id
      AND cs.created_at BETWEEN p_week_start AND v_week_end
      GROUP BY t.id
    ),
    COUNT(DISTINCT cs.id),
    (
      SELECT jsonb_agg(a.name)
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = p_user_id
      AND ua.earned_at BETWEEN p_week_start AND v_week_end
    ),
    (
      SELECT t.id
      FROM tutors t
      WHERE t.id NOT IN (
        SELECT DISTINCT cs.tutor_id
        FROM chat_sessions cs
        WHERE cs.user_id = p_user_id
      )
      ORDER BY random()
      LIMIT 1
    )
  FROM user_progress up
  LEFT JOIN challenge_submissions cs ON cs.user_id = p_user_id
    AND cs.created_at BETWEEN p_week_start AND v_week_end
  WHERE up.user_id = p_user_id
  RETURNING id INTO v_recap_id;

  RETURN v_recap_id;
END;
$$ LANGUAGE plpgsql;