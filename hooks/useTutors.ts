import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Tutor = Database['public']['Tables']['tutors']['Row'];

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTutors();
  }, []);

  async function fetchTutors() {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('name');

      if (error) throw error;

      setTutors(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return { tutors, loading, error };
}