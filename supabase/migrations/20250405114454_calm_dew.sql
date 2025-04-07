/*
  # Add Easter Egg Achievement System

  1. New Tables
    - `easter_egg_achievements`
      - Stores hidden achievements and their unlock conditions
      - Includes reward types and data
    - `user_easter_eggs`
      - Tracks which users have unlocked which achievements
      - Records when achievements were unlocked and if rewards were claimed

  2. Changes
    - Add functions for checking and unlocking achievements
    - Add triggers for achievement checks on various user actions
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create easter_egg_achievements table if it doesn't exist
DO $$ 
BEGIN
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
  END IF;
END $$;

-- Create user_easter_eggs table if it doesn't exist
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
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'easter_egg_achievements' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE easter_egg_achievements ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_easter_eggs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_easter_eggs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read achievements" ON easter_egg_achievements;
  DROP POLICY IF EXISTS "Users can read their unlocked achievements" ON user_easter_eggs;
  
  -- Create new policies
  CREATE POLICY "Anyone can read achievements"
    ON easter_egg_achievements
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can read their unlocked achievements"
    ON user_easter_eggs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
END $$;

-- Create function to check if user has unlocked an achievement
CREATE OR REPLACE FUNCTION has_unlocked_achievement(
  p_user_id uuid,
  p_achievement_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_easter_eggs
    WHERE user_id = p_user_id
    AND achievement_id = p_achievement_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to unlock an achievement
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id uuid,
  p_achievement_id uuid
) RETURNS boolean AS $$
DECLARE
  v_already_unlocked boolean;
  v_reward_type text;
  v_reward_data jsonb;
BEGIN
  -- Check if already unlocked
  SELECT has_unlocked_achievement(p_user_id, p_achievement_id) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN false;
  END IF;
  
  -- Get reward info
  SELECT reward_type, reward_data
  INTO v_reward_type, v_reward_data
  FROM easter_egg_achievements
  WHERE id = p_achievement_id;
  
  -- Record the achievement
  INSERT INTO user_easter_eggs (
    user_id,
    achievement_id
  ) VALUES (
    p_user_id,
    p_achievement_id
  );
  
  -- Process reward based on type
  CASE v_reward_type
    WHEN 'avatar_item' THEN
      -- Logic for avatar item reward would go here
      NULL;
    WHEN 'badge' THEN
      -- Logic for badge reward would go here
      NULL;
    WHEN 'color' THEN
      -- Logic for color reward would go here
      NULL;
  END CASE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for achievements based on various conditions
CREATE OR REPLACE FUNCTION check_easter_egg_achievements(
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  v_achievement easter_egg_achievements%ROWTYPE;
  v_count integer;
  v_meets_condition boolean;
BEGIN
  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM easter_egg_achievements
  LOOP
    -- Skip if already unlocked
    CONTINUE WHEN has_unlocked_achievement(p_user_id, v_achievement.id);
    
    -- Check different conditions
    v_meets_condition := false;
    
    CASE v_achievement.unlock_condition
      -- Journal streak achievement
      WHEN 'journal_streak' THEN
        SELECT get_journal_streak(p_user_id) >= v_achievement.unlock_threshold
        INTO v_meets_condition;
      
      -- Tutor diversity achievement
      WHEN 'unique_tutors_used' THEN
        SELECT COUNT(DISTINCT tutor_id) >= v_achievement.unlock_threshold
        FROM user_progress
        WHERE user_id = p_user_id
        INTO v_meets_condition;
      
      -- Quote featured achievement
      WHEN 'quote_featured' THEN
        SELECT COUNT(*) >= v_achievement.unlock_threshold
        FROM quote_submissions
        WHERE user_id = p_user_id
        AND featured_at IS NOT NULL
        INTO v_meets_condition;
      
      -- Avatar of the week achievement
      WHEN 'avatar_of_week' THEN
        SELECT COUNT(*) >= v_achievement.unlock_threshold
        FROM avatar_of_week
        WHERE user_id = p_user_id
        INTO v_meets_condition;
      
      -- Game explorer achievement
      WHEN 'games_played' THEN
        -- This would be tracked client-side and unlocked via the edge function
        v_meets_condition := false;
      
      -- Referral achievement
      WHEN 'referrals_completed' THEN
        SELECT COUNT(*) >= v_achievement.unlock_threshold
        FROM referrals
        WHERE referrer_id = p_user_id
        AND status = 'completed'
        INTO v_meets_condition;
      
      -- XP milestone achievement
      WHEN 'xp_total' THEN
        SELECT xp_total >= v_achievement.unlock_threshold
        FROM profiles
        WHERE id = p_user_id
        INTO v_meets_condition;
      
      -- Streak achievement
      WHEN 'xp_streak' THEN
        SELECT xp_streak >= v_achievement.unlock_threshold
        FROM profiles
        WHERE id = p_user_id
        INTO v_meets_condition;
      
      -- Default case
      ELSE
        v_meets_condition := false;
    END CASE;
    
    -- Unlock achievement if condition is met
    IF v_meets_condition THEN
      PERFORM unlock_achievement(p_user_id, v_achievement.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for achievement checks
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_easter_egg_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS check_achievements_on_chat ON chat_sessions;
  DROP TRIGGER IF EXISTS check_achievements_on_quote ON quote_submissions;
  DROP TRIGGER IF EXISTS check_achievements_on_progress ON user_progress;
  DROP TRIGGER IF EXISTS check_achievements_on_journal ON weekly_journals;
END $$;

-- Add triggers to relevant tables
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

CREATE TRIGGER check_achievements_on_journal
  AFTER INSERT ON weekly_journals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_achievement_check();

-- Insert initial easter egg achievements with proper UUID generation
DO $$
DECLARE
  journal_master_id uuid := gen_random_uuid();
  tutor_explorer_id uuid := gen_random_uuid();
  quote_sage_id uuid := gen_random_uuid();
  avatar_celebrity_id uuid := gen_random_uuid();
  game_explorer_id uuid := gen_random_uuid();
  referral_champion_id uuid := gen_random_uuid();
  xp_milestone_id uuid := gen_random_uuid();
  streak_master_id uuid := gen_random_uuid();
BEGIN
  -- Insert achievements only if they don't exist
  INSERT INTO easter_egg_achievements (
    id,
    name,
    description,
    unlock_condition,
    unlock_threshold,
    reward_type,
    reward_data
  ) VALUES
    (
      journal_master_id,
      'Journal Master',
      'Maintained a journal streak for 3 consecutive weeks',
      'journal_streak',
      3,
      'badge',
      '{"badge_name": "Journal Master", "icon": "book"}'::jsonb
    ),
    (
      tutor_explorer_id,
      'Tutor Explorer',
      'Learned from 5 different tutors',
      'unique_tutors_used',
      5,
      'badge',
      '{"badge_name": "Tutor Explorer", "icon": "compass"}'::jsonb
    ),
    (
      quote_sage_id,
      'Quote Sage',
      'Had one of your quotes featured in the community',
      'quote_featured',
      1,
      'color',
      '{"color_name": "Sage Green", "hex": "#7CB342"}'::jsonb
    ),
    (
      avatar_celebrity_id,
      'Avatar Celebrity',
      'Your avatar was featured as Avatar of the Week',
      'avatar_of_week',
      1,
      'badge',
      '{"badge_name": "Celebrity", "icon": "star"}'::jsonb
    ),
    (
      game_explorer_id,
      'Game Explorer',
      'Played 3 different learning games',
      'games_played',
      3,
      'avatar_item',
      '{"item": "Neon Goggles", "color": "#00FFFF"}'::jsonb
    ),
    (
      referral_champion_id,
      'Referral Champion',
      'Successfully referred 5 friends who joined Jungle Squad',
      'referrals_completed',
      5,
      'badge',
      '{"badge_name": "Referral Champion", "icon": "users"}'::jsonb
    ),
    (
      xp_milestone_id,
      'XP Milestone',
      'Reached 1000 total XP',
      'xp_total',
      1000,
      'badge',
      '{"badge_name": "XP Milestone", "icon": "zap"}'::jsonb
    ),
    (
      streak_master_id,
      'Streak Master',
      'Maintained a 7-day XP streak',
      'xp_streak',
      7,
      'color',
      '{"color_name": "Streak Gold", "hex": "#FFD700"}'::jsonb
    )
  ON CONFLICT DO NOTHING;
END $$;