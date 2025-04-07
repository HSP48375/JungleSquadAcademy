import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Avatar {
  id: string;
  species: {
    name: string;
    type: string;
    visual_effects: any;
    idle_animation: string;
  };
  avatar_name: string;
  primary_color: string;
  secondary_color: string;
  eye_color: string;
  facial_markings: string[];
  accessories: string[];
}

export function useAvatar(userId: string) {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchAvatar();
      fetchUnlocks();
    }
  }, [userId]);

  const fetchAvatar = async () => {
    try {
      const { data, error: avatarError } = await supabase
        .from('user_avatar')
        .select(`
          *,
          species:avatar_species (
            name,
            type,
            visual_effects,
            idle_animation
          )
        `)
        .eq('user_id', userId)
        .single();

      if (avatarError) throw avatarError;
      setAvatar(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch avatar');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlocks = async () => {
    try {
      const { data, error: unlocksError } = await supabase
        .from('avatar_unlocks')
        .select(`
          species:avatar_species (
            name
          )
        `)
        .eq('user_id', userId);

      if (unlocksError) throw unlocksError;
      setUnlocks(data?.map(unlock => unlock.species.name) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch unlocks');
    }
  };

  const updateAvatar = async (updates: Partial<Avatar>) => {
    try {
      const { error: updateError } = await supabase
        .from('user_avatar')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) throw updateError;
      await fetchAvatar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update avatar');
    }
  };

  return {
    avatar,
    unlocks,
    loading,
    error,
    updateAvatar,
  };
}