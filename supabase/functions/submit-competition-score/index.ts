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
    const { competitionId, xpPoints, challengeId } = await req.json();

    if (!competitionId) {
      return new Response(
        JSON.stringify({ error: 'Competition ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if competition exists and is active
    const { data: competition, error: competitionError } = await supabase
      .from('weekly_competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (competitionError) {
      return new Response(
        JSON.stringify({ error: 'Competition not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date() < new Date(competition.start_date) || new Date() > new Date(competition.end_date)) {
      return new Response(
        JSON.stringify({ error: 'Competition is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update participant's score
    const { data: participant, error: participantError } = await supabase
      .from('competition_participants')
      .upsert({
        competition_id: competitionId,
        user_id: userId,
        total_xp: xpPoints || 0,
        challenges_completed: challengeId ? 1 : 0,
        opted_in: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'competition_id,user_id',
        ignoreDuplicates: false
      })
      .select();

    if (participantError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update competition score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If a challenge was completed, update the challenge count
    if (challengeId) {
      const { error: updateError } = await supabase
        .from('competition_participants')
        .update({
          challenges_completed: supabase.rpc('increment', { x: 1 })
        })
        .eq('competition_id', competitionId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating challenge count:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Score submitted successfully',
        participant
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