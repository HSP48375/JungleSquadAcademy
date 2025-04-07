import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
});

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { userId, tierId } = await req.json();

    // Get subscription tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('stripe_price_id', tierId)
      .single();

    if (tierError) throw tierError;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Create test customer
    const customer = await stripe.customers.create({
      email: profile.email,
      source: 'tok_visa', // Test card token
    });

    // Create test subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: tier.stripe_price_id }],
      metadata: {
        userId,
        tierId: tier.id,
      },
    });

    // Simulate webhook event
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: subscription.id,
          customer: customer.id,
          metadata: {
            userId,
            tierId: tier.id,
          },
        },
      },
    };

    // Call webhook endpoint
    const webhookResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature',
        },
        body: JSON.stringify(event),
      }
    );

    if (!webhookResponse.ok) {
      throw new Error('Webhook processing failed');
    }

    // Verify subscription in database
    const { data: userSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError) throw subError;

    // Test access control
    const testResults = {
      subscription: userSub,
      accessTests: {
        singleTutor: false,
        fiveTutors: false,
        unlimitedTutors: false,
        dailyChallenge: false,
      },
    };

    // Test tutor access based on tier
    const { data: tutors } = await supabase
      .from('tutors')
      .select('id')
      .limit(10);

    if (tutors) {
      const testTutor = tutors[0].id;

      // Test single tutor access
      const { data: singleAccess } = await supabase
        .rpc('check_subscription_access', {
          p_user_id: userId,
          p_tutor_id: testTutor,
        });
      testResults.accessTests.singleTutor = singleAccess;

      // Test five tutor access
      if (tier.tutor_limit === 5) {
        const promises = tutors.slice(0, 5).map(t => 
          supabase.rpc('check_subscription_access', {
            p_user_id: userId,
            p_tutor_id: t.id,
          })
        );
        const results = await Promise.all(promises);
        testResults.accessTests.fiveTutors = results.every(r => r.data);
      }

      // Test unlimited access
      if (tier.tutor_limit === -1) {
        const promises = tutors.map(t => 
          supabase.rpc('check_subscription_access', {
            p_user_id: userId,
            p_tutor_id: t.id,
          })
        );
        const results = await Promise.all(promises);
        testResults.accessTests.unlimitedTutors = results.every(r => r.data);
      }

      // Test daily challenge access
      const { data: challenge } = await supabase
        .from('daily_challenges')
        .select('tutor_id')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (challenge) {
        const { data: challengeAccess } = await supabase
          .rpc('check_subscription_access', {
            p_user_id: userId,
            p_tutor_id: challenge.tutor_id,
          });
        testResults.accessTests.dailyChallenge = challengeAccess;
      }
    }

    return new Response(
      JSON.stringify(testResults),
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
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});