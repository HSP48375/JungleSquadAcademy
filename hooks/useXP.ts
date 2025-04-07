import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';

interface XPData {
  total: number;
  today: number;
  streak: number;
  level: number;
  levelProgress: number;
  streakResetAt: string | null;
  lastActivityAt: string | null;
}

interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  multiplier: number;
  streak_bonus: number;
  final_amount: number;
  created_at: string;
}

export function useXP(userId: string) {
  const [xpData, setXPData] = useState<XPData>({
    total: 0,
    today: 0,
    streak: 0,
    level: 1,
    levelProgress: 0,
    streakResetAt: null,
    lastActivityAt: null,
  });
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscription } = useSubscription(userId);

  // Calculate level and level progress
  const calculateLevel = (xp: number) => {
    const level = Math.floor(xp / 100) + 1;
    const levelProgress = (xp % 100) / 100;
    return { level, levelProgress };
  };

  // Fetch XP data
  const fetchXPData = async () => {
    try {
      setLoading(true);
      
      // Update last activity timestamp
      await supabase
        .from('profiles')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', userId);
      
      // Get XP data
      const { data, error: xpError } = await supabase
        .from('profiles')
        .select('xp_total, xp_today, xp_streak, streak_reset_at, last_activity_at')
        .eq('id', userId)
        .single();

      if (xpError) throw xpError;

      if (data) {
        const { level, levelProgress } = calculateLevel(data.xp_total);
        setXPData({
          total: data.xp_total,
          today: data.xp_today,
          streak: data.xp_streak,
          level,
          levelProgress,
          streakResetAt: data.streak_reset_at,
          lastActivityAt: data.last_activity_at,
        });
      }

      // Get recent transactions
      const { data: txData, error: txError } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch XP data');
    } finally {
      setLoading(false);
    }
  };

  // Add XP
  const addXP = async (amount: number, source: string) => {
    try {
      // Call the add_user_xp function
      const { error } = await supabase.rpc('add_user_xp', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source,
      });

      if (error) throw error;

      // Refresh XP data
      await fetchXPData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add XP');
    }
  };

  // Get XP multiplier based on subscription tier
  const getXPMultiplier = () => {
    if (!subscription || subscription.status !== 'active') {
      return 1.0;
    }

    const tierName = subscription.subscription_tiers?.name;
    
    switch (tierName) {
      case 'Elite Legend Squad':
        return 2.0;
      case 'All Access Plan':
        return 1.5;
      case '5 Tutor Plan':
        return 1.25;
      case 'Single Tutor Plan':
        return 1.1;
      default:
        return 1.0;
    }
  };

  // Get streak bonus multiplier
  const getStreakBonus = () => {
    if (xpData.streak >= 7) return 2.0;
    if (xpData.streak >= 5) return 1.5;
    if (xpData.streak >= 3) return 1.25;
    return 1.0;
  };

  // Calculate time until streak reset
  const getStreakResetTime = () => {
    if (!xpData.streakResetAt) return null;
    
    const resetTime = new Date(xpData.streakResetAt);
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return { hours: 0, minutes: 0 };
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  // Initialize
  useEffect(() => {
    if (userId) {
      fetchXPData();
    }
  }, [userId]);

  return {
    xp: xpData,
    transactions,
    loading,
    error,
    addXP,
    fetchXPData,
    getXPMultiplier,
    getStreakBonus,
    getStreakResetTime,
  };
}