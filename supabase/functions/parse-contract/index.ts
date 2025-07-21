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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Parse contract function called');

  try {
    const { fileContent, fileUrl, fileName, userId } = await req.json();
    
    console.log('Request data:', { fileUrl: !!fileUrl, fileName, userId: !!userId });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fileUrl || !userId) {
      console.error('Missing required parameters');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: fileUrl and userId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing contract parsing for user: ${userId}, file: ${fileName}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Extract text from PDF
    let extractedText = '';
    
    if (fileName?.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF file...');
      
      // For now, we'll create a placeholder text and inform the user
      // that they need to copy/paste the contract text manually
      extractedText = `PDF file uploaded: ${fileName}
      
Please note: For best results, we recommend copying and pasting the contract text directly into a text format. 
PDF processing is currently limited in this environment.

You can:
1. Copy the text from your PDF file
2. Create a new contract by pasting the text directly
3. Or provide the key contract details manually

File processed: ${fileName}
Upload time: ${new Date().toISOString()}`;
      
      console.log('PDF processing completed with placeholder text');
    } else {
      // For non-PDF files, use the provided file content
      extractedText = fileContent || '';
    }

    if (!extractedText) {
      console.error('No text could be extracted from the file');
      return new Response(JSON.stringify({
        success: false,
        error: 'No text could be extracted from the file'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create initial parsing result record
    const { data: parsingResult, error: insertError } = await supabase
      .from('contract_parsing_results')
      .insert({
        user_id: userId,
        original_text: extractedText,
        parsing_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating parsing result:', insertError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create parsing result record'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Created parsing result record:', parsingResult.id);

    // Parse contract using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a specialized contract analysis AI. Extract key contract information from the provided text and return it as structured JSON. 

Extract the following information:
1. Contract type (publishing, artist, producer, sync, distribution, etc.)
2. Parties involved (names, roles, contact info if available)
3. Financial terms (advances, royalty rates, fees, etc.)
4. Key dates (start date, end date, renewal terms)
5. Territory information
6. Rights and obligations
7. Recoupment terms
8. Works covered (if applicable)
9. Payment terms and schedules
10. Termination clauses

Return the data as a JSON object with the following structure:
{
  "contract_type": "string",
  "parties": [
    {
      "name": "string",
      "role": "string", 
      "contact_info": {
        "email": "string",
        "phone": "string",
        "address": "string"
      }
    }
  ],
  "financial_terms": {
    "advance_amount": "number",
    "royalty_rates": {
      "mechanical": "number",
      "performance": "number", 
      "synchronization": "number"
    },
    "commission_percentage": "number"
  },
  "key_dates": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "renewal_terms": "string"
  },
  "territory": "string",
  "works_covered": [
    {
      "title": "string",
      "artist": "string",
      "isrc": "string",
      "iswc": "string"
    }
  ],
  "payment_terms": "string",
  "recoupment_status": "string",
  "termination_clauses": "string",
  "additional_terms": "string"
}

Provide confidence scores for each extracted field (0-1) and flag any uncertain extractions.`
          },
          {
            role: 'user',
            content: `Please analyze this contract and extract the key information:\n\n${extractedText}`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({
        success: false,
        error: `OpenAI API error: ${response.status} ${response.statusText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const extractedData = aiData.choices[0].message.content;

    console.log('OpenAI response received, parsing JSON...');

    let parsedData;
    let confidence = 0.8; // Default confidence
    
    try {
      // Try to parse the JSON response
      parsedData = JSON.parse(extractedData);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // If JSON parsing fails, store the raw response
      parsedData = {
        raw_response: extractedData,
        error: 'Failed to parse structured data'
      };
      confidence = 0.3;
    }

    // Extract entities for easier searching/matching
    const extractedEntities = {
      contract_type: parsedData.contract_type || 'unknown',
      parties: parsedData.parties || [],
      key_dates: parsedData.key_dates || {},
      financial_terms: parsedData.financial_terms || {}
    };

    // Update the parsing result with extracted data
    const { error: updateError } = await supabase
      .from('contract_parsing_results')
      .update({
        parsed_data: parsedData,
        extracted_entities: extractedEntities,
        parsing_status: 'completed',
        parsing_confidence: confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', parsingResult.id);

    if (updateError) {
      console.error('Error updating parsing result:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update parsing result'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Contract parsing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      extractedText: extractedText,
      parsing_result_id: parsingResult.id,
      parsed_data: parsedData,
      confidence: confidence,
      message: 'Contract parsed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-contract function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'Failed to parse contract'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});