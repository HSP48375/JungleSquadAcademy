/*
  # Add subscription management tables

  1. New Tables
    - `subscription_tiers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (numeric)
      - `tutor_limit` (integer)
      - `questions_per_week` (integer)
      - `stripe_price_id` (text)
      - `created_at` (timestamp)

    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `tier_id` (uuid, references subscription_tiers)
      - `stripe_subscription_id` (text)
      - `stripe_customer_id` (text)
      - `status` (text)
      - `current_period_end` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_tutors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `tutor_id` (uuid, references tutors)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create subscription_tiers table
CREATE TABLE subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  tutor_limit integer NOT NULL,
  questions_per_week integer NOT NULL,
  stripe_price_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_tutors table
CREATE TABLE user_tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tutor_id)
);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their tutor access"
  ON user_tutors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert subscription tiers
INSERT INTO subscription_tiers (name, price, tutor_limit, questions_per_week, stripe_price_id) VALUES
  ('Free', 0, 1, 5, 'price_free'),
  ('Basic', 4.99, 1, -1, 'price_basic'),
  ('Pro', 19.99, 5, -1, 'price_pro'),
  ('Ultimate', 29.99, -1, -1, 'price_ultimate');