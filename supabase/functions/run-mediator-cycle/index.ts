import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MediatorCycleRequest {
  issueId: string;
}

// Mediator AI - Generates solution proposals
async function generateSolutionProposal(
  issueId: string,
  partnerAMessages: string[],
  partnerBMessages: string[],
  previousProposals: string[],
  attemptNumber: number
): Promise<{
  content: string;
  score: number;
  isCompromise: boolean;
}> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const isCompromiseMode = attemptNumber > 3;
  const previousProposalsText = previousProposals.length > 0 
    ? `\n\nPrevious proposals that were rejected:\n${previousProposals.join('\n---\n')}`
    : '';

  const prompt = `You are a Mediator AI specializing in co-parenting conflict resolution. Your role is to create practical, fair solutions based on "Good Strategy/Bad Strategy" principles.

PARTNER A CONCERNS:
${partnerAMessages.join('\n')}

PARTNER B CONCERNS:
${partnerBMessages.join('\n')}

${previousProposalsText}

${isCompromiseMode ? 
  'COMPROMISE MODE: Previous proposals were rejected. Focus on finding middle ground that both parties can accept, even if not ideal.' :
  'SOLUTION MODE: Create an optimal solution that addresses both parties\' core needs.'
}

Create a solution that:
1. Addresses both parties' core concerns
2. Is specific and actionable
3. Includes clear steps/protocols
4. Considers children's best interests
5. Is fair to both parties

Respond in JSON format:
{
  "content": "detailed solution proposal with specific steps",
  "score": 0.0-1.0 (readiness score - only propose if ≥0.8),
  "reasoning": "why this solution works for both parties"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: isCompromiseMode ? 0.7 : 0.3,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      content: result.content || 'Unable to generate solution at this time.',
      score: result.score || 0.5,
      isCompromise: isCompromiseMode
    };
  } catch (error) {
    console.error('Mediator AI processing failed:', error);
    return {
      content: 'I need more information to create a solution. Please continue sharing your concerns.',
      score: 0.3,
      isCompromise: false
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

    const { issueId }: MediatorCycleRequest = await req.json();

    // Get issue details
    const { data: issue, error: issueError } = await supabaseClient
      .from('issues')
      .select(`
        *,
        partner_a:users!issues_partner_a_id_fkey(id, name, email),
        partner_b:users!issues_partner_b_id_fkey(id, name, email)
      `)
      .eq('id', issueId)
      .single();

    if (issueError || !issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get messages from both partners
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('issue_id', issueId)
      .eq('sender_type', 'user')
      .order('created_at', { ascending: true });

    if (messagesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Separate messages by partner
    const partnerAMessages = messages
      .filter(m => m.sender_id === issue.partner_a_id)
      .map(m => m.content);
    
    const partnerBMessages = messages
      .filter(m => m.sender_id === issue.partner_b_id)
      .map(m => m.content);

    // Get previous proposals
    const { data: previousProposals, error: proposalsError } = await supabaseClient
      .from('mediator_logs')
      .select('content, version')
      .eq('issue_id', issueId)
      .order('version', { ascending: true });

    if (proposalsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch previous proposals' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const previousProposalContents = previousProposals?.map(p => p.content) || [];
    const nextVersion = (previousProposals?.length || 0) + 1;

    // Check if we've exceeded max attempts
    if (nextVersion > 5) {
      return new Response(JSON.stringify({ 
        error: 'Maximum proposal attempts reached',
        maxAttemptsReached: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new solution proposal
    const proposal = await generateSolutionProposal(
      issueId,
      partnerAMessages,
      partnerBMessages,
      previousProposalContents,
      nextVersion
    );

    // Only create proposal if score is high enough
    if (proposal.score < 0.8 && !proposal.isCompromise) {
      return new Response(JSON.stringify({ 
        message: 'Solution not ready yet. More information needed.',
        score: proposal.score 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the proposal
    const { data: newProposal, error: storeError } = await supabaseClient
      .from('mediator_logs')
      .insert({
        issue_id: issueId,
        version: nextVersion,
        content: proposal.content,
        internal_score: proposal.score,
        accepted_by_a: false,
        accepted_by_b: false
      })
      .select()
      .single();

    if (storeError) {
      return new Response(JSON.stringify({ error: 'Failed to store proposal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update issue status
    await supabaseClient
      .from('issues')
      .update({ status: 'proposal_sent' })
      .eq('id', issueId);

    // Send notifications to both partners
    await supabaseClient.from('notifications').insert([
      {
        user_id: issue.partner_a_id,
        type: 'proposal_ready',
        payload: { 
          issue_id: issueId,
          proposal_id: newProposal.id,
          message: 'A new solution proposal is ready for your review'
        }
      },
      {
        user_id: issue.partner_b_id,
        type: 'proposal_ready',
        payload: { 
          issue_id: issueId,
          proposal_id: newProposal.id,
          message: 'A new solution proposal is ready for your review'
        }
      }
    ]);

    // Log AI event
    await supabaseClient.from('ai_events').insert({
      issue_id: issueId,
      agent: 'mediator_ai',
      input: `Partner A: ${partnerAMessages.join(' | ')} | Partner B: ${partnerBMessages.join(' | ')}`,
      output: proposal.content
    });

    return new Response(JSON.stringify({ 
      success: true,
      proposal: newProposal,
      isCompromise: proposal.isCompromise
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