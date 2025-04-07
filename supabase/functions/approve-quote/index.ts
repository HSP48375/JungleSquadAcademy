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

    const { quoteId, featured = false } = await req.json();

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'Quote ID is required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quote_submissions')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error('Quote not found');

    // Update quote status
    const { error: updateError } = await supabase
      .from('quote_submissions')
      .update({
        approved: true,
        featured_at: featured ? new Date().toISOString() : null,
      })
      .eq('id', quoteId);

    if (updateError) throw updateError;

    // Award coins to the user
    const coinAmount = featured ? 50 : 10;
    
    await supabase.rpc('handle_coin_transaction', {
      p_user_id: quote.user_id,
      p_amount: coinAmount,
      p_type: 'reward',
      p_description: featured ? 'Featured quote reward' : 'Approved quote reward',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Quote ${featured ? 'featured' : 'approved'} successfully`,
        reward: coinAmount
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in quote approval:', error);
    
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