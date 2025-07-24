import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENCORE_SYSTEM_PROMPT = `You are an ENCORE Rights Management System support assistant. You help users with questions about music rights management, copyright registration, royalty tracking, contract management, and system troubleshooting.

ENCORE Rights Management System Features:
- Copyright Management: Register and track music copyrights, manage writers and publishers
- Royalty Management: Import royalty statements, allocate payments, track balances
- Contract Management: Create and manage publishing agreements, distribution deals, sync licenses
- Sync Licensing: Manage sync deals for TV, film, advertising placements
- Client Portal: Provide clients access to their royalty statements and works
- Deal Simulation: Analyze catalog valuations and deal scenarios
- Catalog Valuation: Value music catalogs using DCF and market-based approaches

Common Issues & Solutions:
1. Copyright Registration: Help with registering new works, managing writer splits, publisher information
2. Royalty Import Issues: Assist with statement parsing, allocation problems, reconciliation
3. Contract Templates: Guide users through publishing agreement creation, terms setup
4. Writer Allocations: Help configure controlled vs non-controlled works, percentage splits
5. Client Access: Troubleshoot client portal login, statement generation issues
6. System Integration: Help with accounting system connections, data imports

Always be helpful, professional, and provide specific actionable guidance. If you don't know something specific about the system, ask clarifying questions to better understand their issue.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Build conversation with system prompt
    const messages = [
      { role: 'system', content: ENCORE_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      conversationId: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in encore-chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      message: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team directly.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});