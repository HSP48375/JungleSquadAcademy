import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as Expo from 'npm:expo-server-sdk@3.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  channelId?: string;
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
      title, 
      body, 
      data = {}, 
      badge = 1,
      channelId = 'default'
    }: NotificationPayload = await req.json();

    if (!userId || !title || !body) {
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

    // Get user's push token and notification preferences
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select(`
        id,
        push_token,
        notification_preferences:notification_preferences(
          push_enabled,
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

    // Check if push notifications are enabled
    const preferences = userData.notification_preferences?.[0] || { push_enabled: true };
    if (!preferences.push_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'Push notifications disabled for this user' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if this specific notification type is enabled
    const notificationType = data.type || 'general';
    if (
      (notificationType === 'quote_update' && !preferences.quote_updates) ||
      (notificationType === 'streak_reminder' && !preferences.streak_reminders) ||
      (notificationType === 'achievement' && !preferences.achievement_alerts) ||
      (notificationType === 'weekly_summary' && !preferences.weekly_summary)
    ) {
      return new Response(
        JSON.stringify({ success: false, message: `${notificationType} notifications disabled for this user` }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if user has a push token
    if (!userData.push_token) {
      return new Response(
        JSON.stringify({ success: false, message: 'User has no push token registered' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create Expo SDK client
    const expo = new Expo.Expo();

    // Create the message
    const message = {
      to: userData.push_token,
      sound: 'default',
      title,
      body,
      data,
      badge,
      channelId,
    };

    // Validate that the push token is valid
    if (!Expo.Expo.isExpoPushToken(message.to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Expo push token' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
      }
    }

    // Store the notification in the database
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        title,
        message: body,
        data,
        expires_at: data.expires_at || null
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error storing notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tickets,
        notification: notificationData || null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    
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