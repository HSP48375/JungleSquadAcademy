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

    // Get theme ID from request or use active theme
    const { themeId: requestThemeId } = await req.json().catch(() => ({}));
    
    let themeId = requestThemeId;
    
    // If no theme ID provided, get the active theme that's ending
    if (!themeId) {
      const { data: theme, error: themeError } = await supabase
        .from('quote_themes')
        .select('id')
        .eq('is_active', true)
        .lte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .single();
        
      if (themeError) {
        return new Response(
          JSON.stringify({ error: 'No eligible theme found for winner announcement' }),
          { 
            status: 404, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      themeId = theme.id;
    }
    
    // Select the winner
    const { data: winnerId, error: winnerError } = await supabase.rpc(
      'select_quote_winner',
      { p_theme_id: themeId }
    );
    
    if (winnerError) {
      return new Response(
        JSON.stringify({ error: 'Failed to select winner' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!winnerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No winner selected. This could be because there were no entries, no votes, or a winner was already announced.'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Get winner details
    const { data: winner, error: detailsError } = await supabase
      .from('quote_winners')
      .select(`
        id,
        entry:quote_entries!inner(
          quote_text,
          user:profiles!inner(
            avatar:user_avatar!inner(
              avatar_name,
              species:avatar_species(name)
            )
          )
        ),
        theme:quote_themes!inner(theme),
        votes_count,
        coins_awarded,
        xp_awarded
      `)
      .eq('id', winnerId)
      .single();
      
    if (detailsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get winner details' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Deactivate current theme
    await supabase
      .from('quote_themes')
      .update({ is_active: false })
      .eq('id', themeId);
      
    // Activate next theme
    await supabase
      .from('quote_themes')
      .update({ is_active: true })
      .eq('start_date', (
        await supabase
          .from('quote_themes')
          .select('start_date')
          .eq('id', themeId)
          .single()
      ).data.end_date);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Winner announced successfully',
        winner: {
          id: winner.id,
          quote: winner.entry.quote_text,
          authorName: winner.entry.user.avatar.avatar_name,
          authorSpecies: winner.entry.user.avatar.species.name,
          theme: winner.theme.theme,
          votes: winner.votes_count,
          coinsAwarded: winner.coins_awarded,
          xpAwarded: winner.xp_awarded
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error announcing winner:', error);
    
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