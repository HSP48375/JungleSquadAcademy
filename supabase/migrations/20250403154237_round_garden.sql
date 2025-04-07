/*
  # Add Tutor Curriculum and Learning System

  1. New Tables
    - `learning_tracks`
      - Defines curriculum paths for each tutor
      - Stores track metadata and progression rules
    - `track_modules`
      - Individual learning modules within tracks
      - Contains content, exercises, and requirements
    - `flashcard_decks`
      - Subject and tutor-specific flashcard collections
    - `flashcards`
      - Individual cards with spaced repetition data
    - `user_progress_tracks`
      - Tracks user progress through learning paths
    - `user_flashcards`
      - Records user performance with flashcards

  2. Changes
    - Add curriculum fields to tutors table
    - Update daily challenges to align with tracks
    - Add learning progress tracking

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create learning_tracks table
CREATE TABLE learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  grade_level text,
  prerequisites jsonb,
  learning_objectives jsonb NOT NULL,
  estimated_duration interval,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, name, difficulty)
);

-- Create track_modules table
CREATE TABLE track_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES learning_tracks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  content jsonb NOT NULL,
  order_index integer NOT NULL,
  exercises jsonb,
  completion_requirements jsonb,
  xp_reward integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  UNIQUE(track_id, order_index)
);

-- Create flashcard_decks table
CREATE TABLE flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  subject text NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  unlock_requirements jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create flashcards table
CREATE TABLE flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front_content text NOT NULL,
  back_content text NOT NULL,
  hints text[],
  tags text[],
  created_at timestamptz DEFAULT now()
);

-- Create user_progress_tracks table
CREATE TABLE user_progress_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  track_id uuid REFERENCES learning_tracks(id) ON DELETE CASCADE,
  current_module_id uuid REFERENCES track_modules(id),
  completed_modules uuid[],
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  completion_percentage decimal DEFAULT 0,
  UNIQUE(user_id, track_id)
);

-- Create user_flashcards table
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

-- Add curriculum fields to tutors
ALTER TABLE tutors
ADD COLUMN IF NOT EXISTS curriculum_focus text[],
ADD COLUMN IF NOT EXISTS teaching_style jsonb,
ADD COLUMN IF NOT EXISTS difficulty_levels text[];

-- Enable RLS
ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcards ENABLE ROW LEVEL SECURITY;

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

-- Create function to calculate next review date
CREATE OR REPLACE FUNCTION calculate_next_review_date(
  p_times_reviewed integer,
  p_difficulty_rating integer
) RETURNS timestamptz AS $$
DECLARE
  base_interval interval;
  difficulty_multiplier float;
BEGIN
  -- Base interval increases with number of reviews
  base_interval := CASE
    WHEN p_times_reviewed = 0 THEN interval '1 day'
    WHEN p_times_reviewed = 1 THEN interval '3 days'
    WHEN p_times_reviewed = 2 THEN interval '1 week'
    WHEN p_times_reviewed = 3 THEN interval '2 weeks'
    ELSE interval '1 month'
  END;

  -- Difficulty rating affects interval (1 = hardest, 5 = easiest)
  difficulty_multiplier := 0.5 + (p_difficulty_rating * 0.2);

  RETURN now() + (base_interval * difficulty_multiplier);
END;
$$ LANGUAGE plpgsql;

-- Create function to update flashcard review schedule
CREATE OR REPLACE FUNCTION update_flashcard_schedule(
  p_user_id uuid,
  p_flashcard_id uuid,
  p_difficulty_rating integer,
  p_was_correct boolean
) RETURNS void AS $$
BEGIN
  INSERT INTO user_flashcards (
    user_id,
    flashcard_id,
    last_reviewed_at,
    next_review_at,
    difficulty_rating,
    times_reviewed,
    times_correct
  )
  VALUES (
    p_user_id,
    p_flashcard_id,
    now(),
    calculate_next_review_date(0, p_difficulty_rating),
    p_difficulty_rating,
    1,
    CASE WHEN p_was_correct THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, flashcard_id)
  DO UPDATE SET
    last_reviewed_at = now(),
    next_review_at = calculate_next_review_date(
      user_flashcards.times_reviewed + 1,
      p_difficulty_rating
    ),
    difficulty_rating = p_difficulty_rating,
    times_reviewed = user_flashcards.times_reviewed + 1,
    times_correct = user_flashcards.times_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Insert sample learning tracks for tutors
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
  '6-8' as grade_level,
  '{}' as prerequisites,
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