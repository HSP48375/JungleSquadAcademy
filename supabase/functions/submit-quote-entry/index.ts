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
    const { quoteText } = await req.json();

    if (!quoteText || quoteText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Quote text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (quoteText.length > 180) {
      return new Response(
        JSON.stringify({ error: 'Quote must be 180 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active theme
    const { data: themeId, error: themeError } = await supabase.rpc('get_active_quote_theme');
    
    if (themeError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get active theme' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!themeId) {
      return new Response(
        JSON.stringify({ error: 'No active quote theme found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already submitted for this theme
    const { data: existingEntry, error: checkError } = await supabase
      .from('quote_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('theme_id', themeId)
      .single();

    if (!checkError && existingEntry) {
      return new Response(
        JSON.stringify({ error: 'You have already submitted a quote for this week\'s theme' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Submit quote
    const { data: entry, error: submitError } = await supabase
      .from('quote_entries')
      .insert({
        user_id: userId,
        theme_id: themeId,
        quote_text: quoteText.trim()
      })
      .select()
      .single();

    if (submitError) {
      return new Response(
        JSON.stringify({ error: 'Failed to submit quote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award XP for submission
    await supabase.rpc('add_user_xp', {
      p_user_id: userId,
      p_amount: 15,
      p_source: 'quote_competition_submission'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Quote submitted successfully',
        entry
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