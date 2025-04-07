import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    // Get user's referral code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no referral code exists, generate one
    if (!profile.referral_code) {
      const { data: updatedProfile, error: updateError } = await supabase.rpc('generate_referral_code');
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate referral code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      profile.referral_code = updatedProfile.referral_code;
    }

    // Get referral stats
    const { data: completedReferrals, error: completedError } = await supabase
      .from('referrals')
      .select('count')
      .eq('referrer_id', userId)
      .eq('status', 'completed')
      .single();
      
    const { data: pendingReferrals, error: pendingError } = await supabase
      .from('referrals')
      .select('count')
      .eq('referrer_id', userId)
      .eq('status', 'pending')
      .single();
    
    const completedCount = completedReferrals?.count || 0;
    const pendingCount = pendingReferrals?.count || 0;

    // Generate referral link
    const baseUrl = Deno.env.get('PUBLIC_URL') || 'https://academy.junglesquad.com';
    const referralLink = `${baseUrl}/join?ref=${profile.referral_code}`;

    // Get tier information
    let tier = 'Bronze';
    let tierBonus = 0;
    let tierColor = '#CD7F32';
    let tierClaimed = false;
    
    if (completedCount >= 25) {
      tier = 'Diamond';
      tierBonus = 100;
      tierColor = '#00FFFF';
    } else if (completedCount >= 10) {
      tier = 'Gold';
      tierBonus = 50;
      tierColor = '#FFD700';
    } else if (completedCount >= 5) {
      tier = 'Silver';
      tierBonus = 25;
      tierColor = '#C0C0C0';
    }
    
    // Check if tier has been claimed
    const { data: tierData, error: tierError } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('tier', tier);
      
    if (!tierError && tierData && tierData.length > 0) {
      tierClaimed = true;
    }

    return new Response(
      JSON.stringify({ 
        referralCode: profile.referral_code,
        referralLink: referralLink,
        stats: {
          completed: completedCount,
          pending: pendingCount
        },
        tier: {
          name: tier,
          bonus: tierBonus,
          color: tierColor,
          claimed: tierClaimed
        }
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