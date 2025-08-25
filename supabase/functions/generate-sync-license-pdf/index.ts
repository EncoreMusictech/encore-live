import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncLicense {
  id: string;
  synch_id: string;
  user_id?: string;
  linked_copyright_ids?: string[];
  project_title: string;
  synch_agent?: string;
  media_type?: string;
  request_received?: string;
  source?: string;
  territory_of_licensee?: string;
  term_start?: string;
  term_end?: string;
  term_duration?: string;
  music_type?: string;
  music_use?: string;
  pub_fee?: number;
  master_fee?: number;
  currency: string;
  synch_status: string;
  notes?: string;
  exclusive_license?: boolean;
  promotional_usage?: boolean;
  festival_usage?: boolean;
  trailer_usage?: boolean;
  advertising_usage?: boolean;
  usage_duration_seconds?: number;
  usage_description?: string;
  context_description?: string;
  production_company?: string;
  production_budget?: number;
  distribution_channels?: string[];
  expected_audience_size?: number;
  master_owner?: string;
  master_owner_contact?: string;
  publishing_administrator?: string;
  publishing_admin_contact?: string;
  backend_royalty_rate?: number;
  performance_bonus?: number;
  sales_threshold_bonus?: number;
  sales_threshold_amount?: number;
  union_restrictions?: string;
  content_rating?: string;
  territory_restrictions?: string[];
  embargo_territories?: string[];
  delivery_format?: string;
  technical_specs?: any;
  delivery_deadline?: string;
  internal_project_code?: string;
  priority_level?: string;
  client_contact_info?: any;
  legal_review_status?: string;
  legal_reviewer?: string;
  legal_review_date?: string;
  approval_expiry_date?: string;
  
  // Contact information
  licensor_name?: string;
  licensee_name?: string;
  licensor_address?: string;
  licensee_address?: string;
  
  // Scene context
  scene_description?: string;
  scene_duration_seconds?: number;
  
  // Contract execution
  signatory_name?: string;
  signatory_title?: string;
  
  // Credit and rights fields
  credit_language?: string;
  credit_placement?: string;
  rights_cleared?: boolean;
  
  // Fee allocations
  fee_allocations?: any[];
  
  created_at: string;
  updated_at: string;
}

