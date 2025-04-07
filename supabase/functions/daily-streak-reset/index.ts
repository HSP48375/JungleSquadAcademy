import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// This function runs daily to reset XP and update streaks
Deno.serve(async (req) => {
  try {
    // Verify the request is authorized (in production, you'd use a secret key)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== Deno.env.get('CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset daily XP
    await supabase.rpc('reset_daily_xp');
    
    // Update streaks
    await supabase.rpc('update_streak');

    return new Response(
      JSON.stringify({ success: true, message: 'Daily XP reset and streaks updated' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in daily streak reset:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});