import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateIssueRequest {
  title?: string;
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

    const { title }: CreateIssueRequest = await req.json();

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

    // Check if user has a connected partner
    if (!currentUser.connected_user_id) {
      return new Response(JSON.stringify({ error: 'No connected partner found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing active issue
    const { data: existingIssue } = await supabaseClient
      .from('issues')
      .select('*')
      .or(`and(partner_a_id.eq.${currentUser.id},partner_b_id.eq.${currentUser.connected_user_id}),and(partner_a_id.eq.${currentUser.connected_user_id},partner_b_id.eq.${currentUser.id})`)
      .in('status', ['in_progress', 'proposal_sent'])
      .single();

    if (existingIssue) {
      return new Response(JSON.stringify({ error: 'Please resolve existing issue first' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create new issue
    const { data: newIssue, error: createError } = await supabaseClient
      .from('issues')
      .insert({
        partner_a_id: currentUser.id,
        partner_b_id: currentUser.connected_user_id,
        summary: title || 'New Issue',
        status: 'in_progress'
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to create issue' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notification to partner
    await supabaseClient.from('notifications').insert({
      user_id: currentUser.connected_user_id,
      type: 'new_issue',
      payload: { 
        issue_id: newIssue.id,
        message: `${currentUser.name || currentUser.email} started a new issue: ${title || 'New Issue'}`
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      issue: newIssue 
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