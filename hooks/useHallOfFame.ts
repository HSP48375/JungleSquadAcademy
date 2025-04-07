import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface QuoteWinner {
  id: string;
  entry: {
    quote_text: string;
    user: {
      avatar: {
        avatar_name: string;
        species: {
          name: string;
        };
        primary_color: string;
        secondary_color: string;
      };
    };
  };
  theme: {
    theme: string;
  };
  votes_count: number;
  coins_awarded: number;
  xp_awarded: number;
  announced_at: string;
}

export function useHallOfFame() {
  const [winners, setWinners] = useState<QuoteWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('quote_winners')
        .select(`
          *,
          entry:quote_entries!inner(
            quote_text,
            user:profiles!inner(
              avatar:user_avatar!inner(
                avatar_name,
                primary_color,
                secondary_color,
                species:avatar_species(name)
              )
            )
          ),
          theme:quote_themes!inner(theme)
        `)
        .order('announced_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setWinners(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch Hall of Fame');
    } finally {
      setLoading(false);
    }
  };

  return {
    winners,
    loading,
    error,
    refreshWinners: fetchWinners,
  };
}