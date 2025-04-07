import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { SmtpClient } from 'npm:@orama/smtp-client@1.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailPayload {
  userId: string;
  templateName: string;
  variables?: Record<string, any>;
  to?: string;
}

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
    if (token !== Deno.env.get('ADMIN_SECRET') && token !== Deno.env.get('CRON_SECRET')) {
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

    const { 
      userId, 
      templateName, 
      variables = {},
      to
    }: EmailPayload = await req.json();

    if (!userId || !templateName) {
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

    // Get user's email and notification preferences
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select(`
        id,
        email:auth.users!id(email),
        full_name,
        notification_preferences:notification_preferences(
          email_enabled,
          quote_updates,
          streak_reminders,
          achievement_alerts,
          weekly_summary
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if email notifications are enabled
    const preferences = userData.notification_preferences?.[0] || { email_enabled: true };
    if (!preferences.email_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email notifications disabled for this user' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if this specific notification type is enabled
    const notificationType = templateName.includes('quote') ? 'quote_updates' :
                            templateName.includes('streak') ? 'streak_reminders' :
                            templateName.includes('achievement') ? 'achievement_alerts' :
                            templateName.includes('weekly') ? 'weekly_summary' : 'general';
                            
    if (
      (notificationType === 'quote_updates' && !preferences.quote_updates) ||
      (notificationType === 'streak_reminders' && !preferences.streak_reminders) ||
      (notificationType === 'achievement_alerts' && !preferences.achievement_alerts) ||
      (notificationType === 'weekly_summary' && !preferences.weekly_summary)
    ) {
      return new Response(
        JSON.stringify({ success: false, message: `${notificationType} emails disabled for this user` }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError) {
      return new Response(
        JSON.stringify({ error: 'Email template not found' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get user's email
    const userEmail = to || userData.email?.[0]?.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User has no email address' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Prepare email content with variables
    let htmlContent = template.html_content;
    let textContent = template.text_content;
    let subject = template.subject;

    // Replace variables in the template
    const allVariables = {
      ...variables,
      name: userData.full_name || 'Jungle Explorer'
    };

    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, String(value));
      textContent = textContent.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    // Configure SMTP client
    const smtp = new SmtpClient({
      host: Deno.env.get('SMTP_HOST') || 'smtp.example.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || 'username',
      password: Deno.env.get('SMTP_PASSWORD') || 'password',
      tls: true,
    });

    // Send email
    const result = await smtp.send({
      from: Deno.env.get('EMAIL_FROM') || 'noreply@junglesquad.com',
      to: userEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    // Log email sent
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        template_name: templateName,
        recipient_email: userEmail,
        subject,
        status: 'sent',
        variables: allVariables
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        result
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in send-email-alert function:', error);
    
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