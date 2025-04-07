import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useQuoteSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitQuote = async (userId: string, quoteText: string) => {
    if (!quoteText.trim() || quoteText.length > 200 || quoteText.length < 10) {
      setError('Quote must be between 10 and 200 characters');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Check if user has submitted a quote in the last 7 days
      const { data: existingQuotes, error: checkError } = await supabase
        .from('quote_submissions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (checkError) throw checkError;

      if (existingQuotes && existingQuotes.length > 0) {
        setError('You can only submit one quote per week');
        return false;
      }

      // Submit the quote
      const { error: submitError } = await supabase
        .from('quote_submissions')
        .insert({
          user_id: userId,
          quote_text: quoteText.trim(),
        });

      if (submitError) throw submitError;

      setSuccess(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit quote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserQuotes = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('quote_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch quotes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    submitQuote,
    fetchUserQuotes,
    loading,
    error,
    success,
  };
}