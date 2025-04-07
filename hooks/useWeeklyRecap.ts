import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useWeeklyRecap(userId: string) {
  const [recap, setRecap] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchRecap();
      fetchPreferences();
    }
  }, [userId]);

  const fetchRecap = async () => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const { data, error: recapError } = await supabase
        .from('weekly_recaps')
        .select(`
          *,
          suggested_tutor:tutors (
            name,
            animal
          ),
          quote:weekly_quotes (
            text: quote,
            author,
            category
          )
        `)
        .eq('user_id', userId)
        .gte('week_start', weekStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recapError) throw recapError;
      setRecap(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch recap');
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data, error: prefError } = await supabase
        .from('user_recap_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefError && prefError.code !== 'PGRST116') throw prefError;
      setPreferences(data || { email_enabled: true, in_app_enabled: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: {
    email_enabled?: boolean;
    in_app_enabled?: boolean;
    mentor_email?: string | null;
  }) => {
    try {
      const { error } = await supabase
        .from('user_recap_preferences')
        .upsert({
          user_id: userId,
          ...newPreferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchPreferences();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update preferences');
    }
  };

  const shareRecap = async (email: string) => {
    if (!recap) return;

    try {
      const { error } = await supabase
        .from('recap_shares')
        .insert({
          recap_id: recap.id,
          recipient_email: email,
        });

      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share recap');
    }
  };

  return {
    recap,
    preferences,
    loading,
    error,
    updatePreferences,
    shareRecap,
  };
}