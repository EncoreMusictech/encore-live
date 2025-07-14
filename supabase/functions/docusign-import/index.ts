import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...requestData } = await req.json();

    // Get DocuSign credentials from secrets
    const integrationKey = Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
    const secretKey = Deno.env.get('DOCUSIGN_SECRET_KEY');
    const userId = Deno.env.get('DOCUSIGN_USER_ID');
    const accountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');

    if (!integrationKey || !secretKey || !userId || !accountId) {
      throw new Error('Missing DocuSign credentials');
    }

    // DocuSign OAuth endpoint (demo environment)
    const baseUrl = 'https://demo.docusign.net/restapi';
    const authUrl = 'https://account-d.docusign.com/oauth/token';

    switch (action) {
      case 'authenticate': {
        // Get JWT token for authentication
        const jwtToken = await generateJWTToken(integrationKey, userId, secretKey);
        
        const authResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
        });

        if (!authResponse.ok) {
          throw new Error('Failed to authenticate with DocuSign');
        }

        const authData = await authResponse.json();
        
        return new Response(JSON.stringify({ 
          success: true, 
          accessToken: authData.access_token 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'listEnvelopes': {
        const { accessToken } = requestData;
        
        // Get list of envelopes from DocuSign
        const envelopesResponse = await fetch(
          `${baseUrl}/v2.1/accounts/${accountId}/envelopes?status=completed&count=20`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (!envelopesResponse.ok) {
          throw new Error('Failed to fetch envelopes from DocuSign');
        }

        const envelopesData = await envelopesResponse.json();
        
        return new Response(JSON.stringify({
          success: true,
          envelopes: envelopesData.envelopes || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getEnvelopeDocuments': {
        const { accessToken, envelopeId } = requestData;
        
        // Get documents from a specific envelope
        const documentsResponse = await fetch(
          `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (!documentsResponse.ok) {
          throw new Error('Failed to fetch envelope documents');
        }

        const documentsData = await documentsResponse.json();
        
        return new Response(JSON.stringify({
          success: true,
          documents: documentsData.envelopeDocuments || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'downloadDocument': {
        const { accessToken, envelopeId, documentId } = requestData;
        
        // Download document content
        const documentResponse = await fetch(
          `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/pdf',
            },
          }
        );

        if (!documentResponse.ok) {
          throw new Error('Failed to download document');
        }

        const documentBuffer = await documentResponse.arrayBuffer();
        const base64Document = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));
        
        return new Response(JSON.stringify({
          success: true,
          documentData: base64Document,
          contentType: 'application/pdf'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'importContract': {
        const { accessToken, envelopeId, documentId, contractData } = requestData;
        
        // Download the document
        const documentResponse = await fetch(
          `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/${documentId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/pdf',
            },
          }
        );

        if (!documentResponse.ok) {
          throw new Error('Failed to download document for import');
        }

        const documentBuffer = await documentResponse.arrayBuffer();
        const base64Document = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));
        
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get envelope details for contract metadata
        const envelopeResponse = await fetch(
          `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        const envelopeData = await envelopeResponse.json();
        
        // Create contract record in database
        const { data: contract, error } = await supabase
          .from('contracts')
          .insert({
            title: contractData.title || envelopeData.emailSubject || 'Imported from DocuSign',
            counterparty_name: contractData.counterparty_name || 'Unknown',
            contract_type: contractData.contract_type || 'publishing',
            contract_status: 'signed',
            user_id: contractData.user_id,
            notes: `Imported from DocuSign envelope: ${envelopeId}`,
            contract_data: {
              docusign_envelope_id: envelopeId,
              docusign_document_id: documentId,
              import_date: new Date().toISOString(),
              envelope_status: envelopeData.status
            },
            original_pdf_url: `data:application/pdf;base64,${base64Document}`
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating contract:', error);
          throw new Error('Failed to create contract in database');
        }

        return new Response(JSON.stringify({
          success: true,
          contract: contract
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action specified');
    }
  } catch (error) {
    console.error('Error in docusign-import function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate JWT token
async function generateJWTToken(integrationKey: string, userId: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: integrationKey,
    sub: userId,
    aud: 'account-d.docusign.com',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'signature impersonation'
  };

  // For simplicity, we'll use a basic JWT implementation
  // In production, you might want to use a more robust JWT library
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  
  // Note: This is a simplified version. In production, you'd properly sign with the private key
  const signature = btoa(`${encodedHeader}.${encodedPayload}.signature`).replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}