import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type TutorProgress = {
  tutorId: string;
  xpPoints: number;
  chatMinutes: number;
  challengesCompleted: number;
  hasAchievement: boolean;
};

export function useTutorProgress(userId: string) {
  const [progress, setProgress] = useState<Record<string, TutorProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProgress();
    }
  }, [userId]);

  const fetchProgress = async () => {
    try {
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('tutor_id, xp_points, time_spent')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Fetch challenge completions
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenge_submissions')
        .select('challenge_id, status')
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (challengeError) throw challengeError;

      // Fetch chat sessions duration
      const { data: chatData, error: chatError } = await supabase
        .from('chat_sessions')
        .select(`
          tutor_id,
          chat_messages (
            created_at
          )
        `)
        .eq('user_id', userId);

      if (chatError) throw chatError;

      // Combine all data
      const tutorProgress: Record<string, TutorProgress> = {};

      progressData?.forEach(item => {
        tutorProgress[item.tutor_id] = {
          tutorId: item.tutor_id,
          xpPoints: item.xp_points,
          chatMinutes: 0,
          challengesCompleted: 0,
          hasAchievement: item.xp_points >= 100,
        };
      });

      // Add challenge completions
      challengeData?.forEach(submission => {
        const tutorId = submission.challenge_id; // You'll need to join with challenges table to get tutor_id
        if (tutorProgress[tutorId]) {
          tutorProgress[tutorId].challengesCompleted++;
        }
      });

      // Calculate chat duration
      chatData?.forEach(session => {
        if (session.chat_messages && session.chat_messages.length > 1) {
          const minutes = Math.floor(
            (new Date(session.chat_messages[session.chat_messages.length - 1].created_at).getTime() -
              new Date(session.chat_messages[0].created_at).getTime()) /
              (1000 * 60)
          );
          if (tutorProgress[session.tutor_id]) {
            tutorProgress[session.tutor_id].chatMinutes += minutes;
          }
        }
      });

      setProgress(tutorProgress);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tutor progress');
    } finally {
      setLoading(false);
    }
  };

  return { progress, loading, error };
}