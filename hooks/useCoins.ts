import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type UserCoins = Database['public']['Tables']['user_coins']['Row'];
type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row'];

export function useCoins(userId: string) {
  const [coins, setCoins] = useState<UserCoins | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchCoins();
      fetchTransactions();
    }
  }, [userId]);

  const fetchCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setCoins(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch coins');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch transactions');
    }
  };

  const earnFreeCoins = async () => {
    try {
      const { data, error } = await supabase
        .rpc('earn_free_coin', { p_user_id: userId });

      if (error) throw error;
      await fetchCoins();
      await fetchTransactions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to earn free coin');
    }
  };

  const purchaseCoins = async (amount: number, priceUsd: number) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/purchase-coins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          priceUsd,
        }),
      });

      if (!response.ok) throw new Error('Failed to purchase coins');

      const { sessionId } = await response.json();
      return sessionId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to purchase coins');
      return null;
    }
  };

  const spendCoins = async (amount: number, description: string) => {
    try {
      if (!coins || coins.balance < amount) {
        throw new Error('Insufficient coins');
      }

      const { error } = await supabase.rpc('handle_coin_transaction', {
        p_user_id: userId,
        p_amount: amount,
        p_type: 'spend',
        p_description: description,
      });

      if (error) throw error;
      await fetchCoins();
      await fetchTransactions();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to spend coins');
      return false;
    }
  };

  return {
    coins,
    transactions,
    loading,
    error,
    earnFreeCoins,
    purchaseCoins,
    spendCoins,
  };
}