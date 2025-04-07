import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TestResults {
  subscription: any;
  accessTests: {
    singleTutor: boolean;
    fiveTutors: boolean;
    unlimitedTutors: boolean;
    dailyChallenge: boolean;
  };
}

export function useSubscriptionTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);

  const testSubscription = async (userId: string, tierId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/test-stripe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tierId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const testResults = await response.json();
      setResults(testResults);

      return testResults;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to test subscription');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    testSubscription,
    loading,
    error,
    results,
  };
}