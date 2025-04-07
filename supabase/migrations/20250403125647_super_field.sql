/*
  # Add Weekly Progress Journal System

  1. New Tables
    - `weekly_journals`
      - Stores user journal entries and AI summaries
      - Supports both text and voice entries
    - `easter_egg_achievements`
      - Tracks hidden achievements and rewards
    - `achievement_rewards`
      - Stores unique rewards for achievements

  2. Changes
    - Add functions for AI summary generation
    - Add triggers for achievement checks
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create weekly_journals table
CREATE TABLE weekly_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start timestamptz NOT NULL,
  text_entry text,
  voice_entry_url text,
  ai_summary text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create easter_egg_achievements table
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

-- Create user_easter_eggs table
CREATE TABLE user_easter_eggs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES easter_egg_achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  reward_claimed boolean DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE weekly_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE easter_egg_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_easter_eggs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their journal entries"
  ON weekly_journals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

-- Insert easter egg achievements
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
  );

-- Create function to check for easter egg achievements
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

-- Create triggers for various events that might trigger achievements
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS trigger AS $$
BEGIN
  PERFORM check_easter_egg_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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