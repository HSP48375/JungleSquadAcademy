import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Challenge = Database['public']['Tables']['daily_challenges']['Row'];
type Submission = Database['public']['Tables']['challenge_submissions']['Row'];

export function useChallenges(userId: string) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchChallenges();
    }
  }, [userId]);

  async function fetchChallenges() {
    try {
      setLoading(true);

      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // Fetch user's submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('user_id', userId);

      if (submissionsError) throw submissionsError;

      setChallenges(challengesData);
      setSubmissions(submissionsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  }

  async function submitChallenge(challengeId: string) {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .insert([
          {
            challenge_id: challengeId,
            user_id: userId,
            content: 'Submitted',
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSubmissions((prev) => [...prev, data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit challenge');
    }
  }

  return {
    challenges,
    submissions,
    loading,
    error,
    submitChallenge,
  };
}