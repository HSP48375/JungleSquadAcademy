/*
  # Update Journal and Achievement System

  1. Changes
    - Safely check for existing tables before creating
    - Add any missing functions and triggers
    - Update achievement checks and rewards
*/

-- Safely create or update easter_egg_achievements table
DO $$ 
BEGIN
  -- Only create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'easter_egg_achievements') THEN
    CREATE TABLE easter_egg_achievements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text NOT NULL,
      icon_url text,
      unlock_condition text NOT NULL,
      unlock_threshold integer,
      reward_type text NOT NULL CHECK (reward_type IN ('avatar_item', 'badge', 'color')),
      reward_data jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE easter_egg_achievements ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Anyone can read achievements"
      ON easter_egg_achievements
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Safely create or update user_easter_eggs table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_easter_eggs') THEN
    CREATE TABLE user_easter_eggs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      achievement_id uuid REFERENCES easter_egg_achievements(id) ON DELETE CASCADE,
      unlocked_at timestamptz DEFAULT now(),
      reward_claimed boolean DEFAULT false,
      UNIQUE(user_id, achievement_id)
    );

    -- Enable RLS
    ALTER TABLE user_easter_eggs ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Users can read their unlocked achievements"
      ON user_easter_eggs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Insert or update easter egg achievements
INSERT INTO easter_egg_achievements (
  name,
  description,
  unlock_condition,
  unlock_threshold,
  reward_type,
  reward_data
) VALUES
  (
    'Jungle Explorer',
    'You''ve learned from every tutor in the jungle!',
    'unique_tutors_used',
    10,
    'avatar_item',
    '{"item": "glowing_scarf", "color": "#00FFA9"}'
  ),
  (
    'Resilient Roarer',
    'Bounced back stronger after losing a streak',
    'streak_recovery',
    5,
    'badge',
    '{"badge_name": "resilient_roarer", "icon": "phoenix"}'
  ),
  (
    'Wise Whisperer',
    'Your words inspire the jungle community',
    'quotes_submitted',
    5,
    'color',
    '{"color_name": "mystic_purple", "hex": "#845EC2"}'
  ),
  (
    'Swift Learner',
    'Achieved three level-ups in a single week!',
    'weekly_level_ups',
    3,
    'avatar_item',
    '{"item": "speed_trails", "color": "#FFD700"}'
  )
ON CONFLICT (id) DO UPDATE
SET
  description = EXCLUDED.description,
  unlock_condition = EXCLUDED.unlock_condition,
  unlock_threshold = EXCLUDED.unlock_threshold,
  reward_data = EXCLUDED.reward_data;

-- Create or replace achievement check function
CREATE OR REPLACE FUNCTION check_easter_egg_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_achievement easter_egg_achievements%ROWTYPE;
  v_count integer;
BEGIN
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM easter_egg_achievements
  LOOP
    -- Skip if already unlocked
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM user_easter_eggs
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    );

    -- Check different conditions
    CASE v_achievement.unlock_condition
      WHEN 'unique_tutors_used' THEN
        SELECT COUNT(DISTINCT tutor_id)
        INTO v_count
        FROM chat_sessions
        WHERE user_id = p_user_id;

      WHEN 'streak_recovery' THEN
        -- Complex logic for streak recovery would go here
        v_count := 0;

      WHEN 'quotes_submitted' THEN
        SELECT COUNT(*)
        INTO v_count
        FROM quote_submissions
        WHERE user_id = p_user_id
        AND approved = true;

      WHEN 'weekly_level_ups' THEN
        SELECT COUNT(*)
        INTO v_count
        FROM user_progress
        WHERE user_id = p_user_id
        AND updated_at >= date_trunc('week', now())
        AND xp_points >= 100;

      ELSE
        v_count := 0;
    END CASE;

    -- Check if threshold met
    IF v_count >= v_achievement.unlock_threshold THEN
      INSERT INTO user_easter_eggs (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS trigger AS $$
BEGIN
  PERFORM check_easter_egg_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely create triggers
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS check_achievements_on_chat ON chat_sessions;
  DROP TRIGGER IF EXISTS check_achievements_on_quote ON quote_submissions;
  DROP TRIGGER IF EXISTS check_achievements_on_progress ON user_progress;

  -- Create new triggers
  CREATE TRIGGER check_achievements_on_chat
    AFTER INSERT ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_achievement_check();

  CREATE TRIGGER check_achievements_on_quote
    AFTER UPDATE OF approved ON quote_submissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_achievement_check();

  CREATE TRIGGER check_achievements_on_progress
    AFTER UPDATE OF xp_points ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_achievement_check();
END $$;