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
    const { tierId, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    // If no customer ID exists, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Get the price ID for the selected tier
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('stripe_price_id')
      .eq('stripe_price_id', tierId)
      .single();

    if (tierError) {
      console.error('Error fetching tier:', tierError.message);
      throw new Error('Invalid subscription tier');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: tierData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('PUBLIC_URL') || 'http://localhost:8081'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('PUBLIC_URL') || 'http://localhost:8081'}/subscription/cancel`,
      metadata: {
        userId,
        tierId,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error.message);
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