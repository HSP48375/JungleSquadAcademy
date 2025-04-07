import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, newTierId, userId } = await req.json();

    if (!subscriptionId || !newTierId || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user owns this subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found or not owned by user');
    }

    // Update the subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
          price_data: {
            currency: 'usd',
            product: newTierId,
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      metadata: {
        userId,
        tierId: newTierId,
      },
    });

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('stripe_price_id', newTierId)
      .single();

    if (tierError) throw tierError;

    // Update subscription in database
    await supabase
      .from('user_subscriptions')
      .update({
        tier_id: tier.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});