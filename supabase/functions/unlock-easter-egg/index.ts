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
    const { achievementId } = await req.json();

    if (!achievementId) {
      return new Response(
        JSON.stringify({ error: 'Achievement ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if achievement exists
    const { data: achievement, error: achievementError } = await supabase
      .from('easter_egg_achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (achievementError) {
      return new Response(
        JSON.stringify({ error: 'Achievement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already unlocked
    const { data: existingUnlock, error: unlockError } = await supabase
      .from('user_easter_eggs')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (!unlockError && existingUnlock) {
      return new Response(
        JSON.stringify({ success: false, message: 'Achievement already unlocked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unlock the achievement
    const { error: insertError } = await supabase
      .from('user_easter_eggs')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        reward_claimed: false
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to unlock achievement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process reward based on type
    let rewardProcessed = false;
    
    if (achievement.reward_type === 'avatar_item') {
      // Logic for avatar item reward would go here
      rewardProcessed = true;
    } else if (achievement.reward_type === 'badge') {
      // Logic for badge reward would go here
      rewardProcessed = true;
    } else if (achievement.reward_type === 'color') {
      // Logic for color reward would go here
      rewardProcessed = true;
    }

    // Award XP for unlocking achievement
    await supabase.rpc('add_user_xp', {
      p_user_id: userId,
      p_amount: 25,
      p_source: 'achievement_unlocked'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Achievement unlocked successfully',
        achievement: achievement,
        rewardProcessed: rewardProcessed
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