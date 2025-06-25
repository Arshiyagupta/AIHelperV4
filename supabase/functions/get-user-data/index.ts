import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

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

    // Get current user's profile with connected partner
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select(`
        *,
        connected_partner:users!users_connected_user_id_fkey(id, name, email)
      `)
      .eq('auth_id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current active issue
    let currentIssue = null;
    if (currentUser.connected_user_id) {
      const { data: issue } = await supabaseClient
        .from('issues')
        .select('*')
        .or(`and(partner_a_id.eq.${currentUser.id},partner_b_id.eq.${currentUser.connected_user_id}),and(partner_a_id.eq.${currentUser.connected_user_id},partner_b_id.eq.${currentUser.id})`)
        .in('status', ['in_progress', 'proposal_sent'])
        .single();

      currentIssue = issue;
    }

    // Get recent messages for current issue
    let recentMessages = [];
    if (currentIssue) {
      const { data: messages } = await supabaseClient
        .from('messages')
        .select(`
          *,
          sender:users(name, email)
        `)
        .eq('issue_id', currentIssue.id)
        .order('created_at', { ascending: false })
        .limit(10);

      recentMessages = messages || [];
    }

    // Get current proposal if exists
    let currentProposal = null;
    if (currentIssue && currentIssue.status === 'proposal_sent') {
      const { data: proposal } = await supabaseClient
        .from('mediator_logs')
        .select('*')
        .eq('issue_id', currentIssue.id)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      currentProposal = proposal;
    }

    // Get unread notifications
    const { data: unreadNotifications } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get resolved issues history
    const { data: resolvedIssues } = await supabaseClient
      .from('issues')
      .select('*')
      .or(`and(partner_a_id.eq.${currentUser.id},partner_b_id.eq.${currentUser.connected_user_id}),and(partner_a_id.eq.${currentUser.connected_user_id},partner_b_id.eq.${currentUser.id})`)
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({ 
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        partner_code: currentUser.partner_code,
        connected_partner: currentUser.connected_partner
      },
      currentIssue,
      currentProposal,
      recentMessages,
      unreadNotifications: unreadNotifications || [],
      resolvedIssues: resolvedIssues || []
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