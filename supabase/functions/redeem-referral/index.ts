import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;
    const { referralCode } = await req.json();

    if (!referralCode) {
      return new Response(
        JSON.stringify({ error: 'Referral code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a referrer
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userProfile.referred_by) {
      return new Response(
        JSON.stringify({ error: 'User already has a referrer', alreadyReferred: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-referral
    if (referrer.id === userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot refer yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the referral
    const { data: result, error: processError } = await supabase.rpc(
      'process_referral',
      {
        p_referrer_id: referrer.id,
        p_referred_id: userId
      }
    );

    if (processError) {
      return new Response(
        JSON.stringify({ error: 'Failed to process referral' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if referrer has reached a new tier
    const { data: referralsCount, error: countError } = await supabase
      .from('referrals')
      .select('count')
      .eq('referrer_id', referrer.id)
      .eq('status', 'completed')
      .single();
      
    if (!countError && referralsCount) {
      const count = referralsCount.count;
      let newTier = null;
      
      if (count === 5) {
        newTier = 'Silver';
      } else if (count === 10) {
        newTier = 'Gold';
      } else if (count === 25) {
        newTier = 'Diamond';
      }
      
      if (newTier) {
        // Check if tier already claimed
        const { data: existingTier } = await supabase
          .from('referral_rewards')
          .select('id')
          .eq('user_id', referrer.id)
          .eq('tier', newTier)
          .single();
          
        if (!existingTier) {
          // Send notification (in a real app, this would trigger a push notification)
          console.log(`User ${referrer.id} has reached ${newTier} tier!`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Referral processed successfully',
        reward: 5 // Default reward amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});