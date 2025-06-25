import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubmitVoteRequest {
  proposalId: string;
  accept: boolean;
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

    const { proposalId, accept }: SubmitVoteRequest = await req.json();

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

    // Get proposal with issue details
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('mediator_logs')
      .select(`
        *,
        issue:issues(*)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return new Response(JSON.stringify({ error: 'Proposal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to this proposal
    const issue = proposal.issue;
    if (issue.partner_a_id !== currentUser.id && issue.partner_b_id !== currentUser.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which partner is voting
    const isPartnerA = issue.partner_a_id === currentUser.id;
    const updateField = isPartnerA ? 'accepted_by_a' : 'accepted_by_b';

    // Update the proposal with the vote
    const { data: updatedProposal, error: updateError } = await supabaseClient
      .from('mediator_logs')
      .update({ [updateField]: accept })
      .eq('id', proposalId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to record vote' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if both partners have voted
    const bothVoted = updatedProposal.accepted_by_a !== null && updatedProposal.accepted_by_b !== null;
    const bothAccepted = updatedProposal.accepted_by_a === true && updatedProposal.accepted_by_b === true;

    let issueStatus = issue.status;
    let notificationType: 'proposal_ready' | 'issue_resolved' = 'proposal_ready';
    let notificationMessage = '';

    if (bothVoted) {
      if (bothAccepted) {
        // Both accepted - resolve the issue
        issueStatus = 'resolved';
        notificationType = 'issue_resolved';
        notificationMessage = 'Issue has been successfully resolved!';

        await supabaseClient
          .from('issues')
          .update({ 
            status: 'resolved',
            resolved_at: new Date().toISOString()
          })
          .eq('id', issue.id);
      } else {
        // At least one rejected - back to in_progress for mediator to try again
        issueStatus = 'in_progress';
        notificationMessage = 'Proposal was not accepted. The mediator will create a new proposal.';

        await supabaseClient
          .from('issues')
          .update({ status: 'in_progress' })
          .eq('id', issue.id);

        // Trigger new mediator cycle if not at max attempts
        if (updatedProposal.version < 5) {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/run-mediator-cycle`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ issueId: issue.id })
          });
        }
      }

      // Send notification to the other partner
      const otherPartnerId = isPartnerA ? issue.partner_b_id : issue.partner_a_id;
      await supabaseClient.from('notifications').insert({
        user_id: otherPartnerId,
        type: notificationType,
        payload: { 
          issue_id: issue.id,
          proposal_id: proposalId,
          message: notificationMessage
        }
      });
    } else {
      // Only one partner has voted so far
      const otherPartnerId = isPartnerA ? issue.partner_b_id : issue.partner_a_id;
      const voterName = currentUser.name || currentUser.email;
      
      await supabaseClient.from('notifications').insert({
        user_id: otherPartnerId,
        type: 'proposal_ready',
        payload: { 
          issue_id: issue.id,
          proposal_id: proposalId,
          message: `${voterName} has ${accept ? 'accepted' : 'rejected'} the proposal. Your vote is needed.`
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      proposal: updatedProposal,
      issueStatus,
      bothVoted,
      bothAccepted: bothVoted ? bothAccepted : null
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