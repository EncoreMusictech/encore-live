import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

function escapeHtml(str: string): string {
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

async function generateLicenseAgreementHTML(license: SyncLicense, supabase: any): Promise<string> {
  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: license.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  console.log('License data:', JSON.stringify(license, null, 2));
  console.log('Linked copyright IDs:', license.linked_copyright_ids);

  // Ensure we have basic license data
  if (!license) {
    console.error('No license data provided');
    throw new Error('No license data available');
  }

  // Fetch copyright data if linked_copyright_ids exist
  let copyrightData: any[] = [];
  if (license.linked_copyright_ids && license.linked_copyright_ids.length > 0) {
    console.log('Fetching copyrights for IDs:', license.linked_copyright_ids);
    const { data: copyrights, error: copyrightError } = await supabase
      .from('copyrights')
      .select(`
        *,
        copyright_writers(*),
        copyright_publishers(*)
      `)
      .in('id', license.linked_copyright_ids);
    
    console.log('Copyright fetch result:', { copyrights, copyrightError });
    
    if (!copyrightError && copyrights) {
      copyrightData = copyrights;
      console.log('Copyright data loaded:', copyrightData.length, 'copyrights');
    } else {
      console.error('Error fetching copyrights:', copyrightError);
    }
  } else {
    console.log('No linked copyright IDs found');
  }

  const getLicensorInfo = () => {
    return license.licensor_name || license.publishing_administrator || "-";
  };

  const getLicensorAddress = () => {
    return license.licensor_address || "-";
  };

  const getLicenseeInfo = () => {
    return license.licensee_name || license.production_company || "-";
  };

  const getLicenseeAddress = () => {
    return license.licensee_address || "-";
  };

  const getProjectInfo = () => {
    const mediaType = license.media_type || "-";
    const episode = license.context_description || "-";
    return { mediaType, episode };
  };

  const getUsageType = () => {
    return license.music_use || "-";
  };

  const getDuration = () => {
    // Map to Scene Duration (Seconds) field from the form
    if (license.scene_duration_seconds) {
      return license.scene_duration_seconds.toString();
    }
    return "-";
  };

  const getSceneContext = () => {
    // Map to Scene Description field from the form
    return license.scene_description || "-";
  };

  const getTotalSyncFee = () => {
    // Calculate total controlled amount from fee allocations
    console.log('=== CALCULATING TOTAL SYNC FEE ===');
    console.log('License fee_allocations:', JSON.stringify(license.fee_allocations, null, 2));
    
    if (license.fee_allocations && Array.isArray(license.fee_allocations)) {
      const totalControlledAmount = license.fee_allocations.reduce((total: number, allocation: any) => {
        console.log('Processing allocation:', allocation);
        console.log('Adding controlledAmount:', allocation.controlledAmount);
        return total + (allocation.controlledAmount || 0);
      }, 0);
      console.log('Final totalControlledAmount:', totalControlledAmount);
      return totalControlledAmount > 0 ? formatCurrency(totalControlledAmount) : "-";
    }
    
    // Fallback to individual fee fields if available
    let totalFee = 0;
    if (license.pub_fee) totalFee += license.pub_fee;
    if (license.master_fee) totalFee += license.master_fee;
    
    if (totalFee > 0) {
      console.log('Using fallback fee calculation:', totalFee);
      return formatCurrency(totalFee);
    }
    
    console.log('No fee_allocations or fees found, returning default');
    return "$TBD";
  };

  const getStateName = (abbreviation: string): string => {
    const stateMap: { [key: string]: string } = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    return stateMap[abbreviation] || abbreviation;
  };

  const getLicensorStateCountry = () => {
    // Extract state/country from licensor address
    const address = license.licensor_address;
    console.log('=== PARSING ADDRESS FOR STATE/COUNTRY ===');
    console.log('Raw address:', JSON.stringify(address));
    
    if (address) {
      // Clean up the address and split by comma
      const cleanAddress = address.replace(/\n/g, '').trim();
      const parts = cleanAddress.split(',').map(part => part.trim());
      
      console.log('Address parts:', parts);
      
      // Try multiple approaches to find state
      let stateAbbr = null;
      
      // Approach 1: Look for state in last part
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1]; // Should be "CA 91601"
        console.log('Last part:', JSON.stringify(lastPart));
        
        const stateMatch = lastPart.match(/([A-Z]{2})\s*\d+/);
        if (stateMatch) {
          stateAbbr = stateMatch[1];
          console.log('Found state from last part:', stateAbbr);
        }
      }
      
      // Approach 2: Look for any 2-letter state code
      if (!stateAbbr) {
        const fullText = cleanAddress.toUpperCase();
        const allStateMatches = fullText.match(/\b([A-Z]{2})\b/g);
        console.log('All potential state matches:', allStateMatches);
        
        if (allStateMatches) {
          // Check if any match is a valid state
          for (const match of allStateMatches) {
            if (getStateName(match) !== match) { // If it converts to a different name, it's a valid state
              stateAbbr = match;
              console.log('Found valid state code:', stateAbbr);
              break;
            }
          }
        }
      }
      
      if (stateAbbr) {
        const stateName = getStateName(stateAbbr);
        console.log('Final state mapping:', stateAbbr, '->', stateName);
        return `${stateName}, USA`;
      }
    }
    
    console.log('No state found, using fallback: California, USA');
    return "California, USA";
  };

  const getLicensorState = () => {
    // Extract just the state from licensor address
    const address = license.licensor_address;
    console.log('=== PARSING ADDRESS FOR STATE ONLY ===');
    console.log('Raw address:', JSON.stringify(address));
    
    if (address) {
      // Clean up the address and split by comma
      const cleanAddress = address.replace(/\n/g, '').trim();
      const parts = cleanAddress.split(',').map(part => part.trim());
      
      console.log('Address parts:', parts);
      
      // Try multiple approaches to find state
      let stateAbbr = null;
      
      // Approach 1: Look for state in last part
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        const stateMatch = lastPart.match(/([A-Z]{2})\s*\d+/);
        if (stateMatch) {
          stateAbbr = stateMatch[1];
        }
      }
      
      // Approach 2: Look for any 2-letter state code
      if (!stateAbbr) {
        const fullText = cleanAddress.toUpperCase();
        const allStateMatches = fullText.match(/\b([A-Z]{2})\b/g);
        
        if (allStateMatches) {
          for (const match of allStateMatches) {
            if (getStateName(match) !== match) {
              stateAbbr = match;
              break;
            }
          }
        }
      }
      
      if (stateAbbr) {
        const stateName = getStateName(stateAbbr);
        console.log('Final state mapping:', stateAbbr, '->', stateName);
        return stateName;
      }
    }
    
    console.log('No state found, using fallback: California');
    return "California";
  };

  const getPaymentDueDate = () => {
    // Calculate 30 days from term start or use a placeholder
    if (license.term_start) {
      const termDate = new Date(license.term_start);
      termDate.setDate(termDate.getDate() + 30);
      return termDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return "-";
  };

  const getTerritory = () => {
    return license.territory_of_licensee || "-";
  };

  const getTerm = () => {
    return license.term_duration || "-";
  };

  const generateCreditLine = () => {
    if (copyrightData.length === 0) {
      return "-";
    }
    
    // Generate credit lines for each song
    const creditLines = copyrightData.map(copyright => {
      const writers = copyright.copyright_writers?.map((w: any) => w.writer_name).join(', ') || '-';
      const publishers = copyright.copyright_publishers?.map((p: any) => p.publisher_name).join(', ') || '-';
      return `"${copyright.work_title}" written by ${writers}, published by ${publishers}`;
    });
    
    return creditLines.join('<br>');
  };

  const generateExhibitTable = () => {
    if (copyrightData.length === 0) {
      // Default placeholder row with project title
      return `
        <tr>
          <td>${license.project_title || "Musical Work"}</td>
          <td>TBD</td>
          <td>${license.scene_duration_seconds ? `${license.scene_duration_seconds}s` : 'TBD'}</td>
          <td>Various Artists</td>
          <td>TBD</td>
          <td>Master Cleared</td>
          <td>${getTotalSyncFee()}</td>
        </tr>
      `;
    }
    
    // Generate rows for each copyright
    return copyrightData.map(copyright => {
      const writers = copyright.copyright_writers?.map((w: any) => w.writer_name).join(', ') || '-';
      const publishers = copyright.copyright_publishers?.map((p: any) => p.publisher_name).join(', ') || '-';
      const controlledWriters = copyright.copyright_writers?.filter((w: any) => w.controlled_status === 'C') || [];
      const controlledShare = controlledWriters.reduce((sum: number, w: any) => sum + (w.ownership_percentage || 0), 0);
      
      // Find the fee allocation for this copyright
      const feeAllocation = license.fee_allocations?.find((allocation: any) => allocation.copyrightId === copyright.id);
      const controlledAmount = feeAllocation ? formatCurrency(feeAllocation.controlledAmount) : '-';
      
      return `
        <tr>
          <td>${copyright.work_title}</td>
          <td>${copyright.iswc || '-'}</td>
          <td>${license.scene_duration_seconds ? `${license.scene_duration_seconds}s` : '-'}</td>
          <td>${writers}</td>
          <td>${controlledShare > 0 ? `${controlledShare}%` : '-'}</td>
          <td>Master Cleared</td>
          <td>${controlledAmount}</td>
        </tr>
      `;
    }).join('');
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Synchronization License Agreement - ${license.synch_id}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.4;
            margin: 0;
            padding: 30px 40px;
            font-size: 11pt;
            color: #000;
            max-width: 8.5in;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        .agreement-intro {
            text-align: justify;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 15px;
        }
        .section-content {
            text-align: justify;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        .indented-section {
            margin-left: 40px;
            margin-bottom: 15px;
        }
        .bullet-point {
            margin-bottom: 10px;
        }
        .usage-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .usage-table td {
            border: 1px solid #000;
            padding: 8px 12px;
            text-align: left;
        }
        .usage-table .label {
            background-color: #f8f8f8;
            font-weight: bold;
            width: 20%;
        }
        .exhibit-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .exhibit-table th,
        .exhibit-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 10pt;
        }
        .exhibit-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        .signature-block {
            margin-bottom: 40px;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin-bottom: 5px;
            display: inline-block;
        }
        .horizontal-rule {
            border-top: 1px solid #000;
            margin: 25px 0;
        }
        .page-break {
            page-break-before: always;
        }
        @media print {
            body { margin: 0.5in; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SYNCHRONIZATION LICENSE AGREEMENT</div>
    </div>

    <div class="agreement-intro">
        This Synchronization License Agreement ("Agreement") is made and entered into on 
        <strong>${formatDate(license.term_start)}</strong>, by and between <strong>${getLicensorInfo()}</strong>, 
        located at <strong>${getLicensorAddress()}</strong> ("Licensor"), and <strong>${getLicenseeInfo()}</strong>, 
        located at <strong>${getLicenseeAddress()}</strong> ("Licensee").
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">1. GRANT OF RIGHTS</div>
        <div class="section-content">
            Licensor hereby grants to Licensee a limited, non-exclusive, non-transferable, and 
            non-sublicensable right to synchronize the musical composition(s) listed in <strong>Exhibit A</strong> ("Works") 
            with the audiovisual production entitled:
        </div>
        <div class="indented-section">
            <strong>Project Title:</strong> ${license.project_title || "Project Title"}<br>
            <strong>Production Type:</strong> ${getProjectInfo().mediaType}<br>
            <strong>Episode/Season:</strong> ${getProjectInfo().episode}
        </div>
        <div class="section-content">
            This license is strictly limited to the following:
        </div>
        <div class="bullet-point">• <strong>Media:</strong> ${license.media_type || "Media Types: e.g., All Media, Online, Theatrical, etc."}</div>
        <div class="bullet-point">• <strong>Territory:</strong> ${getTerritory()}</div>
        <div class="bullet-point">• <strong>Term:</strong> ${getTerm()}</div>
        <div class="section-content">
            All rights not expressly granted herein are reserved by Licensor. Any additional use, including 
            promotional use, requires separate written authorization and may be subject to additional fees.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">2. LICENSE FEE AND PAYMENT TERMS</div>
        <div class="section-content">
            In consideration of the rights granted, Licensee shall pay Licensor a one-time, non-recoupable, 
            non-refundable fee of:
        </div>
        <div class="indented-section">
            <strong>Total License Fee:</strong> ${getTotalSyncFee()} USD<br>
            <strong>Due On or Before:</strong> ${getPaymentDueDate()}
        </div>
        <div class="bullet-point">• Payment must be made via wire to the account designated by Licensor.</div>
        <div class="bullet-point">• Failure to remit payment by the due date shall result in immediate revocation of the 
            license and shall constitute material breach.</div>
        <div class="bullet-point">• Licensor reserves the right to withhold delivery of assets until full payment is received.</div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">3. MUSIC USAGE DETAILS</div>
        <table class="usage-table">
            <tr>
                <td class="label">Use Type</td>
                <td>${getUsageType()}</td>
            </tr>
            <tr>
                <td class="label">Duration</td>
                <td>${getDuration()}</td>
            </tr>
            <tr>
                <td class="label">Scene Context</td>
                <td>${getSceneContext()}</td>
            </tr>
        </table>
        <div class="section-content">
            License is strictly limited to the use(s) described above. Any new edit, trailer, derivative, or 
            additional cut using the Works requires additional clearance and fee.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">4. RIGHTS REPRESENTATION & CLEARANCES</div>
        <div class="section-content">
            Licensor warrants that it controls the synchronization rights to the Works as listed in Exhibit A.
        </div>
        <div class="bullet-point">• <strong>Master rights are not included</strong> unless explicitly noted in Exhibit A.</div>
        <div class="bullet-point">• Licensee acknowledges that Licensor is not responsible for clearing any third-party 
            rights, including sound recordings not controlled by Licensor.</div>
        <div class="section-content">
            If Licensee uses a work not fully controlled by Licensor or fails to obtain separate master 
            clearance, <strong>Licensee bears full liability</strong>.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">5. CREDITS</div>
        <div class="section-content">
            Wherever credits are customarily provided, Licensee agrees to credit the song(s) as follows:
        </div>
        <div class="indented-section">
            ${generateCreditLine()}
        </div>
        <div class="section-content">
            Omission of credit will constitute a breach unless due to space constraints or format limitations.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">6. WARRANTIES, INDEMNIFICATION, AND LIMITATION OF LIABILITY</div>
        <div class="bullet-point">• Each party represents and warrants it has full authority to enter into this Agreement.</div>
        <div class="bullet-point">• Licensee shall indemnify, defend, and hold harmless Licensor (and its affiliated rights 
            holders) from any claims, damages, or liabilities arising out of:</div>
        <div class="indented-section">
            ○ Use of the Works beyond the licensed scope<br>
            ○ Failure to secure necessary clearances<br>
            ○ Breach of this Agreement
        </div>
        <div class="section-content">
            <strong>Licensor makes no warranties beyond those expressly stated herein.</strong> In no event shall 
            Licensor's liability exceed the license fee paid.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">7. AUDIT RIGHTS</div>
        <div class="section-content">
            Licensor shall have the right to audit Licensee's use of the Works, royalty statements (if 
            applicable), and documentation to verify compliance with this Agreement.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">8. TERMINATION & REVOCATION</div>
        <div class="section-content">
            Licensor may terminate this Agreement upon written notice if:
        </div>
        <div class="bullet-point">• Licensee fails to pay any amount due within 10 days of the payment deadline</div>
        <div class="bullet-point">• Licensee uses the Works beyond the agreed scope</div>
        <div class="bullet-point">• Licensee becomes insolvent or ceases operations</div>
        <div class="section-content">
            Upon termination, all rights granted revert to Licensor immediately and Licensee shall cease all 
            further use of the Works.
        </div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="section">
        <div class="section-title">9. MISCELLANEOUS</div>
        <div class="bullet-point">• This Agreement shall be governed by the laws of <strong>${getLicensorStateCountry()}</strong>.</div>
        <div class="bullet-point">• Any legal action shall be brought in the courts of <strong>${getLicensorState()}</strong>.</div>
        <div class="bullet-point">• This Agreement is the full and complete understanding between the parties and 
            supersedes any prior communications.</div>
        <div class="bullet-point">• Any changes must be in writing and signed by both parties.</div>
    </div>

    <div class="horizontal-rule"></div>

    <div class="signature-section">
        <div class="section-content">
            <strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement as of the 
            date first written above.
        </div>
        
        <div class="signature-block">
            <strong>LICENSOR</strong><br><br>
            <strong>${getLicensorInfo()}</strong><br>
            By: <span class="signature-line"></span><br>
            Name: <strong>${license.signatory_name || "Authorized Rep Name"}</strong><br>
            Title: <strong>${license.signatory_title || "Title"}</strong><br>
            Date: <span class="signature-line"></span>
        </div>
        
        <div class="signature-block">
            <strong>LICENSEE</strong><br><br>
            <strong>${getLicenseeInfo()}</strong><br>
            By: <span class="signature-line"></span><br>
            Name: <strong>${license.licensee_name || "Authorized Rep Name"}</strong><br>
            Title: <strong></strong><br>
            Date: <span class="signature-line"></span>
        </div>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">EXHIBIT A – LICENSED WORKS</div>
        <table class="exhibit-table">
            <thead>
                <tr>
                    <th>Song Title</th>
                    <th>ISWC</th>
                    <th>Duration</th>
                    <th>Writers</th>
                    <th>Controlled Share</th>
                    <th>Master Cleared</th>
                    <th>Controlled Amount</th>
                </tr>
            </thead>
            <tbody>
                ${generateExhibitTable()}
            </tbody>
        </table>
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

  console.log('=== PDF GENERATION STARTED ===');
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

    // Use the professional sync license template with contract module language
    console.log('Generating professional sync license agreement...');
    const htmlContent = await generateProfessionalSyncLicense(license, supabase);
    console.log('Template generation completed:', {
      contentLength: htmlContent.length,
      hasContent: htmlContent.includes('<body>'),
      bodyHasContent: htmlContent.match(/<body[^>]*>(.*?)<\/body>/s)?.[1]?.trim().length > 0
    });

    // Return a blob URL for download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

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