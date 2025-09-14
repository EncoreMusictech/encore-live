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

// Helper utilities for JWT
function base64UrlEncode(input: Uint8Array | string): string {
  const raw = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const base64 = btoa(String.fromCharCode(...new Uint8Array(raw)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Normalize escaped newlines and whitespace from secrets storage
  let normalized = (pem || '').replace(/\\n/g, '\n').trim();

  // If the PEM contains header/footer, strip them and newlines
  let base64Body = normalized.includes('BEGIN')
    ? normalized
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace('-----BEGIN RSA PRIVATE KEY-----', '')
        .replace('-----END RSA PRIVATE KEY-----', '')
        .replace(/\r?\n|\r/g, '')
        .trim()
    : normalized;

  // Support URL-safe base64 just in case and ensure proper padding
  base64Body = base64Body.replace(/-/g, '+').replace(/_/g, '/');
  while (base64Body.length % 4 !== 0) base64Body += '=';

  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(privateKeyPem)
  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  } catch (_) {
    return await crypto.subtle.importKey(
      'pkcs1',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  }
}

// Helper function to generate JWT token (RS256)
async function generateJWTToken(integrationKey: string, userId: string, privateKeyPem: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: integrationKey,
    sub: userId,
    aud: 'account-d.docusign.com',
    iat: now,
    exp: now + 3600,
    scope: 'signature impersonation'
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const key = await importPrivateKey(privateKeyPem)
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  )
  const encodedSignature = base64UrlEncode(signature)
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}