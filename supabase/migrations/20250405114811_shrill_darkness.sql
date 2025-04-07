/*
  # Add Subject-Based Competitions System

  1. New Tables
    - `weekly_competitions`
      - Stores competition details, subjects, and timeframes
    - `competition_participants`
      - Tracks user participation and progress
    - `competition_rewards`
      - Defines reward tiers and amounts

  2. Changes
    - Add functions for competition management
    - Add triggers for XP tracking in competitions
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create weekly_competitions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'weekly_competitions') THEN
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
  END IF;
END $$;

-- Create competition_participants table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'competition_participants') THEN
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
  END IF;
END $$;

-- Create competition_rewards table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'competition_rewards') THEN
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
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'weekly_competitions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE weekly_competitions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'competition_participants' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'competition_rewards' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE competition_rewards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read weekly competitions" ON weekly_competitions;
  DROP POLICY IF EXISTS "Users can read their competition participation" ON competition_participants;
  DROP POLICY IF EXISTS "Users can update their competition participation" ON competition_participants;
  DROP POLICY IF EXISTS "Anyone can read competition rewards" ON competition_rewards;
  
  -- Create new policies
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
END $$;

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
  AND cp.opted_in = true
  ORDER BY cp.total_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update competition progress
CREATE OR REPLACE FUNCTION update_competition_progress()
RETURNS trigger AS $$
DECLARE
  v_competition_id uuid;
  v_tutor_subject text;
BEGIN
  -- Get tutor subject
  SELECT subject INTO v_tutor_subject
  FROM tutors
  WHERE id = NEW.tutor_id;

  -- Get current competition for the subject
  SELECT id INTO v_competition_id
  FROM weekly_competitions
  WHERE subject = v_tutor_subject
  AND now() BETWEEN start_date AND end_date
  LIMIT 1;

  IF v_competition_id IS NOT NULL THEN
    -- Update or insert participant progress
    INSERT INTO competition_participants (
      competition_id,
      user_id,
      total_xp,
      challenges_completed,
      opted_in
    )
    VALUES (
      v_competition_id,
      NEW.user_id,
      NEW.xp_points - COALESCE(OLD.xp_points, 0),
      0,
      false
    )
    ON CONFLICT (competition_id, user_id)
    DO UPDATE SET
      total_xp = competition_participants.total_xp + (NEW.xp_points - COALESCE(OLD.xp_points, 0)),
      updated_at = now()
    WHERE competition_participants.opted_in = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for competition progress
DROP TRIGGER IF EXISTS update_competition_progress_trigger ON user_progress;
CREATE TRIGGER update_competition_progress_trigger
  AFTER INSERT OR UPDATE OF xp_points
  ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_progress();

-- Create function to join competition
CREATE OR REPLACE FUNCTION join_competition(p_user_id uuid, p_competition_id uuid)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if competition exists and is active
  SELECT EXISTS (
    SELECT 1 FROM weekly_competitions
    WHERE id = p_competition_id
    AND now() BETWEEN start_date AND end_date
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RETURN false;
  END IF;
  
  -- Join the competition
  INSERT INTO competition_participants (
    competition_id,
    user_id,
    opted_in
  )
  VALUES (
    p_competition_id,
    p_user_id,
    true
  )
  ON CONFLICT (competition_id, user_id)
  DO UPDATE SET
    opted_in = true,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to leave competition
CREATE OR REPLACE FUNCTION leave_competition(p_user_id uuid, p_competition_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE competition_participants
  SET
    opted_in = false,
    updated_at = now()
  WHERE
    competition_id = p_competition_id
    AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to end competition and distribute rewards
CREATE OR REPLACE FUNCTION end_competition(p_competition_id uuid)
RETURNS void AS $$
DECLARE
  v_participant record;
  v_reward record;
  v_rank integer;
  v_reward_amount integer;
  v_reward_type text;
BEGIN
  -- Get competition details
  UPDATE weekly_competitions
  SET end_date = now()
  WHERE id = p_competition_id
  AND end_date > now();
  
  -- Get top participants
  FOR v_participant IN
    SELECT * FROM get_competition_leaderboard(p_competition_id, 10)
  LOOP
    v_rank := v_participant.rank;
    
    -- Get reward for this rank
    SELECT reward_type, reward_amount
    INTO v_reward_type, v_reward_amount
    FROM competition_rewards
    WHERE competition_id = p_competition_id
    AND rank = v_rank;
    
    -- If no specific reward, use default
    IF v_reward_type IS NULL THEN
      v_reward_type := 'coins';
      v_reward_amount := CASE
        WHEN v_rank = 1 THEN 100
        WHEN v_rank = 2 THEN 50
        WHEN v_rank = 3 THEN 25
        ELSE 10
      END;
    END IF;
    
    -- Award the reward
    IF v_reward_type = 'xp' THEN
      PERFORM add_user_xp(
        v_participant.user_id,
        v_reward_amount,
        'competition_reward'
      );
    ELSIF v_reward_type = 'coins' THEN
      PERFORM handle_coin_transaction(
        v_participant.user_id,
        v_reward_amount,
        'reward',
        'Competition reward - Rank ' || v_rank
      );
    END IF;
  END LOOP;
  
  -- Award participation rewards
  FOR v_participant IN
    SELECT user_id
    FROM competition_participants
    WHERE competition_id = p_competition_id
    AND opted_in = true
    AND total_xp > 0
    AND user_id NOT IN (
      SELECT user_id FROM get_competition_leaderboard(p_competition_id, 10)
    )
  LOOP
    -- Get participation reward
    SELECT participation_reward INTO v_reward_amount
    FROM weekly_competitions
    WHERE id = p_competition_id;
    
    -- Award participation XP
    PERFORM add_user_xp(
      v_participant.user_id,
      v_reward_amount,
      'competition_participation'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

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
)
SELECT
  'Math Madness Week',
  'Challenge yourself with advanced mathematics and compete for exclusive rewards! Complete challenges, earn XP, and climb the leaderboard.',
  'Mathematics',
  now(),
  now() + interval '7 days',
  'coins',
  3,
  25
WHERE NOT EXISTS (
  SELECT 1 FROM weekly_competitions
  WHERE title = 'Math Madness Week'
);

-- Insert sample rewards
INSERT INTO competition_rewards (
  competition_id,
  rank,
  reward_type,
  reward_amount
)
SELECT 
  wc.id as competition_id,
  r.rank,
  'coins' as reward_type,
  CASE 
    WHEN r.rank = 1 THEN 100
    WHEN r.rank = 2 THEN 50
    WHEN r.rank = 3 THEN 25
  END as reward_amount
FROM weekly_competitions wc
CROSS JOIN (VALUES (1), (2), (3)) as r(rank)
WHERE wc.title = 'Math Madness Week'
AND NOT EXISTS (
  SELECT 1 FROM competition_rewards
  WHERE competition_id = wc.id
  AND rank = r.rank
);