import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0';

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
    const { userId, entryId, text } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Journal entry text is too short for summarization' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Generate summary with GPT
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI tutor assistant for Jungle Squad Academy, an educational platform. 
          Your task is to analyze a student's learning journal entry and provide a thoughtful, 
          encouraging summary of their progress. Focus on identifying:
          
          1. Key learning points they mentioned
          2. Challenges they faced and how they overcame them
          3. Growth opportunities for the coming week
          4. Positive reinforcement of their efforts
          
          Keep your response under 200 words, use a supportive, motivational tone, and include 
          specific details from their entry. Avoid generic platitudes. Your summary should feel 
          personalized and insightful.`
        },
        {
          role: "user",
          content: `Here is my learning journal entry for this week:\n\n${text}\n\nPlease provide a thoughtful summary of my progress.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const summary = completion.data.choices[0].message?.content?.trim();

    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If entryId is provided, update existing entry
    if (entryId) {
      // Update the entry with the AI summary
      await supabase.rpc('generate_journal_summary', {
        p_entry_id: entryId,
        p_summary: summary
      });
    } else {
      // Find the most recent entry for this user
      const { data: recentEntry, error: entryError } = await supabase
        .from('weekly_journals')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (entryError) {
        throw entryError;
      }

      // Update the entry with the AI summary
      await supabase.rpc('generate_journal_summary', {
        p_entry_id: recentEntry.id,
        p_summary: summary
      });
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating journal summary:', error);
    
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