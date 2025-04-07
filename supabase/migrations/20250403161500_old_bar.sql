/*
  # Add Study Groups System

  1. New Tables
    - `study_groups`
      - Group details and settings
    - `group_members`
      - User membership and roles
    - `group_messages`
      - Group chat functionality
    - `group_challenges`
      - Weekly collaborative challenges

  2. Changes
    - Add group-specific policies
    - Add functions for group management
    - Add triggers for XP rewards

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for group access
*/

-- Create study_groups table
CREATE TABLE study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  subject text NOT NULL,
  track_id uuid REFERENCES learning_tracks(id),
  member_limit integer NOT NULL DEFAULT 10 CHECK (member_limit BETWEEN 3 AND 10),
  current_members integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_member_count CHECK (current_members <= member_limit)
);

-- Create group_members table
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('leader', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_tutor_tip boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create group_challenges table
CREATE TABLE group_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 50,
  coin_reward integer NOT NULL DEFAULT 5,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  completion_requirement integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create group_challenge_progress table
CREATE TABLE group_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES group_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read study groups"
  ON study_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Group members can read their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      SELECT current_members < member_limit
      FROM study_groups
      WHERE id = group_id
    )
  );

CREATE POLICY "Group members can read messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can read challenges"
  ON group_challenges FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can track challenge progress"
  ON group_challenge_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to join group
CREATE OR REPLACE FUNCTION join_study_group(
  p_group_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'member'
) RETURNS void AS $$
BEGIN
  -- Check member limit
  IF NOT EXISTS (
    SELECT 1 FROM study_groups
    WHERE id = p_group_id
    AND current_members < member_limit
  ) THEN
    RAISE EXCEPTION 'Group is full';
  END IF;

  -- Add member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, p_role);

  -- Update member count
  UPDATE study_groups
  SET
    current_members = current_members + 1,
    updated_at = now()
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to leave group
CREATE OR REPLACE FUNCTION leave_study_group(
  p_group_id uuid,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  -- Remove member
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  -- Update member count
  UPDATE study_groups
  SET
    current_members = current_members - 1,
    updated_at = now()
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check group challenge completion
CREATE OR REPLACE FUNCTION check_group_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id uuid;
  v_completion_requirement integer;
  v_completed_count integer;
  v_xp_reward integer;
  v_coin_reward integer;
BEGIN
  -- Get challenge details
  SELECT
    group_id,
    completion_requirement,
    xp_reward,
    coin_reward
  INTO
    v_group_id,
    v_completion_requirement,
    v_xp_reward,
    v_coin_reward
  FROM group_challenges
  WHERE id = NEW.challenge_id;

  -- Count completions
  SELECT COUNT(*)
  INTO v_completed_count
  FROM group_challenge_progress
  WHERE challenge_id = NEW.challenge_id
  AND completed_at IS NOT NULL;

  -- If requirement met, reward all participants
  IF v_completed_count >= v_completion_requirement THEN
    -- Award XP and coins to all group members
    INSERT INTO coin_transactions (
      user_id,
      amount,
      type,
      description
    )
    SELECT
      user_id,
      v_coin_reward,
      'reward',
      'Group challenge completion bonus'
    FROM group_members
    WHERE group_id = v_group_id;

    -- Update user progress
    INSERT INTO user_progress (
      user_id,
      tutor_id,
      xp_points
    )
    SELECT
      gm.user_id,
      lt.tutor_id,
      v_xp_reward
    FROM group_members gm
    JOIN study_groups sg ON sg.id = gm.group_id
    JOIN learning_tracks lt ON lt.id = sg.track_id
    WHERE gm.group_id = v_group_id
    ON CONFLICT (user_id, tutor_id)
    DO UPDATE SET
      xp_points = user_progress.xp_points + EXCLUDED.xp_points;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for challenge completion check
CREATE TRIGGER check_challenge_completion
  AFTER INSERT OR UPDATE OF completed_at
  ON group_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION check_group_challenge_completion();