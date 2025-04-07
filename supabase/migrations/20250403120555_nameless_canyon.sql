/*
  # Add Jungle Avatar System

  1. New Tables
    - `user_avatar`
      - Stores user avatar configuration and customization
    - `avatar_species`
      - Available avatar species and their unlock conditions
    - `avatar_unlocks`
      - Tracks which species users have unlocked

  2. Changes
    - Add avatar display name to profiles
    - Add unlock conditions and tracking
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create avatar_species table
CREATE TABLE avatar_species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('base', 'legendary', 'rare', 'epic', 'mythic')),
  description text NOT NULL,
  unlock_condition text,
  unlock_threshold integer,
  unlock_message text,
  visual_effects jsonb,
  idle_animation text,
  created_at timestamptz DEFAULT now()
);

-- Create user_avatar table
CREATE TABLE user_avatar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  species_id uuid REFERENCES avatar_species(id),
  avatar_name text UNIQUE NOT NULL,
  gender text CHECK (gender IN ('male', 'female', 'neutral', 'not_specified')),
  primary_color text NOT NULL,
  secondary_color text,
  eye_color text,
  facial_markings text[],
  accessories text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create avatar_unlocks table
CREATE TABLE avatar_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  species_id uuid REFERENCES avatar_species(id),
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, species_id)
);

-- Enable RLS
ALTER TABLE avatar_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatar ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_unlocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read avatar species"
  ON avatar_species FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their avatar"
  ON user_avatar
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their unlocks"
  ON avatar_unlocks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert base species
INSERT INTO avatar_species (name, type, description) VALUES
  ('Tiger', 'base', 'Fierce and determined, the tiger leads with strength and grace.'),
  ('Monkey', 'base', 'Clever and agile, the monkey solves problems with creativity.'),
  ('Zebra', 'base', 'Unique and social, the zebra stands out while staying connected.'),
  ('Elephant', 'base', 'Wise and gentle, the elephant never forgets a lesson learned.'),
  ('Lemur', 'base', 'Curious and energetic, the lemur explores new horizons.'),
  ('Giraffe', 'base', 'Tall and observant, the giraffe sees the bigger picture.'),
  ('Butterfly', 'base', 'Beautiful and transformative, the butterfly represents growth.'),
  ('Lion', 'base', 'Noble and brave, the lion inspires others to greatness.'),
  ('Rhino', 'base', 'Strong and focused, the rhino charges through challenges.'),
  ('Raccoon', 'base', 'Smart and resourceful, the raccoon finds creative solutions.');

-- Insert legendary species
INSERT INTO avatar_species (
  name,
  type,
  description,
  unlock_condition,
  unlock_threshold,
  unlock_message,
  visual_effects,
  idle_animation
) VALUES
  (
    'Phoenix Macaw',
    'legendary',
    'Born from flame and feather, the Phoenix Macaw watches over the wise. Only the most consistent learners can earn its wings.',
    'weekly_recaps',
    10,
    'Congratulations! You''ve unlocked the legendary Phoenix Macaw. Keep soaring.',
    '{"wings": "ember_trail", "feathers": "glow_shimmer", "chest": "light_pulse"}',
    'wings_flap_with_embers'
  ),
  (
    'Shadow Jaguar',
    'legendary',
    'Silent as moonlight, fast as thought — the Shadow Jaguar prowls only beside those who commit to excellence.',
    'xp_streak_weeks',
    3,
    'You''ve summoned the power of the Shadow Jaguar — let your learning prowl forward in stealth and strength.',
    '{"body": "glitch_fade", "aura": "purple_glow", "eyes": "neon_blink"}',
    'ghost_shimmer_tail_flick'
  ),
  (
    'Crystal Gecko',
    'legendary',
    'Reflected light, focused effort. The Crystal Gecko adapts, evolves, and glows with potential.',
    'jungle_coins',
    1000,
    'You''ve unlocked the radiant Crystal Gecko — show them what you''re made of.',
    '{"skin": "transparent_shimmer"}',
    'color_shift_glow'
  ),
  (
    'Mecha Sloth',
    'legendary',
    'Slow but powerful, the Mecha Sloth processes every challenge with mechanical focus and ancient strength.',
    'tutor_badges',
    10,
    'System activated. You''ve unlocked the Mecha Sloth — calculate your next move.',
    '{"armor": "vine_tech", "circuits": "glow_pulse"}',
    'xp_bar_charge'
  ),
  (
    'Galactic Chameleon',
    'legendary',
    'A shape-shifter from beyond the stars. The Galactic Chameleon adapts to every challenge with cosmic calm.',
    'total_xp',
    5000,
    'The galaxy recognizes your growth. You''ve unlocked the Galactic Chameleon.',
    '{"skin": "starfield_shimmer", "overlay": "constellations"}',
    'cosmic_fade_pulse'
  );

-- Create function to check and grant avatar unlocks
CREATE OR REPLACE FUNCTION check_avatar_unlocks(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check weekly recaps for Phoenix Macaw
  INSERT INTO avatar_unlocks (user_id, species_id)
  SELECT 
    p_user_id,
    s.id
  FROM avatar_species s
  WHERE s.name = 'Phoenix Macaw'
  AND NOT EXISTS (
    SELECT 1 FROM avatar_unlocks WHERE user_id = p_user_id AND species_id = s.id
  )
  AND (
    SELECT COUNT(*) FROM weekly_recaps WHERE user_id = p_user_id
  ) >= 10;

  -- Check XP streak for Shadow Jaguar
  INSERT INTO avatar_unlocks (user_id, species_id)
  SELECT 
    p_user_id,
    s.id
  FROM avatar_species s
  WHERE s.name = 'Shadow Jaguar'
  AND NOT EXISTS (
    SELECT 1 FROM avatar_unlocks WHERE user_id = p_user_id AND species_id = s.id
  )
  AND (
    SELECT COUNT(DISTINCT date_trunc('week', created_at))
    FROM user_progress
    WHERE user_id = p_user_id
    AND xp_points > 0
    AND created_at >= NOW() - INTERVAL '3 weeks'
  ) >= 3;

  -- Check coins for Crystal Gecko
  INSERT INTO avatar_unlocks (user_id, species_id)
  SELECT 
    p_user_id,
    s.id
  FROM avatar_species s
  WHERE s.name = 'Crystal Gecko'
  AND NOT EXISTS (
    SELECT 1 FROM avatar_unlocks WHERE user_id = p_user_id AND species_id = s.id
  )
  AND (
    SELECT balance FROM user_coins WHERE user_id = p_user_id
  ) >= 1000;

  -- Check tutor badges for Mecha Sloth
  INSERT INTO avatar_unlocks (user_id, species_id)
  SELECT 
    p_user_id,
    s.id
  FROM avatar_species s
  WHERE s.name = 'Mecha Sloth'
  AND NOT EXISTS (
    SELECT 1 FROM avatar_unlocks WHERE user_id = p_user_id AND species_id = s.id
  )
  AND (
    SELECT COUNT(DISTINCT tutor_id)
    FROM user_progress
    WHERE user_id = p_user_id
    AND xp_points >= 100
  ) >= 10;

  -- Check total XP for Galactic Chameleon
  INSERT INTO avatar_unlocks (user_id, species_id)
  SELECT 
    p_user_id,
    s.id
  FROM avatar_species s
  WHERE s.name = 'Galactic Chameleon'
  AND NOT EXISTS (
    SELECT 1 FROM avatar_unlocks WHERE user_id = p_user_id AND species_id = s.id
  )
  AND (
    SELECT SUM(xp_points)
    FROM user_progress
    WHERE user_id = p_user_id
  ) >= 5000;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check unlocks on XP updates
CREATE OR REPLACE FUNCTION trigger_check_avatar_unlocks()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_avatar_unlocks(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_unlocks_on_xp_update
  AFTER INSERT OR UPDATE OF xp_points
  ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_avatar_unlocks();