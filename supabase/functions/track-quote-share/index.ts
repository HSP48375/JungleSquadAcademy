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
    const { quoteId, platform } = await req.json();

    if (!quoteId || !platform) {
      return new Response(
        JSON.stringify({ error: 'Quote ID and platform are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a unique share (per platform per week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: existingShares, error: checkError } = await supabase
      .from('quote_shares')
      .select('id')
      .eq('user_id', userId)
      .eq('quote_id', quoteId)
      .eq('platform', platform)
      .gte('created_at', oneWeekAgo.toISOString());

    if (checkError) {
      console.error('Error checking existing shares:', checkError);
    }

    // Record the share
    const { error: shareError } = await supabase
      .from('quote_shares')
      .insert({
        user_id: userId,
        quote_id: quoteId,
        platform,
      });

    if (shareError) {
      return new Response(
        JSON.stringify({ error: 'Failed to record share' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award rewards if this is a unique share
    let rewardsAwarded = false;
    if (!existingShares || existingShares.length === 0) {
      // Award XP
      const { error: xpError } = await supabase.rpc('add_user_xp', {
        p_user_id: userId,
        p_amount: 10,
        p_source: 'quote_sharing'
      });

      if (xpError) {
        console.error('Error awarding XP:', xpError);
      }

      // Award coins
      const { error: coinError } = await supabase.rpc('handle_coin_transaction', {
        p_user_id: userId,
        p_amount: 5,
        p_type: 'reward',
        p_description: 'Quote sharing reward'
      });

      if (coinError) {
        console.error('Error awarding coins:', coinError);
      }

      rewardsAwarded = !xpError && !coinError;
    }

    // Update share count for the quote
    await supabase.rpc('increment_quote_shares', {
      p_quote_id: quoteId
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        rewardsAwarded,
        message: rewardsAwarded ? 'Share recorded and rewards awarded' : 'Share recorded'
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