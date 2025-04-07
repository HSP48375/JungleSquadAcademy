/*
  # Add Daily Challenges System

  1. New Tables
    - `daily_challenges`
      - Stores daily challenges created by tutors
      - Includes title, description, difficulty, and points
    - `challenge_submissions`
      - Tracks user submissions for challenges
      - Links users to challenges and records completion status

  2. Changes
    - Add policies for challenge access and submission
    - Add trigger for XP updates on challenge completion

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create daily_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create challenge_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable Row Level Security
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_challenges' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'challenge_submissions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create or replace policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read daily challenges" ON daily_challenges;
  DROP POLICY IF EXISTS "Users can create challenge submissions" ON challenge_submissions;
  DROP POLICY IF EXISTS "Users can read their challenge submissions" ON challenge_submissions;

  -- Create new policies
  CREATE POLICY "Anyone can read daily challenges"
    ON daily_challenges
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can create challenge submissions"
    ON challenge_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

  CREATE POLICY "Users can read their challenge submissions"
    ON challenge_submissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
END $$;

-- Create function to update XP on challenge completion
CREATE OR REPLACE FUNCTION update_user_xp_on_challenge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get the challenge points and tutor_id
    WITH challenge_info AS (
      SELECT points, tutor_id
      FROM daily_challenges
      WHERE id = NEW.challenge_id
    )
    -- Update or insert user progress
    INSERT INTO user_progress (user_id, tutor_id, xp_points)
    SELECT 
      NEW.user_id,
      challenge_info.tutor_id,
      challenge_info.points
    FROM challenge_info
    ON CONFLICT (user_id, tutor_id)
    DO UPDATE SET
      xp_points = user_progress.xp_points + EXCLUDED.xp_points,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for XP updates
DROP TRIGGER IF EXISTS update_xp_on_challenge_completion ON challenge_submissions;
CREATE TRIGGER update_xp_on_challenge_completion
  AFTER UPDATE OF status ON challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_xp_on_challenge();

-- Insert sample daily challenges
INSERT INTO daily_challenges (tutor_id, title, description, difficulty, points, expires_at)
SELECT 
  t.id,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Solve a Complex Equation'
    WHEN 'History & Geography' THEN 'Map Ancient Trade Routes'
    WHEN 'Language Arts' THEN 'Write a Creative Story'
    ELSE 'Daily Learning Challenge'
  END,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Solve the quadratic equation and explain your steps: 2x² + 5x - 12 = 0'
    WHEN 'History & Geography' THEN 'Draw and describe the major trade routes of the Silk Road'
    WHEN 'Language Arts' THEN 'Write a 500-word story about an unexpected discovery'
    ELSE 'Complete today''s learning challenge'
  END,
  'medium',
  50,
  now() + interval '1 day'
FROM tutors t
WHERE t.subject IN ('Mathematics', 'History & Geography', 'Language Arts')
ON CONFLICT DO NOTHING;