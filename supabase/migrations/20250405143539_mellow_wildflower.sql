/*
  # Add Notification System

  1. New Tables
    - `notifications`
      - Stores user notifications with type, content, and read status
    - `notification_preferences`
      - Stores user preferences for different notification types
    - `email_templates`
      - Stores HTML templates for email notifications

  2. Changes
    - Add functions for notification management
    - Add triggers for automatic notifications
    - Add policies for data access

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  quote_updates boolean DEFAULT true,
  streak_reminders boolean DEFAULT true,
  achievement_alerts boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  variables jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Create function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_preferences record;
BEGIN
  -- Check user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- If no preferences exist, create default
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  -- Check if this notification type is enabled
  IF (
    (p_type = 'quote_update' AND v_preferences.quote_updates) OR
    (p_type = 'streak_reminder' AND v_preferences.streak_reminders) OR
    (p_type = 'achievement' AND v_preferences.achievement_alerts) OR
    (p_type = 'weekly_summary' AND v_preferences.weekly_summary) OR
    (p_type NOT IN ('quote_update', 'streak_reminder', 'achievement', 'weekly_summary'))
  ) THEN
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      expires_at
    ) VALUES (
      p_user_id,
      p_type,
      p_title,
      p_message,
      p_data,
      p_expires_at
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_success boolean;
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id
  AND user_id = p_user_id;
  
  GET DIAGNOSTICS v_success = ROW_COUNT;
  
  RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id uuid
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = p_user_id
  AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for avatar of week notification
CREATE OR REPLACE FUNCTION notify_avatar_of_week()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the winner
  PERFORM create_notification(
    NEW.user_id,
    'achievement',
    'Congratulations! You are Avatar of the Week!',
    'Your avatar has been featured as the Avatar of the Week. Check it out in the Community section!',
    jsonb_build_object(
      'achievement_type', 'avatar_of_week',
      'week_start', NEW.week_start,
      'week_end', NEW.week_end
    ),
    NEW.week_end
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote featured notification
CREATE OR REPLACE FUNCTION notify_quote_featured()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.featured_at IS NOT NULL AND (OLD.featured_at IS NULL OR OLD.featured_at <> NEW.featured_at) THEN
    -- Create notification for the quote author
    PERFORM create_notification(
      NEW.user_id,
      'quote_update',
      'Your Quote is Featured!',
      'Your quote has been featured in the Community section. You earned 50 coins!',
      jsonb_build_object(
        'quote_id', NEW.id,
        'quote_text', NEW.quote_text,
        'featured_at', NEW.featured_at
      ),
      NEW.featured_at + interval '7 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote competition winner notification
CREATE OR REPLACE FUNCTION notify_quote_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the winner
  PERFORM create_notification(
    NEW.user_id,
    'achievement',
    'Congratulations! Your Quote Won!',
    'Your quote received the most votes and won the weekly competition!',
    jsonb_build_object(
      'quote_id', NEW.entry_id,
      'votes', NEW.votes_count,
      'coins_awarded', NEW.coins_awarded,
      'xp_awarded', NEW.xp_awarded
    ),
    NEW.announced_at + interval '7 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak about to break notification
CREATE OR REPLACE FUNCTION notify_streak_about_to_break()
RETURNS TRIGGER AS $$
BEGIN
  -- If streak is at least 3 and streak reset is within 12 hours
  IF NEW.xp_streak >= 3 AND 
     NEW.streak_reset_at IS NOT NULL AND 
     NEW.streak_reset_at - now() <= interval '12 hours' AND
     NEW.streak_reset_at - now() > interval '0 seconds' THEN
    
    -- Create notification
    PERFORM create_notification(
      NEW.id,
      'streak_reminder',
      'Your Streak is About to End!',
      'Log in within the next 12 hours to maintain your ' || NEW.xp_streak || '-day streak!',
      jsonb_build_object(
        'streak', NEW.xp_streak,
        'reset_at', NEW.streak_reset_at
      ),
      NEW.streak_reset_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables
DROP TRIGGER IF EXISTS avatar_of_week_notification ON avatar_of_week;
CREATE TRIGGER avatar_of_week_notification
  AFTER INSERT ON avatar_of_week
  FOR EACH ROW
  EXECUTE FUNCTION notify_avatar_of_week();

DROP TRIGGER IF EXISTS quote_featured_notification ON quote_submissions;
CREATE TRIGGER quote_featured_notification
  AFTER UPDATE OF featured_at ON quote_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_featured();

DROP TRIGGER IF EXISTS quote_winner_notification ON quote_winners;
CREATE TRIGGER quote_winner_notification
  AFTER INSERT ON quote_winners
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_winner();

DROP TRIGGER IF EXISTS streak_reminder_notification ON profiles;
CREATE TRIGGER streak_reminder_notification
  AFTER UPDATE OF streak_reset_at ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_streak_about_to_break();

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables)
VALUES
  (
    'weekly_summary',
    'Your Weekly Jungle Squad Summary',
    '<html><body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;"><h1 style="color: #00FFA9; text-align: center; margin-bottom: 20px;">Your Weekly Jungle Squad Summary</h1><p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Here''s how you did this week, {{name}}!</p><div style="background-color: rgba(0, 255, 169, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;"><h2 style="color: #FFFFFF; margin-top: 0;">XP Progress</h2><p style="color: #FFFFFF;">You earned <span style="color: #00FFA9; font-weight: bold;">{{xp_earned}} XP</span> this week!</p><p style="color: #FFFFFF;">Current streak: <span style="color: #FFD700; font-weight: bold;">{{streak}} days</span></p></div><div style="background-color: rgba(255, 215, 0, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;"><h2 style="color: #FFFFFF; margin-top: 0;">Achievements</h2><p style="color: #FFFFFF;">{{achievements_summary}}</p></div><div style="background-color: rgba(0, 170, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;"><h2 style="color: #FFFFFF; margin-top: 0;">Learning Focus</h2><p style="color: #FFFFFF;">{{learning_summary}}</p></div><div style="text-align: center; margin-top: 30px;"><a href="https://academy.junglesquad.com" style="background-color: #00FFA9; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue Learning</a></div><p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled weekly summaries in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p></div></body></html>',
    'Your Weekly Jungle Squad Summary\n\nHere''s how you did this week, {{name}}!\n\nXP PROGRESS\nYou earned {{xp_earned}} XP this week!\nCurrent streak: {{streak}} days\n\nACHIEVEMENTS\n{{achievements_summary}}\n\nLEARNING FOCUS\n{{learning_summary}}\n\nContinue learning at https://academy.junglesquad.com\n\nYou received this email because you enabled weekly summaries in your notification preferences. Manage preferences at https://academy.junglesquad.com/profile/notification-settings',
    '{"name": "User''s name", "xp_earned": "XP earned this week", "streak": "Current streak days", "achievements_summary": "Summary of achievements", "learning_summary": "Summary of learning activity"}'
  ),
  (
    'streak_reminder',
    'Don''t Break Your Streak!',
    '<html><body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;"><h1 style="color: #FF4444; text-align: center; margin-bottom: 20px;">Your Streak is About to End!</h1><p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Hey {{name}}, don''t lose your {{streak}}-day streak!</p><div style="background-color: rgba(255, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;"><h2 style="color: #FFFFFF; margin-top: 0;">⚠️ Streak Alert</h2><p style="color: #FFFFFF; font-size: 18px;">Your streak will reset in <span style="color: #FF4444; font-weight: bold;">{{hours_left}} hours</span>!</p></div><div style="text-align: center; margin-top: 30px;"><a href="https://academy.junglesquad.com" style="background-color: #FF4444; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Log In Now</a></div><p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled streak reminders in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p></div></body></html>',
    'Your Streak is About to End!\n\nHey {{name}}, don''t lose your {{streak}}-day streak!\n\nSTREAK ALERT\nYour streak will reset in {{hours_left}} hours!\n\nLog in now at https://academy.junglesquad.com\n\nYou received this email because you enabled streak reminders in your notification preferences. Manage preferences at https://academy.junglesquad.com/profile/notification-settings',
    '{"name": "User''s name", "streak": "Current streak days", "hours_left": "Hours until streak resets"}'
  ),
  (
    'quote_featured',
    'Your Quote Has Been Featured!',
    '<html><body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;"><h1 style="color: #FFD700; text-align: center; margin-bottom: 20px;">Your Quote Has Been Featured!</h1><p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Congratulations {{name}}! Your wisdom is now featured in the Jungle Squad community.</p><div style="background-color: rgba(255, 215, 0, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;"><h2 style="color: #FFFFFF; margin-top: 0;">Your Quote</h2><p style="color: #FFFFFF; font-size: 18px; font-style: italic;">"{{quote_text}}"</p></div><div style="background-color: rgba(0, 255, 169, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;"><h2 style="color: #FFFFFF; margin-top: 0;">Your Reward</h2><p style="color: #FFFFFF;">You''ve earned <span style="color: #FFD700; font-weight: bold;">50 Jungle Coins</span>!</p></div><div style="text-align: center; margin-top: 30px;"><a href="https://academy.junglesquad.com/community/quotes" style="background-color: #FFD700; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Featured Quotes</a></div><p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled quote updates in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p></div></body></html>',
    'Your Quote Has Been Featured!\n\nCongratulations {{name}}! Your wisdom is now featured in the Jungle Squad community.\n\nYOUR QUOTE\n"{{quote_text}}"\n\nYOUR REWARD\nYou''ve earned 50 Jungle Coins!\n\nView Featured Quotes at https://academy.junglesquad.com/community/quotes\n\nYou received this email because you enabled quote updates in your notification preferences. Manage preferences at https://academy.junglesquad.com/profile/notification-settings',
    '{"name": "User''s name", "quote_text": "The featured quote text"}'
  );

-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;