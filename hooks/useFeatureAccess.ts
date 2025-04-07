import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FeatureAccess {
  canAccessTutor: (tutorId: string) => boolean;
  canAccessPremiumGames: boolean;
  canAccessAllTutors: boolean;
  hasDoubleXp: boolean;
  hasExclusiveCosmetics: boolean;
  loading: boolean;
  error: string | null;
}

export function useFeatureAccess(userId: string): FeatureAccess {
  const [subscription, setSubscription] = useState<any>(null);
  const [allowedTutors, setAllowedTutors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData();
    }
  }, [userId]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch user's subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_tiers (*)
        `)
        .eq('user_id', userId)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      setSubscription(subscriptionData);

      // Fetch allowed tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('user_tutors')
        .select('tutor_id')
        .eq('user_id', userId);

      if (tutorsError) {
        throw tutorsError;
      }

      setAllowedTutors(tutorsData?.map(t => t.tutor_id) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const canAccessTutor = (tutorId: string): boolean => {
    // If no subscription, only allow access to free tutors
    if (!subscription) {
      return allowedTutors.includes(tutorId);
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return allowedTutors.includes(tutorId);
    }

    // If unlimited tutors (All Access or Elite plans)
    if (subscription.subscription_tiers?.tutor_limit === -1) {
      return true;
    }

    // If limited tutors, check if this tutor is allowed
    return allowedTutors.includes(tutorId);
  };

  // Determine premium features access
  const canAccessPremiumGames = subscription?.status === 'active';
  
  const canAccessAllTutors = 
    subscription?.status === 'active' && 
    subscription?.subscription_tiers?.tutor_limit === -1;
  
  const hasDoubleXp = 
    subscription?.status === 'active' && 
    subscription?.subscription_tiers?.perks?.double_xp === true;
  
  const hasExclusiveCosmetics = 
    subscription?.status === 'active' && 
    subscription?.subscription_tiers?.perks?.exclusive_cosmetics === true;

  return {
    canAccessTutor,
    canAccessPremiumGames,
    canAccessAllTutors,
    hasDoubleXp,
    hasExclusiveCosmetics,
    loading,
    error,
  };
}