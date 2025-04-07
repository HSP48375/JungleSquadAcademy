import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  unlock_condition: string;
  unlock_threshold: number | null;
  reward_type: string;
  reward_data: any;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  reward_claimed: boolean;
}

export function useAchievements(userId: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    if (userId) {
      fetchAchievements();
      subscribeToAchievements();
    }
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('easter_egg_achievements')
        .select('*')
        .order('created_at');

      if (achievementsError) throw achievementsError;
      
      // Fetch user's unlocked achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_easter_eggs')
        .select('*')
        .eq('user_id', userId);

      if (userAchievementsError) throw userAchievementsError;
      
      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAchievements = () => {
    const subscription = supabase
      .channel('user_easter_eggs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_easter_eggs',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Get the achievement details
          const { data: achievement, error } = await supabase
            .from('easter_egg_achievements')
            .select('*')
            .eq('id', payload.new.achievement_id)
            .single();
          
          if (!error && achievement) {
            // Trigger haptic feedback on non-web platforms
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            // Set the new achievement to show toast
            setNewAchievement(achievement);
            
            // Update the user achievements list
            setUserAchievements(prev => [...prev, payload.new]);
          }
          
          // Refresh achievements
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      // Call the edge function to unlock the achievement
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/unlock-easter-egg`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          achievementId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlock achievement');
      }
      
      // Refresh achievements
      await fetchAchievements();
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlock achievement');
      return false;
    }
  };

  const claimReward = async (userAchievementId: string) => {
    try {
      // Update the user achievement to mark reward as claimed
      const { error } = await supabase
        .from('user_easter_eggs')
        .update({ reward_claimed: true })
        .eq('id', userAchievementId);

      if (error) throw error;
      
      // Refresh achievements
      await fetchAchievements();
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to claim reward');
      return false;
    }
  };

  const clearNewAchievement = () => {
    setNewAchievement(null);
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockedAchievements = () => {
    return achievements.filter(a => 
      userAchievements.some(ua => ua.achievement_id === a.id)
    );
  };

  const getLockedAchievements = () => {
    return achievements.filter(a => 
      !userAchievements.some(ua => ua.achievement_id === a.id)
    );
  };

  return {
    achievements,
    userAchievements,
    loading,
    error,
    newAchievement,
    unlockAchievement,
    claimReward,
    clearNewAchievement,
    isAchievementUnlocked,
    getUnlockedAchievements,
    getLockedAchievements,
    refreshAchievements: fetchAchievements,
  };
}