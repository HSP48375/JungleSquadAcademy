import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface QuoteTheme {
  id: string;
  theme: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface QuoteEntry {
  id: string;
  user_id: string;
  theme_id: string;
  quote_text: string;
  created_at: string;
  vote_count?: number;
  user?: {
    avatar: {
      avatar_name: string;
      species: {
        name: string;
      };
      primary_color: string;
    };
  };
  has_voted?: boolean;
}

interface QuoteWinner {
  id: string;
  entry_id: string;
  theme_id: string;
  user_id: string;
  votes_count: number;
  coins_awarded: number;
  xp_awarded: number;
  announced_at: string;
  entry?: {
    quote_text: string;
    user: {
      avatar: {
        avatar_name: string;
        species: {
          name: string;
        };
      };
    };
  };
  theme?: {
    theme: string;
  };
}

export function useQuoteCompetition(userId: string) {
  const [activeTheme, setActiveTheme] = useState<QuoteTheme | null>(null);
  const [entries, setEntries] = useState<QuoteEntry[]>([]);
  const [userEntry, setUserEntry] = useState<QuoteEntry | null>(null);
  const [hasVotedToday, setHasVotedToday] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<QuoteWinner | null>(null);
  const [pastWinners, setPastWinners] = useState<QuoteWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchActiveTheme();
      fetchCurrentWinner();
      fetchPastWinners();
    }
  }, [userId]);

  const fetchActiveTheme = async () => {
    try {
      setLoading(true);
      
      // Get active theme
      const { data: themeId, error: themeError } = await supabase.rpc('get_active_quote_theme');
      
      if (themeError) {
        throw themeError;
      }

      if (!themeId) {
        return;
      }

      // Get theme details
      const { data: themeData, error: themeDetailsError } = await supabase
        .from('quote_themes')
        .select('*')
        .eq('id', themeId)
        .single();

      if (themeDetailsError) throw themeDetailsError;
      
      setActiveTheme(themeData);
      
      // Fetch entries for this theme
      await fetchEntries(themeId);
      
      // Check if user already submitted for this theme
      const { data: existingEntry, error: checkError } = await supabase
        .from('quote_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('theme_id', themeId)
        .single();

      if (!checkError && existingEntry) {
        setUserEntry(existingEntry);
      }
      
      // Check if user has voted today
      const { data: hasVoted, error: voteError } = await supabase.rpc(
        'has_voted_today',
        {
          p_user_id: userId,
          p_theme_id: themeId
        }
      );
      
      if (!voteError) {
        setHasVotedToday(hasVoted);
      }
      
    } catch (e) {
      console.error('Error fetching active theme:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch active theme');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (themeId: string) => {
    try {
      const { data, error } = await supabase
        .from('quote_entries')
        .select(`
          *,
          user:profiles!inner (
            avatar:user_avatar!inner (
              avatar_name,
              primary_color,
              species:avatar_species (name)
            )
          )
        `)
        .eq('theme_id', themeId)
        .order('created_at');

      if (error) throw error;
      
      // Get vote counts for each entry
      const entriesWithVotes = await Promise.all(
        data.map(async (entry) => {
          const { data: voteCount, error: voteError } = await supabase.rpc(
            'get_entry_vote_count',
            { p_entry_id: entry.id }
          );
          
          const { data: userVote, error: userVoteError } = await supabase
            .from('quote_votes')
            .select('id')
            .eq('user_id', userId)
            .eq('entry_id', entry.id)
            .single();
            
          return {
            ...entry,
            vote_count: voteError ? 0 : voteCount,
            has_voted: !userVoteError && userVote ? true : false
          };
        })
      );
      
      setEntries(entriesWithVotes);
    } catch (e) {
      console.error('Error fetching entries:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch entries');
    }
  };

  const fetchCurrentWinner = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_winners')
        .select(`
          *,
          entry:quote_entries!inner(
            quote_text,
            user:profiles!inner(
              avatar:user_avatar!inner(
                avatar_name,
                species:avatar_species(name)
              )
            )
          ),
          theme:quote_themes!inner(theme)
        `)
        .order('announced_at', { ascending: false })
        .limit(1)
        .single();

      if (!error) {
        setCurrentWinner(data);
      }
    } catch (e) {
      // No winner yet is not an error
      console.log('No current winner found');
    }
  };

  const fetchPastWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_winners')
        .select(`
          *,
          entry:quote_entries!inner(
            quote_text,
            user:profiles!inner(
              avatar:user_avatar!inner(
                avatar_name,
                species:avatar_species(name)
              )
            )
          ),
          theme:quote_themes!inner(theme)
        `)
        .order('announced_at', { ascending: false })
        .range(1, 10);

      if (error) throw error;
      setPastWinners(data || []);
    } catch (e) {
      console.error('Error fetching past winners:', e);
    }
  };

  const submitQuote = async (quoteText: string) => {
    if (!activeTheme) {
      setError('No active theme found');
      return false;
    }
    
    if (!quoteText.trim()) {
      setError('Quote text cannot be empty');
      return false;
    }
    
    if (quoteText.length > 180) {
      setError('Quote must be 180 characters or less');
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/submit-quote-entry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteText }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit quote');
      }
      
      // Trigger haptic feedback on success
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Refresh data
      await fetchActiveTheme();
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit quote');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const voteForQuote = async (entryId: string) => {
    try {
      setVoting(true);
      setError(null);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/vote-for-quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to vote for quote');
      }
      
      // Trigger haptic feedback on success
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Refresh data
      if (activeTheme) {
        await fetchEntries(activeTheme.id);
        setHasVotedToday(true);
      }
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to vote for quote');
      return false;
    } finally {
      setVoting(false);
    }
  };

  const getTimeRemaining = () => {
    if (!activeTheme) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const now = new Date();
    const end = new Date(activeTheme.end_date);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  return {
    activeTheme,
    entries,
    userEntry,
    hasVotedToday,
    currentWinner,
    pastWinners,
    loading,
    submitting,
    voting,
    error,
    submitQuote,
    voteForQuote,
    getTimeRemaining,
    refreshData: fetchActiveTheme,
  };
}