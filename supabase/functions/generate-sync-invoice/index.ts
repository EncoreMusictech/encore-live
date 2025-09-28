import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[GENERATE-SYNC-INVOICE] Function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('[GENERATE-SYNC-INVOICE] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[GENERATE-SYNC-INVOICE] Starting invoice generation process');

  try {
    const body = await req.json();
    const { licenseId, customFields } = body;
    
    console.log('Invoice generation request:', { licenseId, hasCustomFields: !!customFields });
    
    if (!licenseId) {
      console.error('No licenseId provided in request body');
      throw new Error('License ID is required');
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header provided');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!user) {
      console.error('No user returned from authentication');
      throw new Error('Authentication failed - no user');
    }

    console.log('User authenticated successfully:', { userId: user.id, email: user.email });

    // Fetch license data with detailed logging
    console.log('Fetching license with params:', { licenseId, userId: user.id });
    
    const { data: license, error: licenseError } = await supabaseClient
      .from('sync_licenses')
      .select('*')
      .eq('id', licenseId)
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('License query completed:', { 
      foundLicense: !!license, 
      error: licenseError,
      licenseId: license?.id,
      licenseTitle: license?.project_title 
    });

    if (licenseError) {
      console.error('License query error details:', licenseError);
      throw new Error(`License query failed: ${licenseError.message}`);
    }

    if (!license) {
      throw new Error(`License not found - ID: ${licenseId}, User: ${user.id}`);
    }

    console.log('License found successfully:', { id: license.id, project_title: license.project_title });

    // Generate invoice HTML
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${license.synch_id || 'DRAFT'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { color: #2563eb; margin-bottom: 10px; }
          .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-section h3 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
          .info-item { margin: 10px 0; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
          .amount-section { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
          .total-amount { font-size: 2em; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SYNC LICENSE INVOICE</h1>
          <p>Professional Music Licensing Services</p>
        </div>
        
        <div class="invoice-info">
          <div class="info-section">
            <h3>Invoice Details</h3>
            <div class="info-item">
              <span class="label">Invoice #:</span>
              <span>INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}</span>
            </div>
            <div class="info-item">
              <span class="label">Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span>${license.license_status || 'Draft'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Bill To</h3>
            <div class="info-item">
              <span class="label">Company:</span>
              <span>${license.licensee_company || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Contact:</span>
              <span>${license.licensee_name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span>
              <span>${license.licensee_email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>License Information</h3>
          <div class="info-item">
            <span class="label">Project:</span>
            <span>${license.project_title || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="label">Usage Type:</span>
            <span>${license.usage_type || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="label">Territory:</span>
            <span>${license.territory || 'Worldwide'}</span>
          </div>
        </div>

        <div class="amount-section">
          <h3>Total License Fee</h3>
          <div class="total-amount">
            ${license.currency || 'USD'} ${((license.pub_fee || 0) + (license.master_fee || 0)).toLocaleString()}
          </div>
          <p>All fees are payable upon receipt</p>
        </div>

        ${customFields && Object.keys(customFields).length > 0 ? `
        <div class="info-section">
          <h3>Additional Information</h3>
          ${Object.entries(customFields).map(([key, value]) => `
            <div class="info-item">
              <span class="label">${key}:</span>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 0.9em;">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Generate invoice number and save to database
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const invoiceData = {
      user_id: user.id,
      license_id: licenseId,
      invoice_number: invoiceNumber,
      amount: (license.pub_fee || 0) + (license.master_fee || 0),
      currency: license.currency || 'USD',
      invoice_data: {
        html: invoiceHtml,
        license_data: license,
        custom_fields: customFields,
        generated_at: new Date().toISOString()
      },
      status: 'draft'
    };
    
    const { data: invoice, error: invoiceInsertError } = await supabaseClient
      .from('sync_invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceInsertError) {
      throw new Error(`Failed to save invoice: ${invoiceInsertError.message}`);
    }

    // Return the format expected by the frontend
    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice,
        html: invoiceHtml
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
        error: (error as Error).message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});