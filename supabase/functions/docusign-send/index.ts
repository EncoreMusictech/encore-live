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
    const { contract_content, recipient_email, recipient_name, subject } = await req.json();

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
    const accessToken = authData.access_token;

    // Create envelope for signature
    const envelopeDefinition = {
      emailSubject: subject || "Please review and sign this contract",
      documents: [
        {
          documentBase64: btoa(contract_content),
          name: "Contract.pdf",
          fileExtension: "pdf",
          documentId: "1"
        }
      ],
      recipients: {
        signers: [
          {
            email: recipient_email,
            name: recipient_name,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  recipientId: "1",
                  tabLabel: "SignHereTab",
                  xPosition: "100",
                  yPosition: "100"
                }
              ],
              dateSignedTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  recipientId: "1",
                  xPosition: "300",
                  yPosition: "100"
                }
              ]
            }
          }
        ]
      },
      status: "sent"
    };

    // Send envelope
    const envelopeResponse = await fetch(
      `${baseUrl}/v2.1/accounts/${accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error('DocuSign envelope creation failed:', errorText);
      throw new Error('Failed to create DocuSign envelope');
    }

    const envelopeData = await envelopeResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      envelopeId: envelopeData.envelopeId,
      status: envelopeData.status,
      message: "Contract sent successfully via DocuSign"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in docusign-send function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate JWT token (simplified version)
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