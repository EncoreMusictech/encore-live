import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncLicense {
  id: string;
  synch_id: string;
  project_title: string;
  synch_agent?: string;
  media_type?: string;
  request_received?: string;
  source?: string;
  territory_of_licensee?: string;
  term_start?: string;
  term_end?: string;
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
  created_at: string;
  updated_at: string;
}

function generateLicenseAgreementHTML(license: SyncLicense): string {
  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: license.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "____________";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatUsageRights = () => {
    const rights = [];
    if (license.promotional_usage) rights.push("Promotional Usage");
    if (license.festival_usage) rights.push("Festival Usage");
    if (license.trailer_usage) rights.push("Trailer Usage");
    if (license.advertising_usage) rights.push("Advertising Usage");
    return rights.length > 0 ? rights.join(", ") : "Standard Usage";
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sync License Agreement - ${license.synch_id}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            font-size: 12pt;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 14pt;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        .field-group {
            margin-bottom: 15px;
        }
        .field-label {
            font-weight: bold;
            display: inline-block;
            min-width: 180px;
        }
        .field-value {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            padding-bottom: 2px;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 20px;
        }
        .terms-text {
            text-align: justify;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10pt;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SYNCHRONIZATION LICENSE AGREEMENT</div>
        <div class="subtitle">License No: ${license.synch_id}</div>
        <div class="subtitle">Project: ${license.project_title}</div>
    </div>

    <div class="section">
        <div class="section-title">1. PARTIES</div>
        <div class="field-group">
            <span class="field-label">Licensor:</span>
            <span class="field-value">${license.publishing_administrator || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Licensee:</span>
            <span class="field-value">${license.production_company || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Representative:</span>
            <span class="field-value">${license.synch_agent || "________________________"}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. COMPOSITION DETAILS</div>
        <table>
            <tr>
                <th>Field</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Music Type</td>
                <td>${license.music_type || "N/A"}</td>
            </tr>
            <tr>
                <td>Music Use</td>
                <td>${license.music_use || "N/A"}</td>
            </tr>
            <tr>
                <td>Usage Description</td>
                <td>${license.usage_description || "N/A"}</td>
            </tr>
            <tr>
                <td>Context Description</td>
                <td>${license.context_description || "N/A"}</td>
            </tr>
            <tr>
                <td>Duration</td>
                <td>${license.usage_duration_seconds ? `${license.usage_duration_seconds} seconds` : "N/A"}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. PRODUCTION DETAILS</div>
        <div class="field-group">
            <span class="field-label">Production Title:</span>
            <span class="field-value">${license.project_title}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Media Type:</span>
            <span class="field-value">${license.media_type || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Production Company:</span>
            <span class="field-value">${license.production_company || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Production Budget:</span>
            <span class="field-value">${license.production_budget ? formatCurrency(license.production_budget) : "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Expected Audience Size:</span>
            <span class="field-value">${license.expected_audience_size ? license.expected_audience_size.toLocaleString() : "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Content Rating:</span>
            <span class="field-value">${license.content_rating || "________________________"}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">4. TERRITORY AND TERM</div>
        <div class="field-group">
            <span class="field-label">Territory:</span>
            <span class="field-value">${license.territory_of_licensee || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Term Start:</span>
            <span class="field-value">${formatDate(license.term_start)}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Term End:</span>
            <span class="field-value">${formatDate(license.term_end)}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Distribution Channels:</span>
            <span class="field-value">${license.distribution_channels?.join(", ") || "________________________"}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">5. USAGE RIGHTS</div>
        <div class="field-group">
            <span class="field-label">Exclusive License:</span>
            <span class="field-value">${license.exclusive_license ? "Yes" : "No"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Usage Rights:</span>
            <span class="field-value">${formatUsageRights()}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Territory Restrictions:</span>
            <span class="field-value">${license.territory_restrictions?.join(", ") || "None"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Embargo Territories:</span>
            <span class="field-value">${license.embargo_territories?.join(", ") || "None"}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">6. FINANCIAL TERMS</div>
        <table>
            <tr>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Currency</th>
            </tr>
            <tr>
                <td>Publishing Fee</td>
                <td>${formatCurrency(license.pub_fee)}</td>
                <td>${license.currency}</td>
            </tr>
            <tr>
                <td>Master Fee</td>
                <td>${formatCurrency(license.master_fee)}</td>
                <td>${license.currency}</td>
            </tr>
            <tr>
                <td><strong>Total License Fee</strong></td>
                <td><strong>${formatCurrency((license.pub_fee || 0) + (license.master_fee || 0))}</strong></td>
                <td><strong>${license.currency}</strong></td>
            </tr>
        </table>
        
        ${license.backend_royalty_rate ? `
        <div class="field-group">
            <span class="field-label">Backend Royalty Rate:</span>
            <span class="field-value">${license.backend_royalty_rate}%</span>
        </div>
        ` : ''}
        
        ${license.performance_bonus ? `
        <div class="field-group">
            <span class="field-label">Performance Bonus:</span>
            <span class="field-value">${formatCurrency(license.performance_bonus)}</span>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">7. DELIVERY AND TECHNICAL SPECIFICATIONS</div>
        <div class="field-group">
            <span class="field-label">Delivery Format:</span>
            <span class="field-value">${license.delivery_format || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Delivery Deadline:</span>
            <span class="field-value">${formatDate(license.delivery_deadline)}</span>
        </div>
        ${license.technical_specs ? `
        <div class="field-group">
            <span class="field-label">Technical Specifications:</span>
            <div class="terms-text">${JSON.stringify(license.technical_specs)}</div>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">8. RIGHTS HOLDERS</div>
        <div class="field-group">
            <span class="field-label">Master Owner:</span>
            <span class="field-value">${license.master_owner || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Master Owner Contact:</span>
            <span class="field-value">${license.master_owner_contact || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Publishing Administrator:</span>
            <span class="field-value">${license.publishing_administrator || "________________________"}</span>
        </div>
        <div class="field-group">
            <span class="field-label">Publishing Admin Contact:</span>
            <span class="field-value">${license.publishing_admin_contact || "________________________"}</span>
        </div>
    </div>

    ${license.union_restrictions ? `
    <div class="section">
        <div class="section-title">9. UNION RESTRICTIONS</div>
        <div class="terms-text">${license.union_restrictions}</div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">10. GENERAL TERMS</div>
        <div class="terms-text">
            This agreement grants the Licensee the non-exclusive right to synchronize the above-mentioned musical composition with the visual elements of the Production, subject to the terms and conditions set forth herein.
        </div>
        <div class="terms-text">
            The Licensee agrees to provide proper credit and acknowledgment as required by the Licensor. Any changes to the original composition must be approved in writing by the Licensor.
        </div>
        <div class="terms-text">
            This license is contingent upon full payment of the license fee and compliance with all terms specified in this agreement.
        </div>
    </div>

    ${license.notes ? `
    <div class="section">
        <div class="section-title">11. ADDITIONAL NOTES</div>
        <div class="terms-text">${license.notes}</div>
    </div>
    ` : ''}

    <div class="signature-section">
        <div class="signature-block">
            <p><strong>LICENSOR:</strong></p>
            <div class="signature-line"></div>
            <p>Signature</p>
            <div class="signature-line"></div>
            <p>Print Name</p>
            <div class="signature-line"></div>
            <p>Date</p>
        </div>
        <div class="signature-block">
            <p><strong>LICENSEE:</strong></p>
            <div class="signature-line"></div>
            <p>Signature</p>
            <div class="signature-line"></div>
            <p>Print Name</p>
            <div class="signature-line"></div>
            <p>Date</p>
        </div>
    </div>

    <div class="footer">
        <p>License Agreement Generated on ${new Date().toLocaleDateString('en-US')}</p>
        <p>License ID: ${license.synch_id} | Internal Project Code: ${license.internal_project_code || "N/A"}</p>
    </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { licenseId } = await req.json();

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

    // Generate HTML content
    const htmlContent = generateLicenseAgreementHTML(license);

    // For now, return the HTML directly
    // In production, you would convert this to PDF using a library like Puppeteer
    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="sync-license-${license.synch_id}.html"`
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