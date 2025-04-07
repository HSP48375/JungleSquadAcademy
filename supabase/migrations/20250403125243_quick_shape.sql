/*
  # Add Weekly Competition System

  1. New Tables
    - `weekly_competitions`
      - Stores competition details and configuration
    - `competition_participants`
      - Tracks user participation and progress
    - `competition_rewards`
      - Defines reward tiers and types

  2. Changes
    - Add functions for leaderboard calculation
    - Add policies for data access
    - Add triggers for reward distribution

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create weekly_competitions table
CREATE TABLE weekly_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  subject text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('xp', 'coins', 'cosmetic')),
  leaderboard_enabled boolean DEFAULT true,
  participation_threshold integer DEFAULT 3,
  participation_reward integer DEFAULT 25,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create competition_participants table
CREATE TABLE competition_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  challenges_completed integer DEFAULT 0,
  opted_in boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- Create competition_rewards table
CREATE TABLE competition_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('xp', 'coins', 'cosmetic')),
  reward_amount integer NOT NULL,
  reward_item_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, rank)
);

-- Enable RLS
ALTER TABLE weekly_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read weekly competitions"
  ON weekly_competitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their competition participation"
  ON competition_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their competition participation"
  ON competition_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read competition rewards"
  ON competition_rewards FOR SELECT
  TO authenticated
  USING (true);

-- Create function to get competition leaderboard
CREATE OR REPLACE FUNCTION get_competition_leaderboard(competition_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  avatar_name text,
  total_xp integer,
  challenges_completed integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY cp.total_xp DESC) as rank,
    p.id as user_id,
    ua.avatar_name,
    cp.total_xp,
    cp.challenges_completed
  FROM competition_participants cp
  JOIN profiles p ON p.id = cp.user_id
  LEFT JOIN user_avatar ua ON ua.user_id = p.id
  WHERE cp.competition_id = $1
  ORDER BY cp.total_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update competition progress
CREATE OR REPLACE FUNCTION update_competition_progress()
RETURNS trigger AS $$
DECLARE
  v_competition_id uuid;
BEGIN
  -- Get current competition for the subject
  SELECT id INTO v_competition_id
  FROM weekly_competitions
  WHERE subject = (
    SELECT subject FROM tutors WHERE id = NEW.tutor_id
  )
  AND now() BETWEEN start_date AND end_date
  LIMIT 1;

  IF v_competition_id IS NOT NULL THEN
    -- Update or insert participant progress
    INSERT INTO competition_participants (
      competition_id,
      user_id,
      total_xp,
      challenges_completed
    )
    VALUES (
      v_competition_id,
      NEW.user_id,
      NEW.xp_points,
      1
    )
    ON CONFLICT (competition_id, user_id)
    DO UPDATE SET
      total_xp = competition_participants.total_xp + NEW.xp_points,
      challenges_completed = competition_participants.challenges_completed + 1,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for competition progress
CREATE TRIGGER update_competition_progress_trigger
  AFTER INSERT OR UPDATE OF xp_points
  ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_progress();

-- Insert sample competition
INSERT INTO weekly_competitions (
  title,
  description,
  subject,
  start_date,
  end_date,
  reward_type,
  participation_threshold,
  participation_reward
) VALUES (
  'Math Madness Week',
  'Challenge yourself with advanced mathematics and compete for exclusive rewards! Complete challenges, earn XP, and climb the leaderboard.',
  'Mathematics',
  now(),
  now() + interval '7 days',
  'coins',
  3,
  25
);

-- Insert sample rewards
INSERT INTO competition_rewards (
  competition_id,
  rank,
  reward_type,
  reward_amount
)
SELECT 
  id as competition_id,
  rank,
  'coins' as reward_type,
  CASE 
    WHEN rank = 1 THEN 100
    WHEN rank = 2 THEN 50
    WHEN rank = 3 THEN 25
  END as reward_amount
FROM weekly_competitions,
  unnest(ARRAY[1, 2, 3]) as rank
WHERE title = 'Math Madness Week';