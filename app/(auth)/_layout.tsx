import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();
  
  useEffect(() => {
    if (session?.user) {
      // Check if user has completed onboarding
      checkOnboardingStatus(session.user.id);
    }
  }, [session]);
  
  const checkOnboardingStatus = async (userId: string) => {
    try {
      // Check if user has an avatar (which indicates onboarding completion)
      const { data, error } = await supabase
        .from('user_avatar')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        return;
      }
      
      // If no avatar, redirect to onboarding
      if (!data) {
        router.replace('/onboarding/welcome');
        return;
      }
      
      // Otherwise, proceed to main app
      router.replace('/(app)');
    } catch (e) {
      console.error('Error checking onboarding status:', e);
    }
  };
  
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0A0A0A' }
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}