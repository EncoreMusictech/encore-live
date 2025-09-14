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
      case 'testAuth': {
        // Attempt auth but always return 200 with details
        try {
          const jwtToken = await generateJWTToken(integrationKey, userId, secretKey);
          const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
          });

          const text = await authResponse.text();
          let json: any = {};
          try { json = text ? JSON.parse(text) : {}; } catch { /* keep as text */ }

          if (!authResponse.ok) {
            const code = json.error || 'auth_failed';
            const description = json.error_description || text || 'Failed to authenticate with DocuSign';
            const consentUrl = code === 'consent_required'
              ? `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=${encodeURIComponent('https://plxsenykjisqutxcvjeg.supabase.co')}`
              : undefined;
            return new Response(JSON.stringify({ success: false, errorCode: code, error: description, consentUrl }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, accessToken: json.access_token }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ success: false, errorCode: 'exception', error: e.message || 'Unexpected error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

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
          const text = await authResponse.text();
          throw new Error(`Failed to authenticate with DocuSign: ${text}`);
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
        
        // Initialize Supabase client using user's auth token to respect RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://plxsenykjisqutxcvjeg.supabase.co';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA';
        const authHeader = req.headers.get('Authorization') || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

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
    // Try PKCS#8 first
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  } catch (_) {
    // Fallback: try PKCS#1 (needs wrapping). Some environments allow direct PKCS#1 import
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
    exp: now + 3600, // 1 hour
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