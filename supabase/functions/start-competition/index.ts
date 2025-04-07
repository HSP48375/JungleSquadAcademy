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
    if (token !== Deno.env.get('ADMIN_SECRET')) {
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

    const { title, description, subject, durationDays, rewardType, participationThreshold, participationReward } = await req.json();

    // Validate required fields
    if (!title || !description || !subject || !durationDays) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationDays));

    // Create the competition
    const { data: competition, error: competitionError } = await supabase
      .from('weekly_competitions')
      .insert({
        title,
        description,
        subject,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reward_type: rewardType || 'coins',
        participation_threshold: participationThreshold || 3,
        participation_reward: participationReward || 25
      })
      .select()
      .single();

    if (competitionError) throw competitionError;

    // Create default rewards for top 3 positions
    const rewardsToInsert = [
      { competition_id: competition.id, rank: 1, reward_type: 'coins', reward_amount: 100 },
      { competition_id: competition.id, rank: 2, reward_type: 'coins', reward_amount: 50 },
      { competition_id: competition.id, rank: 3, reward_type: 'coins', reward_amount: 25 }
    ];

    const { error: rewardsError } = await supabase
      .from('competition_rewards')
      .insert(rewardsToInsert);

    if (rewardsError) throw rewardsError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Competition started successfully',
        competition
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error starting competition:', error);
    
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