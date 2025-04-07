import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            username: email.split('@')[0],
          },
        ]);
        
        // Initialize user coins
        await supabase.from('user_coins').insert([
          {
            user_id: data.user.id,
            balance: 5,
          },
        ]);
      }

      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during sign up');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace('/(app)');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email or password');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace('/(auth)/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset password email');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}