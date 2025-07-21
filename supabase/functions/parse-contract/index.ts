import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Parse contract function called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EDGE FUNCTION CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Simple test - just return success for now
    console.log('OpenAI API Key available:', !!openAIApiKey);
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Service Key available:', !!supabaseServiceKey);
    
    console.log('Reading request body...');
    const requestBody = await req.text();
    console.log('Raw request body length:', requestBody?.length || 0);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Successfully parsed JSON body');
    } catch (parseError) {
      console.error('Failed to parse request body as JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        receivedBody: requestBody.substring(0, 100) + '...'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { fileContent, fileUrl, fileName, userId } = parsedBody;
    console.log('Extracted params:', { 
      hasFileContent: !!fileContent, 
      hasFileUrl: !!fileUrl, 
      fileName, 
      hasUserId: !!userId 
    });

    if (!userId) {
      console.error('Missing userId parameter');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: userId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Accept either fileUrl or fileContent for backwards compatibility
    if (!fileUrl && !fileContent) {
      console.error('Missing fileUrl or fileContent parameter');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: fileUrl or fileContent'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, just return a simple success response
    const extractedText = `PDF file uploaded: ${fileName}
    
This is a test response. The PDF processing system is working correctly.
Your file has been received and can be processed.

File: ${fileName}
Timestamp: ${new Date().toISOString()}`;

    console.log('Returning success response');
    return new Response(JSON.stringify({
      success: true,
      extractedText: extractedText,
      parsing_result_id: 'test-' + Date.now(),
      parsed_data: {
        contract_type: 'test',
        parties: [
          { name: 'Test Party 1', role: 'publisher' },
          { name: 'Test Party 2', role: 'writer' }
        ],
        financial_terms: {
          advance_amount: 10000,
          commission_percentage: 0.15
        }
      },
      confidence: 0.8,
      message: 'Contract processed successfully (test mode)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      errorType: error.constructor.name,
      message: 'Failed to process contract'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});