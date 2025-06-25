import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendMessageRequest {
  issueId: string;
  content: string;
}

// Personal AI Agent - Processes user input and converts to I-statements
async function processWithPersonalAI(content: string, userName: string): Promise<{
  processedContent: string;
  isRedFlagged: boolean;
  mediatorSummary: string;
}> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a Personal AI Agent helping a divorced co-parent communicate more effectively. Your role is to:

1. FIRST: Check for red flags (abusive language, threats, harassment, extreme hostility)
2. If red flags detected, return immediately with isRedFlagged: true
3. If safe, process the message by:
   - Filtering emotional language
   - Converting to calm I-statements
   - Focusing on facts and solutions
   - Maintaining the core concern

User: ${userName}
Original message: "${content}"

Respond in JSON format:
{
  "isRedFlagged": boolean,
  "processedContent": "calm, factual I-statement version",
  "mediatorSummary": "key points for mediator (2-3 sentences max)"
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
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      processedContent: result.processedContent || content,
      isRedFlagged: result.isRedFlagged || false,
      mediatorSummary: result.mediatorSummary || content.substring(0, 100)
    };
  } catch (error) {
    console.error('Personal AI processing failed:', error);
    return {
      processedContent: content,
      isRedFlagged: false,
      mediatorSummary: content.substring(0, 100)
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { issueId, content }: SendMessageRequest = await req.json();

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

    // Verify user has access to this issue
    const { data: issue, error: issueError } = await supabaseClient
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .or(`partner_a_id.eq.${currentUser.id},partner_b_id.eq.${currentUser.id}`)
      .single();

    if (issueError || !issue) {
      return new Response(JSON.stringify({ error: 'Issue not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if issue is halted
    if (issue.status === 'halted') {
      return new Response(JSON.stringify({ error: 'Issue has been halted due to safety concerns' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process message with Personal AI
    const aiResult = await processWithPersonalAI(content, currentUser.name || currentUser.email);

    // If red flagged, halt the issue
    if (aiResult.isRedFlagged) {
      await supabaseClient
        .from('issues')
        .update({ 
          status: 'halted',
          red_flagged: true 
        })
        .eq('id', issueId);

      // Store the flagged message
      await supabaseClient.from('messages').insert({
        issue_id: issueId,
        sender_type: 'user',
        sender_id: currentUser.id,
        content: content,
        is_flagged: true
      });

      return new Response(JSON.stringify({ 
        error: 'Message contains inappropriate content. Issue has been halted for safety.',
        isRedFlagged: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store user message
    const { data: userMessage, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        issue_id: issueId,
        sender_type: 'user',
        sender_id: currentUser.id,
        content: aiResult.processedContent
      })
      .select()
      .single();

    if (messageError) {
      return new Response(JSON.stringify({ error: 'Failed to store message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI response
    const aiResponse = `I understand your concern about "${aiResult.mediatorSummary}". Let me help you work through this. Can you tell me more about what specific outcome you're hoping for?`;

    // Store AI response
    await supabaseClient.from('messages').insert({
      issue_id: issueId,
      sender_type: 'ai',
      sender_id: null,
      content: aiResponse
    });

    // Log AI event for debugging
    await supabaseClient.from('ai_events').insert({
      issue_id: issueId,
      agent: 'partner_ai',
      input: content,
      output: aiResult.processedContent
    });

    // Check if we should trigger mediator cycle
    const { data: messageCount } = await supabaseClient
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('issue_id', issueId)
      .eq('sender_type', 'user');

    // Trigger mediator after every 3 user messages
    if (messageCount && messageCount.length > 0 && messageCount.length % 3 === 0) {
      // Call mediator cycle function
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/run-mediator-cycle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueId })
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      userMessage,
      aiResponse: {
        content: aiResponse,
        sender_type: 'ai'
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