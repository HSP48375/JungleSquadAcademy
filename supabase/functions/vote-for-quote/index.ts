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
    const { entryId } = await req.json();

    if (!entryId) {
      return new Response(
        JSON.stringify({ error: 'Entry ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get entry details
    const { data: entry, error: entryError } = await supabase
      .from('quote_entries')
      .select('theme_id, user_id')
      .eq('id', entryId)
      .single();

    if (entryError) {
      return new Response(
        JSON.stringify({ error: 'Quote entry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent voting for own entry
    if (entry.user_id === userId) {
      return new Response(
        JSON.stringify({ error: 'You cannot vote for your own quote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already voted for this entry
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('quote_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_id', entryId)
      .single();

    if (!voteCheckError && existingVote) {
      return new Response(
        JSON.stringify({ error: 'You have already voted for this quote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already voted today for this theme
    const { data: hasVoted, error: checkError } = await supabase.rpc(
      'has_voted_today',
      {
        p_user_id: userId,
        p_theme_id: entry.theme_id
      }
    );

    if (checkError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check voting status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (hasVoted) {
      return new Response(
        JSON.stringify({ error: 'You have already voted today' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Submit vote
    const { data: vote, error: voteError } = await supabase
      .from('quote_votes')
      .insert({
        user_id: userId,
        entry_id: entryId
      })
      .select()
      .single();

    if (voteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to submit vote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award XP for voting
    await supabase.rpc('add_user_xp', {
      p_user_id: userId,
      p_amount: 5,
      p_source: 'quote_competition_vote'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vote submitted successfully',
        vote
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