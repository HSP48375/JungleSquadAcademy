/*
  # Update Learning Path System

  1. Changes
    - Fix array syntax for PostgreSQL compatibility
    - Add safe execution blocks
    - Ensure proper default values for arrays
*/

DO $$ 
BEGIN
  -- Only create tables if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'learning_tracks') THEN
    CREATE TABLE learning_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text NOT NULL,
      difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      grade_level text[] DEFAULT '{}'::text[],
      prerequisites jsonb DEFAULT '{}'::jsonb,
      learning_objectives jsonb NOT NULL,
      track_type text CHECK (track_type IN ('grade', 'independent')) NOT NULL DEFAULT 'independent',
      skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
      estimated_duration interval,
      created_at timestamptz DEFAULT now(),
      UNIQUE(tutor_id, name, difficulty)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'track_modules') THEN
    CREATE TABLE track_modules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id uuid REFERENCES learning_tracks(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text NOT NULL,
      content jsonb NOT NULL DEFAULT '{}'::jsonb,
      order_index integer NOT NULL,
      exercises jsonb DEFAULT '{}'::jsonb,
      completion_requirements jsonb DEFAULT '{}'::jsonb,
      xp_reward integer DEFAULT 50,
      created_at timestamptz DEFAULT now(),
      UNIQUE(track_id, order_index)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'flashcard_decks') THEN
    CREATE TABLE flashcard_decks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text NOT NULL,
      subject text NOT NULL,
      difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      unlock_requirements jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'flashcards') THEN
    CREATE TABLE flashcards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      deck_id uuid REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      front_content text NOT NULL,
      back_content text NOT NULL,
      hints text[] DEFAULT '{}'::text[],
      tags text[] DEFAULT '{}'::text[],
      created_at timestamptz DEFAULT now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_progress_tracks') THEN
    CREATE TABLE user_progress_tracks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      track_id uuid REFERENCES learning_tracks(id) ON DELETE CASCADE,
      current_module_id uuid REFERENCES track_modules(id),
      completed_modules uuid[] DEFAULT '{}'::uuid[],
      started_at timestamptz DEFAULT now(),
      last_activity_at timestamptz DEFAULT now(),
      completion_percentage decimal DEFAULT 0,
      UNIQUE(user_id, track_id)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_flashcards') THEN
    CREATE TABLE user_flashcards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      flashcard_id uuid REFERENCES flashcards(id) ON DELETE CASCADE,
      last_reviewed_at timestamptz,
      next_review_at timestamptz,
      difficulty_rating integer CHECK (difficulty_rating BETWEEN 1 AND 5),
      times_reviewed integer DEFAULT 0,
      times_correct integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      UNIQUE(user_id, flashcard_id)
    );
  END IF;
END $$;

-- Add curriculum fields to tutors if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'curriculum_focus') THEN
    ALTER TABLE tutors ADD COLUMN curriculum_focus text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'teaching_style') THEN
    ALTER TABLE tutors ADD COLUMN teaching_style jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutors' AND column_name = 'difficulty_levels') THEN
    ALTER TABLE tutors ADD COLUMN difficulty_levels text[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- Enable RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'learning_tracks' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'track_modules' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE track_modules ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcard_decks' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcards' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_progress_tracks' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_progress_tracks ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_flashcards' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_flashcards ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read learning tracks" ON learning_tracks;
  DROP POLICY IF EXISTS "Anyone can read track modules" ON track_modules;
  DROP POLICY IF EXISTS "Anyone can read flashcard decks" ON flashcard_decks;
  DROP POLICY IF EXISTS "Anyone can read flashcards" ON flashcards;
  DROP POLICY IF EXISTS "Users can manage their track progress" ON user_progress_tracks;
  DROP POLICY IF EXISTS "Users can manage their flashcard progress" ON user_flashcards;
END $$;

-- Create policies
CREATE POLICY "Anyone can read learning tracks"
  ON learning_tracks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read track modules"
  ON track_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read flashcard decks"
  ON flashcard_decks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their track progress"
  ON user_progress_tracks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their flashcard progress"
  ON user_flashcards
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert sample data with proper array syntax
INSERT INTO learning_tracks (
  tutor_id,
  name,
  description,
  difficulty,
  grade_level,
  prerequisites,
  learning_objectives
)
SELECT
  t.id as tutor_id,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Algebra Fundamentals'
    WHEN 'History & Geography' THEN 'World History Essentials'
    WHEN 'Language Arts' THEN 'Creative Writing Basics'
    ELSE 'Core Concepts'
  END as name,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Master the foundations of algebra through interactive lessons and practice'
    WHEN 'History & Geography' THEN 'Explore key historical events and their impact on our world'
    WHEN 'Language Arts' THEN 'Develop creative writing skills through guided exercises'
    ELSE 'Learn the fundamental concepts of the subject'
  END as description,
  'beginner' as difficulty,
  '{6,7,8}'::text[] as grade_level,
  '{}'::jsonb as prerequisites,
  CASE t.subject
    WHEN 'Mathematics' THEN '{"objectives": ["Understand variables and expressions", "Solve linear equations", "Graph linear functions"]}'
    WHEN 'History & Geography' THEN '{"objectives": ["Understand chronological order", "Identify major civilizations", "Analyze historical sources"]}'
    WHEN 'Language Arts' THEN '{"objectives": ["Master story structure", "Develop characters", "Create engaging dialogue"]}'
    ELSE '{"objectives": ["Master core concepts", "Apply knowledge practically", "Develop problem-solving skills"]}'
  END::jsonb as learning_objectives
FROM tutors t
WHERE t.subject IN ('Mathematics', 'History & Geography', 'Language Arts')
ON CONFLICT DO NOTHING;

-- Insert sample flashcard decks
INSERT INTO flashcard_decks (
  tutor_id,
  title,
  description,
  subject,
  difficulty
)
SELECT
  t.id as tutor_id,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Essential Math Terms'
    WHEN 'History & Geography' THEN 'Historical Timeline Mastery'
    WHEN 'Language Arts' THEN 'Grammar Fundamentals'
    ELSE 'Core Concepts'
  END as title,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Master key mathematical terms and concepts'
    WHEN 'History & Geography' THEN 'Learn important dates and events in world history'
    WHEN 'Language Arts' THEN 'Perfect your understanding of grammar rules'
    ELSE 'Review fundamental concepts and terminology'
  END as description,
  t.subject,
  'beginner' as difficulty
FROM tutors t
WHERE t.subject IN ('Mathematics', 'History & Geography', 'Language Arts')
ON CONFLICT DO NOTHING;