import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Competition {
  id: string;
  title: string;
  description: string;
  subject: string;
  start_date: string;
  end_date: string;
  reward_type: string;
  leaderboard_enabled: boolean;
  participation_threshold: number;
  participation_reward: number;
  created_at: string;
}

interface Participant {
  id: string;
  competition_id: string;
  user_id: string;
  total_xp: number;
  challenges_completed: number;
  opted_in: boolean;
  created_at: string;
  updated_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  avatar_name: string;
  total_xp: number;
  challenges_completed: number;
}

interface Reward {
  id: string;
  competition_id: string;
  rank: number;
  reward_type: string;
  reward_amount: number;
  reward_item_id: string | null;
  created_at: string;
}

export function useCompetitions(userId: string) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [participation, setParticipation] = useState<Record<string, Participant>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rewards, setRewards] = useState<Record<string, Reward[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all competitions
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all competitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('weekly_competitions')
        .select('*')
        .order('start_date', { ascending: false });

      if (competitionsError) throw competitionsError;
      
      setCompetitions(competitionsData || []);
      
      // Find active competition
      const now = new Date();
      const active = competitionsData?.find(comp => 
        new Date(comp.start_date) <= now && new Date(comp.end_date) >= now
      ) || null;
      
      setActiveCompetition(active);
      
      // If there's an active competition, fetch its leaderboard
      if (active) {
        fetchLeaderboard(active.id);
      }
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch competitions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's participation in competitions
  const fetchParticipation = useCallback(async () => {
    try {
      if (!userId) return;
      
      const { data, error: participationError } = await supabase
        .from('competition_participants')
        .select('*')
        .eq('user_id', userId);

      if (participationError) throw participationError;
      
      // Convert to record for easier lookup
      const participationRecord = (data || []).reduce((acc, participant) => {
        acc[participant.competition_id] = participant;
        return acc;
      }, {} as Record<string, Participant>);
      
      setParticipation(participationRecord);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch participation data');
    }
  }, [userId]);

  // Fetch leaderboard for a specific competition
  const fetchLeaderboard = useCallback(async (competitionId: string) => {
    try {
      const { data, error: leaderboardError } = await supabase
        .rpc('get_competition_leaderboard', {
          competition_id: competitionId,
          limit_count: 10
        });

      if (leaderboardError) throw leaderboardError;
      
      setLeaderboard(data || []);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch leaderboard');
    }
  }, []);

  // Fetch rewards for a specific competition
  const fetchRewards = useCallback(async (competitionId: string) => {
    try {
      const { data, error: rewardsError } = await supabase
        .from('competition_rewards')
        .select('*')
        .eq('competition_id', competitionId)
        .order('rank');

      if (rewardsError) throw rewardsError;
      
      // Store rewards by competition ID
      setRewards(prev => ({
        ...prev,
        [competitionId]: data || []
      }));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch rewards');
    }
  }, []);

  // Join a competition
  const joinCompetition = useCallback(async (competitionId: string) => {
    try {
      if (!userId) return false;
      
      const { data, error: joinError } = await supabase
        .rpc('join_competition', {
          p_user_id: userId,
          p_competition_id: competitionId
        });

      if (joinError) throw joinError;
      
      // Refresh participation data
      await fetchParticipation();
      
      return true;
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join competition');
      return false;
    }
  }, [userId, fetchParticipation]);

  // Leave a competition
  const leaveCompetition = useCallback(async (competitionId: string) => {
    try {
      if (!userId) return false;
      
      const { data, error: leaveError } = await supabase
        .rpc('leave_competition', {
          p_user_id: userId,
          p_competition_id: competitionId
        });

      if (leaveError) throw leaveError;
      
      // Refresh participation data
      await fetchParticipation();
      
      return true;
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to leave competition');
      return false;
    }
  }, [userId, fetchParticipation]);

  // Get competition details
  const getCompetition = useCallback((competitionId: string) => {
    return competitions.find(comp => comp.id === competitionId) || null;
  }, [competitions]);

  // Get user's rank in a competition
  const getUserRank = useCallback((competitionId: string) => {
    const userEntry = leaderboard.find(entry => entry.user_id === userId);
    return userEntry ? userEntry.rank : null;
  }, [leaderboard, userId]);

  // Initialize data
  useEffect(() => {
    fetchCompetitions();
    if (userId) {
      fetchParticipation();
    }
  }, [fetchCompetitions, fetchParticipation, userId]);

  return {
    competitions,
    activeCompetition,
    participation,
    leaderboard,
    rewards,
    loading,
    error,
    fetchCompetitions,
    fetchParticipation,
    fetchLeaderboard,
    fetchRewards,
    joinCompetition,
    leaveCompetition,
    getCompetition,
    getUserRank,
  };
}