/*
  # Initial Schema Setup for Jungle Squad

  1. New Tables
    - `profiles`
      - User profiles with basic info and preferences
    - `tutors`
      - AI tutor information and configurations
    - `chat_sessions`
      - Stores chat sessions between users and tutors
    - `chat_messages`
      - Individual messages within chat sessions
    - `daily_challenges`
      - Daily tasks assigned by tutors
    - `challenge_submissions`
      - User submissions for daily challenges
    - `user_progress`
      - Tracks user progress per subject
    - `achievements`
      - Available achievements/badges
    - `user_achievements`
      - Links users to their earned achievements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure access patterns for all operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  is_parent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  animal text NOT NULL,
  subject text NOT NULL,
  catchphrase text,
  avatar_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_tutor boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create daily_challenges table
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

-- Create challenge_submissions table
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  xp_points integer DEFAULT 0,
  time_spent interval DEFAULT '0 seconds',
  last_interaction timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tutor_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  required_points integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read tutors"
  ON tutors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can read their chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read messages from their sessions"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read daily challenges"
  ON daily_challenges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can read their challenge submissions"
  ON challenge_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create challenge submissions"
  ON challenge_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can read their achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert initial tutors
INSERT INTO tutors (name, animal, subject, catchphrase, avatar_url, description) VALUES
  ('Tango', 'Tiger', 'Mathematics', 'Let''s pounce on those equations!', 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&fit=crop', 'Expert in Algebra, Geometry, Calculus, and Statistics'),
  ('Zara', 'Zebra', 'History & Geography', 'Stripe by stripe, we uncover the past!', 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=400&fit=crop', 'Specialist in World History, U.S. History, and Map Skills'),
  ('Milo', 'Monkey', 'Language Arts', 'Let''s swing into storytelling!', 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&fit=crop', 'Master of Grammar, Writing, and Literature'),
  ('Luna', 'Lioness', 'Science', 'Roar into discovery!', 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&fit=crop', 'Expert in Biology, Chemistry, and Physics'),
  ('Bindi', 'Butterfly', 'Art & Creativity', 'Spread your wings and create!', 'https://images.unsplash.com/photo-1595873520615-67e8c98db5d1?w=400&fit=crop', 'Guide for Drawing, Painting, and Creative Expression'),
  ('Chip', 'Cheetah', 'Technology', 'Code fast, think faster!', 'https://images.unsplash.com/photo-1557728325-b66b92d905e5?w=400&fit=crop', 'Specialist in Programming and Digital Literacy'),
  ('Rhea', 'Rhino', 'Music', 'Let''s charge into rhythm!', 'https://images.unsplash.com/photo-1584844115436-473eb4a4de8b?w=400&fit=crop', 'Expert in Music Theory and Instruments'),
  ('Gabi', 'Giraffe', 'Life Skills', 'See the big picture of life!', 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=400&fit=crop', 'Guide for Personal Finance and Life Management'),
  ('Ellie', 'Elephant', 'Social Skills', 'Feel it. Understand it. Grow with it.', 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&fit=crop', 'Expert in Emotional Intelligence and Communication'),
  ('Rocky', 'Raccoon', 'Logic & Puzzles', 'Let''s outsmart every challenge!', 'https://images.unsplash.com/photo-1606574977100-16c8c0365d33?w=400&fit=crop', 'Master of Brain Teasers and Strategy Games');

-- Insert initial achievements
INSERT INTO achievements (name, description, icon_url, required_points) VALUES
  ('First Steps', 'Complete your first chat session with any tutor', 'https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?w=400&fit=crop', 10),
  ('Quick Learner', 'Complete 5 daily challenges', 'https://images.unsplash.com/photo-1562516155-e0c1ee44059b?w=400&fit=crop', 50),
  ('Subject Master', 'Reach 1000 XP points with any tutor', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&fit=crop', 1000);