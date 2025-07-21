import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Parse contract function called ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reading request body...');
    const body = await req.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { fileUrl, fileName, userId } = body;
    
    if (!userId) {
      throw new Error('Missing userId');
    }

    if (!fileUrl) {
      throw new Error('Missing fileUrl');
    }

    console.log('Processing file:', fileName);
    console.log('User ID:', userId);
    console.log('File URL:', fileUrl);

    // Simple success response
    const response = {
      success: true,
      extractedText: "Sample contract text extracted successfully",
      parsing_result_id: crypto.randomUUID(),
      parsed_data: {
        contract_type: 'publishing_administration',
        parties: [
          { name: 'Encore Music Group, Inc.', role: 'administrator' },
          { name: 'Starburst Sounds LLC', role: 'original_publisher' }
        ],
        financial_terms: {
          advance_amount: null,
          commission_percentage: 0.15
        },
        territory: 'Worldwide',
        key_dates: {
          start_date: '2024-01-01',
          end_date: '2027-01-01'
        }
      },
      confidence: 0.85,
      message: 'Contract processed successfully (test mode)'
    };

    console.log('Returning success response');
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'Failed to process contract'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});