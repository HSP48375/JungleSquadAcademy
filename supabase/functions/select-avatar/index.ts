import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify the request is authorized
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== Deno.env.get('CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate week boundaries
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7); // End of week (next Sunday)

    // Select winner based on XP and streak
    const { data: topUsers, error: usersError } = await supabase.rpc('get_top_performers', {
      days_back: 7,
      limit_count: 1
    });

    if (usersError) throw usersError;
    if (!topUsers || topUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No eligible users found' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const winner = topUsers[0];

    // Create or update avatar of week
    const { error: upsertError } = await supabase
      .from('avatar_of_week')
      .upsert({
        user_id: winner.user_id,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        selection_criteria: {
          criteria: 'highest_weekly_xp',
          timestamp: new Date().toISOString()
        },
        stats: {
          weekly_xp: winner.weekly_xp,
          active_days: winner.active_days,
          tutors_engaged: winner.tutors_engaged
        }
      });

    if (upsertError) throw upsertError;

    // Award coins to the winner
    await supabase.rpc('handle_coin_transaction', {
      p_user_id: winner.user_id,
      p_amount: 25,
      p_type: 'reward',
      p_description: 'Avatar of the Week reward',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Avatar of the Week selected successfully',
        winner: winner.avatar_name
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in Avatar of the Week selection:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});