import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AvatarOfWeek {
  user_id: string;
  avatar: {
    species: {
      name: string;
      visual_effects: any;
      idle_animation: string;
    };
    avatar_name: string;
    primary_color: string;
    secondary_color: string;
  };
  stats: {
    weekly_xp: number;
    active_days: number;
    tutors_engaged: number;
  };
  week_start: string;
  week_end: string;
}

export function useAvatarOfWeek() {
  const [winner, setWinner] = useState<AvatarOfWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentWinner();
  }, []);

  const fetchCurrentWinner = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('avatar_of_week')
        .select(`
          *,
          winner:profiles!inner (
            avatar:user_avatar!inner (
              avatar_name,
              primary_color,
              secondary_color,
              species:avatar_species (
                name,
                visual_effects,
                idle_animation
              )
            )
          )
        `)
        .lte('week_start', new Date().toISOString())
        .gte('week_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      setWinner(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch Avatar of the Week');
    } finally {
      setLoading(false);
    }
  };

  return {
    winner,
    loading,
    error,
  };
}