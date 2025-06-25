import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendNotificationRequest {
  userId: string;
  type: 'new_issue' | 'proposal_ready' | 'issue_resolved';
  payload: Record<string, any>;
}

interface FCMMessage {
  to: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
}

async function sendFCMNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.warn('FCM Server Key not configured');
    return false;
  }

  const message: FCMMessage = {
    to: fcmToken,
    notification: {
      title,
      body
    },
    data
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return response.ok && result.success === 1;
  } catch (error) {
    console.error('FCM send failed:', error);
    return false;
  }
}

function getNotificationContent(type: string, payload: Record<string, any>) {
  switch (type) {
    case 'new_issue':
      return {
        title: 'New Issue Started',
        body: payload.message || 'Your co-parent has started a new issue discussion.'
      };
    case 'proposal_ready':
      return {
        title: 'Solution Proposal Ready',
        body: payload.message || 'A new solution proposal is ready for your review.'
      };
    case 'issue_resolved':
      return {
        title: 'Issue Resolved!',
        body: payload.message || 'An issue has been successfully resolved.'
      };
    default:
      return {
        title: 'SafeTalk Notification',
        body: payload.message || 'You have a new notification.'
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, type, payload }: SendNotificationRequest = await req.json();

    // Get user's FCM token
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('fcm_token, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store notification in database
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        payload,
        is_read: false
      })
      .select()
      .single();

    if (notificationError) {
      return new Response(JSON.stringify({ error: 'Failed to store notification' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send push notification if FCM token exists
    let pushSent = false;
    if (user.fcm_token) {
      const { title, body } = getNotificationContent(type, payload);
      pushSent = await sendFCMNotification(
        user.fcm_token, 
        title, 
        body, 
        {
          notification_id: notification.id,
          type,
          ...Object.fromEntries(
            Object.entries(payload).map(([k, v]) => [k, String(v)])
          )
        }
      );
    }

    return new Response(JSON.stringify({ 
      success: true,
      notification,
      pushSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});