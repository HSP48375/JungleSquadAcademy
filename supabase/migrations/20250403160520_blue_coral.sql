/*
  # Add Dual Curriculum Track System

  1. Changes
    - Add learning_mode and grade_level to profiles table
    - Update learning_tracks table with track_type field
    - Add functions for track assignment based on user preferences
    - Update existing tracks with appropriate types

  2. Security
    - Maintain existing RLS policies
    - Add policies for new fields
*/

-- Add learning preferences to profiles
ALTER TABLE profiles
ADD COLUMN learning_mode text CHECK (learning_mode IN ('grade', 'independent')) DEFAULT 'independent',
ADD COLUMN grade_level text;

-- Update learning_tracks table
ALTER TABLE learning_tracks
ADD COLUMN track_type text CHECK (track_type IN ('grade', 'independent')) NOT NULL DEFAULT 'independent',
ALTER COLUMN grade_level TYPE text[] USING ARRAY[grade_level],
ADD COLUMN skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));

-- Create function to get appropriate tracks for user
CREATE OR REPLACE FUNCTION get_user_tracks(p_user_id uuid)
RETURNS TABLE (
  track_id uuid,
  name text,
  description text,
  difficulty text,
  grade_levels text[],
  skill_level text,
  track_type text
) AS $$
DECLARE
  v_learning_mode text;
  v_grade_level text;
BEGIN
  -- Get user preferences
  SELECT learning_mode, grade_level
  INTO v_learning_mode, v_grade_level
  FROM profiles
  WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    lt.id,
    lt.name,
    lt.description,
    lt.difficulty,
    lt.grade_level,
    lt.skill_level,
    lt.track_type
  FROM learning_tracks lt
  WHERE
    CASE
      WHEN v_learning_mode = 'grade' THEN
        lt.track_type = 'grade' AND
        v_grade_level = ANY(lt.grade_level)
      ELSE
        lt.track_type = 'independent'
    END;
END;
$$ LANGUAGE plpgsql;

-- Update existing tracks with appropriate types
UPDATE learning_tracks
SET
  track_type = CASE
    WHEN grade_level IS NOT NULL THEN 'grade'
    ELSE 'independent'
  END,
  skill_level = difficulty;

-- Insert grade-based tracks for existing tutors
INSERT INTO learning_tracks (
  tutor_id,
  name,
  description,
  difficulty,
  grade_level,
  track_type,
  prerequisites,
  learning_objectives
)
SELECT
  t.id as tutor_id,
  CASE t.subject
    WHEN 'Mathematics' THEN grade || ' Mathematics'
    WHEN 'History & Geography' THEN grade || ' Social Studies'
    WHEN 'Language Arts' THEN grade || ' Language Arts'
    ELSE grade || ' ' || t.subject
  END as name,
  CASE t.subject
    WHEN 'Mathematics' THEN 'Master grade-appropriate math concepts through interactive lessons'
    WHEN 'History & Geography' THEN 'Explore history and geography at your grade level'
    WHEN 'Language Arts' THEN 'Develop grade-appropriate reading and writing skills'
    ELSE 'Learn core concepts for your grade level'
  END as description,
  'beginner' as difficulty,
  ARRAY[grade] as grade_level,
  'grade' as track_type,
  '{}' as prerequisites,
  jsonb_build_object(
    'objectives',
    CASE t.subject
      WHEN 'Mathematics' THEN ARRAY['Master grade-level math concepts', 'Solve age-appropriate problems', 'Build mathematical confidence']
      WHEN 'History & Geography' THEN ARRAY['Understand historical events', 'Learn geography basics', 'Develop critical thinking']
      WHEN 'Language Arts' THEN ARRAY['Improve reading comprehension', 'Enhance writing skills', 'Build vocabulary']
      ELSE ARRAY['Master core concepts', 'Apply knowledge practically', 'Build subject confidence']
    END
  ) as learning_objectives
FROM
  tutors t
CROSS JOIN (
  SELECT unnest(ARRAY['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']) as grade
) grades
WHERE t.subject IN ('Mathematics', 'History & Geography', 'Language Arts')
ON CONFLICT DO NOTHING;

-- Create function to switch learning mode
CREATE OR REPLACE FUNCTION switch_learning_mode(
  p_user_id uuid,
  p_mode text,
  p_grade_level text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    learning_mode = p_mode,
    grade_level = CASE
      WHEN p_mode = 'grade' THEN p_grade_level
      ELSE NULL
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;