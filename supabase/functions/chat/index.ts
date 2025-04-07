import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  tutorId: string;
  message: string;
  sessionId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { tutorId, message, sessionId }: ChatRequest = await req.json();

    // Fetch tutor details including persona prompt
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', tutorId)
      .single();

    if (tutorError) throw tutorError;

    // Prepare the chat completion request
    const messages = [
      {
        role: 'system',
        content: tutor.persona_prompt,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // Call GPT-4-turbo API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const completion = await response.json();
    const aiResponse = completion.choices[0].message.content;

    // Store the message in the database
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: sessionId,
          content: message,
          is_tutor: false,
        },
        {
          session_id: sessionId,
          content: aiResponse,
          is_tutor: true,
        },
      ]);

    if (messageError) throw messageError;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});