async function generateProfessionalSyncLicense(license: SyncLicense, supabase: any): Promise<string> {
  console.log('Generating professional sync license using contract module template');
  
  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: license.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "[DATE]";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Fetch copyright data for Exhibit A
  let copyrightData: any[] = [];
  if (license.linked_copyright_ids && license.linked_copyright_ids.length > 0) {
    const { data: copyrights, error: copyrightError } = await supabase
      .from('copyrights')
      .select(`
        *,
        copyright_writers(*),
        copyright_publishers(*)
      `)
      .in('id', license.linked_copyright_ids);
    
    if (!copyrightError && copyrights) {
      copyrightData = copyrights;
    }
  }

  // Calculate total sync fee
  const getTotalSyncFee = () => {
    if (license.fee_allocations && Array.isArray(license.fee_allocations)) {
      const total = license.fee_allocations.reduce((sum: number, allocation: any) => {
        return sum + (allocation.controlledAmount || 0);
      }, 0);
      return total > 0 ? formatCurrency(total) : "$TBD";
    }
    
    let totalFee = 0;
    if (license.pub_fee) totalFee += license.pub_fee;
    if (license.master_fee) totalFee += license.master_fee;
    
    return totalFee > 0 ? formatCurrency(totalFee) : "$TBD";
  };

  // Build Exhibit A - Schedule of Works
  const buildExhibitA = () => {
    if (copyrightData.length === 0) {
      return `
        <h3>EXHIBIT A - SCHEDULE OF WORKS</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Writer(s)</th>
              <th>Publisher</th>
              <th>Share</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px;">
                Works to be specified in final agreement
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const worksRows = copyrightData.map(copyright => {
      const writers = copyright.copyright_writers?.map((w: any) => w.writer_name).join(', ') || 'TBD';
      const publishers = copyright.copyright_publishers?.map((p: any) => p.publisher_name).join(', ') || 'TBD';
      
      return `
        <tr>
          <td>${escapeHtml(copyright.song_title || 'Untitled')}</td>
          <td>${escapeHtml(writers)}</td>
          <td>${escapeHtml(publishers)}</td>
          <td>TBD%</td>
          <td>${getTotalSyncFee()}</td>
        </tr>
      `;
    }).join('');

    return `
      <h3>EXHIBIT A - SCHEDULE OF WORKS</h3>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Writer(s)</th>
            <th>Publisher</th>
            <th>Share</th>
            <th>Fee</th>
          </tr>
        </thead>
        <tbody>
          ${worksRows}
        </tbody>
      </table>
    `;
  };

  // Generate the professional sync license content using contract module template
  const licenseContent = `
    <div class="header">
      <div class="title">SYNCHRONIZATION LICENSE AGREEMENT</div>
    </div>

    <p>This Synchronization License Agreement ("Agreement") is made and entered into as of ${formatDate(license.term_start)}, by and between:</p>

    <p><strong>${escapeHtml(license.licensor_name || license.publishing_administrator || '[LICENSOR NAME]')}</strong>, located at ${escapeHtml(license.licensor_address || '[LICENSOR ADDRESS]')} ("Licensor"),</p>
    <p>and</p>
    <p><strong>${escapeHtml(license.licensee_name || license.production_company || '[LICENSEE NAME]')}</strong>, located at ${escapeHtml(license.licensee_address || '[LICENSEE ADDRESS]')} ("Licensee").</p>

    <h2>1. GRANT OF RIGHTS</h2>
    <p>Licensor grants to Licensee a non-exclusive license to synchronize the musical composition(s) listed in Schedule A with the audiovisual production:</p>
    
    <p><strong>Production Title:</strong> ${escapeHtml(license.project_title)}</p>
    <p><strong>Producer/Company:</strong> ${escapeHtml(license.licensee_name || license.production_company || '[LICENSEE NAME]')}</p>
    <p><strong>Type of Use:</strong> ${escapeHtml(license.media_type || '[MEDIA TYPE]')}</p>
    <p><strong>Scene/Use Description:</strong> ${escapeHtml(license.scene_description || license.usage_description || '[USE DESCRIPTION]')}</p>
    <p><strong>Duration/Timing:</strong> ${license.scene_duration_seconds || '[SCENE DURATION]'} seconds</p>

    <p>The license is granted for the use of the composition in timed relation with the Production only.</p>

    <h2>2. TERRITORY</h2>
    <p>The rights granted herein are valid for the following territory: <strong>${escapeHtml(license.territory_of_licensee || 'Worldwide')}</strong>.</p>

    <h2>3. TERM</h2>
    <p>The rights granted herein shall endure for: <strong>${escapeHtml(license.term_duration || 'Perpetual')}</strong>${license.term_start && license.term_end ? ` from ${formatDate(license.term_start)} to ${formatDate(license.term_end)}` : ''}.</p>

    <h2>4. MEDIA & USAGE</h2>
    <p>The licensed composition may be used in connection with the following:</p>
    <ul>
      <li>Media Type: ${escapeHtml(license.media_type || 'Television/Film')}</li>
      ${license.promotional_usage ? '<li>Promotional Usage: Included</li>' : ''}
      ${license.festival_usage ? '<li>Festival Usage: Included</li>' : ''}
      ${license.trailer_usage ? '<li>Trailer Usage: Included</li>' : ''}
      ${license.advertising_usage ? '<li>Advertising Usage: Included</li>' : ''}
    </ul>

    <h2>5. LICENSE FEE AND PAYMENT</h2>
    <p><strong>One-time License Fee:</strong> ${getTotalSyncFee()}</p>
    <p><strong>Payment Terms:</strong> Net 30 days from execution of this Agreement</p>
    ${license.backend_royalty_rate ? `<p><strong>Backend Royalty Rate:</strong> ${license.backend_royalty_rate}%</p>` : ''}

    <h2>6. DELIVERY AND TECHNICAL SPECIFICATIONS</h2>
    ${license.delivery_format ? `<p><strong>Delivery Format:</strong> ${escapeHtml(license.delivery_format)}</p>` : ''}
    ${license.delivery_deadline ? `<p><strong>Delivery Deadline:</strong> ${formatDate(license.delivery_deadline)}</p>` : ''}
    ${license.technical_specs ? `<p><strong>Technical Specifications:</strong> ${escapeHtml(JSON.stringify(license.technical_specs))}</p>` : ''}

    <h2>7. CREDIT REQUIREMENTS</h2>
    ${license.credit_language ? `<p><strong>Credit Language:</strong> ${escapeHtml(license.credit_language)}</p>` : '<p>Standard music credit to be provided in end credits.</p>'}
    ${license.credit_placement ? `<p><strong>Credit Placement:</strong> ${escapeHtml(license.credit_placement.replace(/_/g, ' '))}</p>` : ''}

    <h2>8. RESTRICTIONS AND LIMITATIONS</h2>
    <p>This license is subject to the following restrictions:</p>
    <ul>
      <li>The license is non-exclusive and non-transferable</li>
      <li>No rights are granted for exploitation separate from the Production</li>
      ${license.territory_restrictions?.length ? `<li>Territory restrictions: ${license.territory_restrictions.join(', ')}</li>` : ''}
      ${license.embargo_territories?.length ? `<li>Embargo territories: ${license.embargo_territories.join(', ')}</li>` : ''}
      ${license.union_restrictions ? `<li>Union restrictions: ${escapeHtml(license.union_restrictions)}</li>` : ''}
    </ul>

    <h2>9. REPRESENTATIONS AND WARRANTIES</h2>
    <p>Licensor represents and warrants that it has the full right, power, and authority to enter into this Agreement and to grant the rights herein granted.</p>

    <h2>10. GOVERNING LAW</h2>
    <p>This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles.</p>

    ${buildExhibitA()}

    <div class="signature-section">
      <h2>SIGNATURES</h2>
      <table style="width: 100%; border: none;">
        <tr style="border: none;">
          <td style="width: 50%; border: none; vertical-align: top;">
            <p><strong>LICENSOR:</strong></p>
            <br><br>
            <div class="signature-line"></div>
            <p>${escapeHtml(license.licensor_name || '[LICENSOR NAME]')}</p>
            <p>Date: _______________</p>
          </td>
          <td style="width: 50%; border: none; vertical-align: top;">
            <p><strong>LICENSEE:</strong></p>
            <br><br>
            <div class="signature-line"></div>
            <p>${escapeHtml(license.licensee_name || '[LICENSEE NAME]')}</p>
            <p>Date: _______________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapInHTML(licenseContent, license.project_title || 'Synchronization License');
}

function wrapInHTML(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Synchronization License</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.4; margin: 0; padding: 30px 40px; font-size: 11pt; color: #000; max-width: 8.5in; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 16pt; font-weight: bold; margin-bottom: 20px; letter-spacing: 1px; }
        h1, h2, h3 { margin: 20px 0 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px 12px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .signature-section { margin-top: 50px; page-break-inside: avoid; }
        .signature-line { border-bottom: 1px solid #000; width: 300px; margin-bottom: 5px; display: inline-block; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}

function escapeHtml(str: string | undefined | null): string {
  return String(str || '').replace(/[&<>"']/g, (match) => {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== SYNC LICENSE PDF GENERATION STARTED ===');
  try {
    const { licenseId } = await req.json();
    console.log('Received request for license ID:', licenseId);

    if (!licenseId) {
      return new Response(
        JSON.stringify({ error: 'License ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the sync license data
    const { data: license, error: licenseError } = await supabase
      .from('sync_licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (licenseError || !license) {
      console.error('License fetch error:', licenseError);
      return new Response(
        JSON.stringify({ error: 'License not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetched license:', {
      id: license.id,
      project_title: license.project_title,
      linked_copyright_ids: license.linked_copyright_ids,
      hasLinkedCopyrights: !!(license.linked_copyright_ids && license.linked_copyright_ids.length > 0)
    });

    // Generate the professional sync license agreement
    console.log('Generating professional sync license agreement...');
    const htmlContent = await generateProfessionalSyncLicense(license, supabase);
    
    console.log('Template generation completed:', {
      contentLength: htmlContent.length,
      hasContent: htmlContent.includes('<body>'),
      bodyHasContent: htmlContent.match(/<body[^>]*>(.*?)<\/body>/s)?.[1]?.trim().length > 0
    });

    return new Response(JSON.stringify({ 
      success: true, 
      htmlContent,
      filename: `sync-license-${license.synch_id}.html`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error generating license PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});