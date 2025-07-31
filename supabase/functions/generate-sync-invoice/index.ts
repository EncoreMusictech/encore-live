import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[INVOICE-TEST] Function started - method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('[INVOICE-TEST] OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[INVOICE-TEST] Processing request');

  try {
    console.log('[INVOICE-TEST] Parsing request body');
    const body = await req.json();
    console.log('[INVOICE-TEST] Request body parsed:', { hasBody: !!body });
    
    // Simple test response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Function is working',
        timestamp: new Date().toISOString(),
        receivedData: { hasBody: !!body }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating invoice:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});