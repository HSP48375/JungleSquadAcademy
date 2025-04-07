import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchSubscription();
      subscribeToChanges();
    }
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_tiers (*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribe = async (tierId: string) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tierId,
            userId,
          }),
        }
      );

      const { sessionId, error: checkoutError } = await response.json();
      if (checkoutError) throw new Error(checkoutError);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (redirectError) throw redirectError;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
            userId,
          }),
        }
      );

      const { success, error: cancelError } = await response.json();
      if (cancelError) throw new Error(cancelError);

      await fetchSubscription();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (newTierId: string) => {
    try {
      setLoading(true);
      
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
            newTierId,
            userId,
          }),
        }
      );

      const { success, error: updateError } = await response.json();
      if (updateError) throw new Error(updateError);

      await fetchSubscription();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return {
    subscription,
    loading,
    error,
    subscribe,
    cancelSubscription,
    updateSubscription,
  };
}