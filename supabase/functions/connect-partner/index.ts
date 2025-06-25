import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ConnectPartnerRequest {
  partnerCode: string;
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { partnerCode }: ConnectPartnerRequest = await req.json();

    // Get current user's profile
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already connected
    if (currentUser.connected_user_id) {
      return new Response(JSON.stringify({ error: 'Already connected to a partner' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find partner by code
    const { data: partner, error: partnerError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('partner_code', partnerCode)
      .single();

    if (partnerError || !partner) {
      return new Response(JSON.stringify({ error: 'Invalid partner code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if partner is already connected
    if (partner.connected_user_id) {
      return new Response(JSON.stringify({ error: 'Partner is already connected to someone else' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect both users
    const { error: updateError1 } = await supabaseClient
      .from('users')
      .update({ connected_user_id: partner.id })
      .eq('id', currentUser.id);

    const { error: updateError2 } = await supabaseClient
      .from('users')
      .update({ connected_user_id: currentUser.id })
      .eq('id', partner.id);

    if (updateError1 || updateError2) {
      return new Response(JSON.stringify({ error: 'Failed to connect partners' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notifications to both users
    await supabaseClient.from('notifications').insert([
      {
        user_id: currentUser.id,
        type: 'new_issue',
        payload: { message: `Connected with ${partner.name || partner.email}` }
      },
      {
        user_id: partner.id,
        type: 'new_issue',
        payload: { message: `Connected with ${currentUser.name || currentUser.email}` }
      }
    ]);

    return new Response(JSON.stringify({ 
      success: true, 
      partner: { 
        id: partner.id, 
        name: partner.name, 
        email: partner.email 
      } 
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