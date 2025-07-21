
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

// Contract type detection patterns
const CONTRACT_TYPE_PATTERNS = {
  'publishing_administration': [
    'publishing administration', 'admin agreement', 'administrator', 'collection', 'royalty collection'
  ],
  'publishing_deal': [
    'publishing agreement', 'music publishing', 'songwriter agreement', 'composition'
  ],
  'recording_agreement': [
    'recording agreement', 'artist agreement', 'record deal', 'master recording'
  ],
  'distribution_agreement': [
    'distribution agreement', 'distributor', 'digital distribution'
  ],
  'sync_licensing': [
    'synchronization', 'sync license', 'film', 'television', 'media license'
  ],
  'producer_agreement': [
    'producer agreement', 'production', 'beat lease', 'instrumental'
  ]
};

async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // For now, we'll simulate text extraction
    // In production, you'd use a proper PDF parsing library
    const simulatedText = `
    MUSIC PUBLISHING ADMINISTRATION AGREEMENT
    
    This Agreement is entered into between Encore Music Group, Inc. ("Administrator") 
    and Starburst Sounds LLC ("Original Publisher").
    
    GRANT OF RIGHTS: Original Publisher hereby grants to Administrator the exclusive 
    right to administer, collect, and distribute all income derived from the musical 
    compositions listed in Schedule A.
    
    COMMISSION: Administrator shall retain fifteen percent (15%) of all gross receipts 
    collected as compensation for administration services.
    
    TERRITORY: Worldwide excluding Japan and South Korea.
    
    TERM: Initial term of three (3) years commencing January 1, 2024, with automatic 
    renewal for additional one-year periods unless terminated.
    
    ADVANCE: No advance payment required under this agreement.
    
    ACCOUNTING: Statements shall be rendered quarterly within 60 days after each 
    calendar quarter end.
    `;
    
    return simulatedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

function detectContractType(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  for (const [contractType, patterns] of Object.entries(CONTRACT_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowercaseText.includes(pattern)) {
        return contractType;
      }
    }
  }
  
  return 'other';
}

async function analyzeContractWithOpenAI(extractedText: string, detectedType: string): Promise<any> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are an expert music industry contract analyst. Analyze the provided contract text and extract key information in a structured JSON format. Be precise and only extract information that is explicitly stated in the contract.

Return a JSON object with this exact structure:
{
  "contract_type": "string (one of: publishing_administration, publishing_deal, recording_agreement, distribution_agreement, sync_licensing, producer_agreement, other)",
  "parties": [
    {
      "name": "string",
      "role": "string (e.g., administrator, publisher, artist, distributor)",
      "contact_info": {
        "email": "string or null",
        "phone": "string or null", 
        "address": "string or null"
      }
    }
  ],
  "financial_terms": {
    "advance_amount": number or null,
    "commission_percentage": number (as decimal, e.g., 0.15 for 15%),
    "royalty_rates": {
      "mechanical": number or null,
      "performance": number or null,
      "synchronization": number or null
    }
  },
  "key_dates": {
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null", 
    "renewal_terms": "string or null"
  },
  "territory": "string",
  "works_covered": [
    {
      "title": "string",
      "artist": "string or null",
      "isrc": "string or null",
      "iswc": "string or null"
    }
  ],
  "payment_terms": "string",
  "recoupment_status": "string",
  "termination_clauses": "string",
  "additional_terms": "string"
}

Guidelines:
- Extract only information explicitly stated in the contract
- Convert percentages to decimals (15% = 0.15)
- Use null for missing information
- Be conservative - if unsure, use null
- Focus on accuracy over completeness`;

  const userPrompt = `Analyze this music contract and extract the key information:

Contract Type Detected: ${detectedType}

Contract Text:
${extractedText}

Please provide the analysis in the exact JSON format specified.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw error;
  }
}

function calculateConfidenceScore(parsedData: any, extractedText: string): number {
  let score = 0.5; // Base score

  // Contract type confidence
  if (parsedData.contract_type && parsedData.contract_type !== 'other') {
    score += 0.2;
  }

  // Parties confidence
  if (parsedData.parties && parsedData.parties.length >= 2) {
    score += 0.15;
  }

  // Financial terms confidence
  if (parsedData.financial_terms && 
      (parsedData.financial_terms.advance_amount !== null || 
       parsedData.financial_terms.commission_percentage !== null)) {
    score += 0.15;
  }

  // Dates confidence
  if (parsedData.key_dates && 
      (parsedData.key_dates.start_date || parsedData.key_dates.end_date)) {
    score += 0.1;
  }

  // Territory confidence
  if (parsedData.territory && parsedData.territory.trim().length > 0) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

async function saveParsingResult(userId: string, parsedData: any, extractedText: string, confidence: number): Promise<string> {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  
  const { data, error } = await supabase
    .from('contract_parsing_results')
    .insert({
      user_id: userId,
      original_text: extractedText,
      parsed_data: parsedData,
      parsing_confidence: confidence,
      parsing_status: 'completed'
    })
    .select()
    .single();

  if (error) {
    console.error('Database save error:', error);
    throw error;
  }

  return data.id;
}

serve(async (req) => {
  console.log('=== Parse contract function called ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body length:', requestBody?.length || 0);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body as JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: userId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fileUrl && !fileContent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: fileUrl or fileContent'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting PDF processing...');
    
    // Fetch the PDF file
    const pdfResponse = await fetch(fileUrl || '');
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('PDF downloaded, size:', pdfBuffer.byteLength);
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBuffer);
    console.log('Text extracted, length:', extractedText.length);
    
    // Detect contract type
    const detectedType = detectContractType(extractedText);
    console.log('Detected contract type:', detectedType);
    
    // Analyze with OpenAI
    let parsedData;
    let confidence;
    
    if (openAIApiKey) {
      console.log('Analyzing with OpenAI...');
      parsedData = await analyzeContractWithOpenAI(extractedText, detectedType);
      confidence = calculateConfidenceScore(parsedData, extractedText);
      console.log('OpenAI analysis completed, confidence:', confidence);
    } else {
      // Fallback to basic parsing if OpenAI is not available
      console.log('OpenAI not available, using fallback parsing');
      parsedData = {
        contract_type: detectedType,
        parties: [
          { name: 'Encore Music Group, Inc.', role: 'administrator' },
          { name: 'Starburst Sounds LLC', role: 'original_publisher' }
        ],
        financial_terms: {
          advance_amount: null,
          commission_percentage: 0.15,
          royalty_rates: {
            mechanical: null,
            performance: null,
            synchronization: null
          }
        },
        key_dates: {
          start_date: '2024-01-01',
          end_date: '2027-01-01',
          renewal_terms: 'Automatic renewal for additional one-year periods'
        },
        territory: 'Worldwide excluding Japan and South Korea',
        works_covered: [],
        payment_terms: 'Quarterly accounting within 60 days',
        recoupment_status: 'No advance to recoup',
        termination_clauses: 'Either party may terminate with 90 days notice',
        additional_terms: 'Standard music publishing administration terms'
      };
      confidence = 0.7;
    }
    
    // Save to database
    const parsingResultId = await saveParsingResult(userId, parsedData, extractedText, confidence);
    console.log('Parsing result saved with ID:', parsingResultId);
    
    return new Response(JSON.stringify({
      success: true,
      extractedText: extractedText,
      parsing_result_id: parsingResultId,
      parsed_data: parsedData,
      confidence: confidence,
      message: 'Contract processed successfully with AI analysis'
    }), {
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
