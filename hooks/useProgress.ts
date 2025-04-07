import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Progress = Database['public']['Tables']['user_progress']['Row'];

export function useProgress(userId: string) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProgress();
    }
  }, [userId]);

  async function fetchProgress() {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*, tutors(*)')
        .eq('user_id', userId);

      if (error) throw error;

      setProgress(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress(tutorId: string, xpPoints: number) {
    try {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('tutor_id', tutorId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('user_progress')
          .update({
            xp_points: existing.xp_points + xpPoints,
            last_interaction: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        
        setProgress(prev =>
          prev.map(p => (p.id === data.id ? data : p))
        );
      } else {
        const { data, error } = await supabase
          .from('user_progress')
          .insert([
            {
              user_id: userId,
              tutor_id: tutorId,
              xp_points: xpPoints,
              last_interaction: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setProgress(prev => [...prev, data]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update progress');
    }
  }

  return {
    progress,
    loading,
    error,
    updateProgress,
  };
}