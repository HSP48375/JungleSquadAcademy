/*
  # Add Weekly Quotes System

  1. New Tables
    - `weekly_quotes`
      - Stores motivational quotes for weekly recaps
      - Includes quote text, author, and category
      - Tracks active status for quote rotation

  2. Changes
    - Add quote_id to weekly_recaps table
    - Add policies for quote access
    - Seed initial quotes

  3. Security
    - Enable RLS on new table
    - Add appropriate policies
*/

-- Create weekly_quotes table
CREATE TABLE IF NOT EXISTS weekly_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  author text,
  category text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add quote reference to weekly_recaps
ALTER TABLE weekly_recaps
ADD COLUMN quote_id uuid REFERENCES weekly_quotes(id);

-- Enable RLS
ALTER TABLE weekly_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read weekly quotes"
  ON weekly_quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial quotes
INSERT INTO weekly_quotes (quote, author, category, active) VALUES
  ('Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier', 'perseverance', true),
  ('It always seems impossible until it''s done.', 'Nelson Mandela', 'perseverance', true),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'perseverance', true),
  ('The expert in anything was once a beginner.', 'Helen Hayes', 'growth', true),
  ('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela', 'education', true),
  ('Start where you are. Use what you have. Do what you can.', 'Arthur Ashe', 'perseverance', true),
  ('Mistakes are proof that you are trying.', 'Unknown', 'growth', true),
  ('The beautiful thing about learning is that nobody can take it away from you.', 'B.B. King', 'education', true),
  ('A journey of a thousand miles begins with a single step.', 'Lao Tzu', 'growth', true),
  ('Learning is a treasure that will follow its owner everywhere.', 'Chinese Proverb', 'education', true),
  ('Your limitation—it''s only your imagination.', 'Unknown', 'mindset', true),
  ('Push yourself, because no one else is going to do it for you.', 'Unknown', 'mindset', true),
  ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'mindset', true),
  ('You don''t have to be great to start, but you have to start to be great.', 'Zig Ziglar', 'growth', true),
  ('If you''re always trying to be normal, you''ll never know how amazing you can be.', 'Maya Angelou', 'mindset', true),
  ('Tell me and I forget. Teach me and I remember. Involve me and I learn.', 'Benjamin Franklin', 'education', true),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'mindset', true),
  ('Dream big. Work hard. Stay focused.', 'Unknown', 'perseverance', true),
  ('Failure is the opportunity to begin again more intelligently.', 'Henry Ford', 'growth', true),
  ('What we learn becomes a part of who we are.', 'Unknown', 'education', true),
  ('Every accomplishment starts with the decision to try.', 'John F. Kennedy', 'growth', true),
  ('Small progress is still progress.', 'Unknown', 'growth', true),
  ('Learning never exhausts the mind.', 'Leonardo da Vinci', 'education', true),
  ('Fall seven times, stand up eight.', 'Japanese Proverb', 'perseverance', true),
  ('You miss 100% of the shots you don''t take.', 'Wayne Gretzky', 'mindset', true),
  ('Be curious, not judgmental.', 'Walt Whitman', 'mindset', true),
  ('Keep going. Everything you need will come to you at the perfect time.', 'Unknown', 'perseverance', true),
  ('You learn something every day if you pay attention.', 'Ray LeBlond', 'education', true),
  ('Work hard in silence. Let success make the noise.', 'Frank Ocean', 'mindset', true),
  ('Effort is the foundation of success.', 'Unknown', 'growth', true);

-- Update generate_weekly_recap function to include quote
CREATE OR REPLACE FUNCTION generate_weekly_recap(p_user_id uuid, p_week_start timestamptz)
RETURNS uuid AS $$
DECLARE
  v_week_end timestamptz;
  v_recap_id uuid;
  v_quote_id uuid;
BEGIN
  -- Get random active quote
  SELECT id INTO v_quote_id
  FROM weekly_quotes
  WHERE active = true
  ORDER BY random()
  LIMIT 1;

  -- Calculate week end
  v_week_end := p_week_start + interval '7 days';

  -- Insert new recap
  INSERT INTO weekly_recaps (
    user_id,
    week_start,
    week_end,
    total_xp,
    tutors_used,
    challenges_completed,
    badges_unlocked,
    suggested_tutor,
    quote_id
  )
  SELECT
    p_user_id,
    p_week_start,
    v_week_end,
    COALESCE(SUM(xp_points), 0),
    (
      SELECT jsonb_object_agg(t.name, COUNT(*))
      FROM chat_sessions cs
      JOIN tutors t ON t.id = cs.tutor_id
      WHERE cs.user_id = p_user_id
      AND cs.created_at BETWEEN p_week_start AND v_week_end
      GROUP BY t.id
    ),
    COUNT(DISTINCT cs.id),
    (
      SELECT jsonb_agg(a.name)
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = p_user_id
      AND ua.earned_at BETWEEN p_week_start AND v_week_end
    ),
    (
      SELECT t.id
      FROM tutors t
      WHERE t.id NOT IN (
        SELECT DISTINCT cs.tutor_id
        FROM chat_sessions cs
        WHERE cs.user_id = p_user_id
      )
      ORDER BY random()
      LIMIT 1
    ),
    v_quote_id
  FROM user_progress up
  LEFT JOIN challenge_submissions cs ON cs.user_id = p_user_id
    AND cs.created_at BETWEEN p_week_start AND v_week_end
  WHERE up.user_id = p_user_id
  RETURNING id INTO v_recap_id;

  RETURN v_recap_id;
END;
$$ LANGUAGE plpgsql;