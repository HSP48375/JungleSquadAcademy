import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Share, Platform } from 'react-native';

export function useReferral(userId: string) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [pendingReferrals, setPendingReferrals] = useState<any[]>([]);
  const [rewardTier, setRewardTier] = useState<{
    tier: string;
    bonus: number;
    color: string;
    claimed: boolean;
  }>({ tier: 'Bronze', bonus: 0, color: '#CD7F32', claimed: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchReferralData();
    }
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      
      // Get user's referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Generate referral link
      const baseUrl = 'https://academy.junglesquad.com';
      const generatedLink = `${baseUrl}/join?ref=${profile.referral_code}`;
      
      setReferralCode(profile.referral_code);
      setReferralLink(generatedLink);
      
      // Get user's completed referrals
      const { data: completedReferrals, error: completedError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:profiles!referred_id (
            avatar:user_avatar (
              avatar_name,
              species:avatar_species (name),
              primary_color
            )
          )
        `)
        .eq('referrer_id', userId)
        .eq('status', 'completed');
      
      if (completedError) throw completedError;
      
      // Get user's pending referrals
      const { data: pendingData, error: pendingError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:profiles!referred_id (
            avatar:user_avatar (
              avatar_name,
              species:avatar_species (name),
              primary_color
            )
          )
        `)
        .eq('referrer_id', userId)
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      setReferrals(completedReferrals || []);
      setPendingReferrals(pendingData || []);
      
      // Calculate total coins earned
      const totalEarned = completedReferrals?.reduce((sum, ref) => sum + (ref.coins_earned || 0), 0) || 0;
      setTotalCoins(totalEarned);
      
      // Get user's reward tier status
      const { data: tierData, error: tierError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('tier', { ascending: false })
        .limit(1);
      
      if (tierError) throw tierError;
      
      // Calculate current tier based on referral count
      const count = completedReferrals?.length || 0;
      let currentTier = { tier: 'Bronze', bonus: 0, color: '#CD7F32', claimed: false };
      
      if (count >= 25) {
        currentTier = { tier: 'Diamond', bonus: 100, color: '#00FFFF', claimed: false };
      } else if (count >= 10) {
        currentTier = { tier: 'Gold', bonus: 50, color: '#FFD700', claimed: false };
      } else if (count >= 5) {
        currentTier = { tier: 'Silver', bonus: 25, color: '#C0C0C0', claimed: false };
      }
      
      // Check if tier has been claimed
      if (tierData && tierData.length > 0) {
        const highestClaimedTier = tierData[0].tier;
        if (
          (highestClaimedTier === 'Diamond' && currentTier.tier === 'Diamond') ||
          (highestClaimedTier === 'Gold' && ['Gold', 'Diamond'].includes(currentTier.tier)) ||
          (highestClaimedTier === 'Silver' && ['Silver', 'Gold', 'Diamond'].includes(currentTier.tier)) ||
          (highestClaimedTier === 'Bronze' && currentTier.tier === 'Bronze')
        ) {
          currentTier.claimed = true;
        }
      }
      
      setRewardTier(currentTier);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      await Share.share({
        message: `Join me on Jungle Squad Academy, the world's most advanced AI tutoring ecosystem! Use my referral code: ${referralCode} or sign up here: ${referralLink}`,
        url: Platform.OS === 'ios' ? referralLink : undefined,
        title: 'Join Jungle Squad Academy'
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share referral link');
    }
  };

  const redeemReferralCode = async (code: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/redeem-referral`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: code }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to redeem referral code');
      }
      
      return { success: true, reward: result.reward };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to redeem referral code');
      return { success: false, error: e instanceof Error ? e.message : 'Failed to redeem referral code' };
    } finally {
      setLoading(false);
    }
  };

  const claimTierReward = async () => {
    if (rewardTier.claimed || rewardTier.bonus === 0) return false;
    
    try {
      setLoading(true);
      
      // Record the tier claim
      const { error: claimError } = await supabase
        .from('referral_rewards')
        .insert({
          user_id: userId,
          tier: rewardTier.tier,
          bonus_amount: rewardTier.bonus,
          claimed_at: new Date().toISOString()
        });
      
      if (claimError) throw claimError;
      
      // Award the coins
      const { error: coinError } = await supabase.rpc('handle_coin_transaction', {
        p_user_id: userId,
        p_amount: rewardTier.bonus,
        p_type: 'reward',
        p_description: `${rewardTier.tier} tier referral bonus`
      });
      
      if (coinError) throw coinError;
      
      // Update local state
      setRewardTier({ ...rewardTier, claimed: true });
      setTotalCoins(prev => prev + rewardTier.bonus);
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to claim tier reward');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    referralCode,
    referralLink,
    referrals,
    pendingReferrals,
    totalCoins,
    rewardTier,
    loading,
    error,
    shareReferralLink,
    redeemReferralCode,
    claimTierReward,
    refreshReferrals: fetchReferralData
  };
}