import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error('Contract ID is required');
    }

    // Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        contract_interested_parties(*),
        contract_schedule_works(*)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    console.log('Generating Publishing Agreement PDF for contract:', contract.title);

    // Extract agreement type from contract data
    const agreementType = contract.contract_data?.agreement_type || 'administration';
    
    // Generate agreement-specific HTML content
    const htmlContent = generatePublishingAgreementHTML(contract, agreementType);

    // Generate PDF-like content (in production, use proper PDF library)
    const pdfContent = await generatePublishingPDF(htmlContent, contract);

    // Update contract with generated PDF URL (in production, this would be a storage URL)
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        generated_pdf_url: `publishing-agreement-${contractId}.pdf`,
        signature_status: 'ready_for_signature'
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Failed to update contract with PDF URL:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      contractId: contractId,
      contractTitle: contract.title,
      agreementType: agreementType,
      pdfData: pdfContent,
      downloadUrl: `publishing-agreement-${contractId}.pdf`,
      signatureReady: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-publishing-agreement-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generatePublishingAgreementHTML(contract: any, agreementType: string): string {
  const currentDate = new Date().toLocaleDateString();
  const contractData = contract.contract_data || {};
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.title}</title>
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.8; 
          margin: 40px; 
          font-size: 12pt;
          color: #000;
        }
        .header { 
          text-align: center; 
          margin-bottom: 50px; 
          border-bottom: 3px solid #000; 
          padding-bottom: 30px; 
        }
        .agreement-title {
          font-size: 20pt;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .section { 
          margin: 40px 0; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 14pt; 
          font-weight: bold; 
          margin-bottom: 20px; 
          color: #000; 
          text-transform: uppercase;
          border-bottom: 1px solid #000; 
          padding-bottom: 8px; 
        }
        .subsection {
          margin: 25px 0;
          padding-left: 20px;
        }
        .clause {
          margin: 15px 0;
          text-align: justify;
          text-indent: 20px;
        }
        .party-info { 
          margin: 25px 0; 
          padding: 20px; 
          border: 2px solid #000; 
          background-color: #f9f9f9;
        }
        .financial-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 30px; 
          margin: 30px 0; 
        }
        .term-box { 
          padding: 15px; 
          border: 1px solid #000; 
          background-color: #fff;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0; 
          border: 2px solid #000;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 12px; 
          text-align: left; 
          vertical-align: top;
        }
        th { 
          background-color: #e9e9e9; 
          font-weight: bold; 
          text-align: center;
        }
        .signature-section { 
          margin-top: 80px; 
          page-break-inside: avoid;
        }
        .signature-block { 
          margin: 50px 0; 
          border: 1px solid #000;
          padding: 30px;
        }
        .signature-line { 
          border-bottom: 2px solid #000; 
          width: 400px; 
          margin: 25px 0; 
          height: 2px;
        }
        .footer { 
          margin-top: 60px; 
          font-size: 10pt; 
          color: #666; 
          text-align: center; 
          border-top: 1px solid #ccc;
          padding-top: 20px;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72pt;
          color: rgba(0,0,0,0.05);
          z-index: -1;
          pointer-events: none;
        }
        .page-number {
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 10pt;
        }
      </style>
    </head>
    <body>
      <div class="watermark">DRAFT</div>
      
      <div class="header">
        <div class="agreement-title">${getAgreementTypeTitle(agreementType)}</div>
        <h2>${contract.title}</h2>
        <p><strong>Agreement Date:</strong> ${currentDate}</p>
        <p><strong>Agreement ID:</strong> ${contract.agreement_id || generateAgreementId()}</p>
        <p><strong>Status:</strong> ${contract.contract_status?.toUpperCase() || 'DRAFT'}</p>
      </div>

      <div class="section">
        <div class="section-title">Article I - Parties</div>
        <div class="clause">
          This ${getAgreementTypeTitle(agreementType)} ("Agreement") is entered into on ${currentDate}, 
          between <strong>${contract.counterparty_name}</strong> ("Publisher") and the Writer(s) 
          listed in the Schedule of Interested Parties below.
        </div>
        
        <div class="party-info">
          <strong>PUBLISHER/ADMINISTRATOR:</strong><br>
          Company: ${contract.counterparty_name}<br>
          ${contract.contact_address ? `Address: ${contract.contact_address}<br>` : ''}
          ${contract.contact_phone ? `Phone: ${contract.contact_phone}<br>` : ''}
          ${contract.recipient_email ? `Email: ${contract.recipient_email}<br>` : ''}
          ${contract.contact_name ? `Contact: ${contract.contact_name}` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Article II - Term and Territory</div>
        <div class="clause">
          <strong>Effective Date:</strong> ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}<br>
          <strong>Termination Date:</strong> ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Perpetual/To be determined'}<br>
          <strong>Territory:</strong> ${contract.territories && contract.territories.length > 0 ? contract.territories.join(', ') : 'Worldwide'}<br>
          ${contractData.governing_law ? `<strong>Governing Law:</strong> ${contractData.governing_law}` : ''}
        </div>
      </div>

      ${generateAgreementSpecificTerms(agreementType, contract, contractData)}

      ${contract.contract_interested_parties && contract.contract_interested_parties.length > 0 ? `
      <div class="section">
        <div class="section-title">Article IV - Interested Parties and Royalty Splits</div>
        <table>
          <thead>
            <tr>
              <th>Party Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Performance %</th>
              <th>Mechanical %</th>
              <th>Sync %</th>
              <th>Print %</th>
            </tr>
          </thead>
          <tbody>
            ${contract.contract_interested_parties.map((party: any) => `
            <tr>
              <td><strong>${party.name}</strong></td>
              <td>${formatPartyType(party.party_type)}</td>
              <td>${party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}</td>
              <td>${party.performance_percentage || 0}%</td>
              <td>${party.mechanical_percentage || 0}%</td>
              <td>${party.synch_percentage || 0}%</td>
              <td>${party.print_percentage || 0}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${contract.contract_schedule_works && contract.contract_schedule_works.length > 0 ? `
      <div class="section">
        <div class="section-title">Article V - Schedule of Works</div>
        <div class="clause">
          The following musical compositions are subject to this Agreement:
        </div>
        <table>
          <thead>
            <tr>
              <th>Song Title</th>
              <th>Artist/Performer</th>
              <th>Work ID</th>
              <th>ISWC</th>
              <th>ISRC</th>
              <th>Album</th>
            </tr>
          </thead>
          <tbody>
            ${contract.contract_schedule_works.map((work: any) => `
            <tr>
              <td><strong>${work.song_title}</strong></td>
              <td>${work.artist_name || 'Various'}</td>
              <td>${work.work_id || 'TBD'}</td>
              <td>${work.iswc || 'TBD'}</td>
              <td>${work.isrc || 'TBD'}</td>
              <td>${work.album_title || 'N/A'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Article VI - General Terms and Conditions</div>
        <div class="subsection">
          <div class="clause">
            <strong>6.1 Rights Granted:</strong> Subject to the terms and conditions herein, 
            Writer grants to Publisher the rights specified in Article III above for the 
            musical works listed in the Schedule of Works.
          </div>
          <div class="clause">
            <strong>6.2 Accounting:</strong> Publisher shall provide statements and payments 
            according to the distribution cycle specified: ${contract.distribution_cycle || 'quarterly'}.
          </div>
          <div class="clause">
            <strong>6.3 Audit Rights:</strong> Writer shall have the right to audit Publisher's 
            books and records relating to this Agreement upon thirty (30) days written notice.
          </div>
          <div class="clause">
            <strong>6.4 Termination:</strong> This Agreement may be terminated by either party 
            upon material breach that remains uncured after thirty (30) days written notice.
          </div>
          ${contractData.approvals_required ? `
          <div class="clause">
            <strong>6.5 Approval Requirements:</strong> ${contractData.approval_conditions || 'Certain uses require prior written approval.'}
          </div>
          ` : ''}
        </div>
      </div>

      ${contract.notes ? `
      <div class="section">
        <div class="section-title">Article VII - Additional Terms</div>
        <div class="clause">${contract.notes}</div>
      </div>
      ` : ''}

      <div class="signature-section">
        <div class="section-title">Signatures</div>
        
        <div class="signature-block">
          <strong>PUBLISHER:</strong><br>
          ${contract.counterparty_name}<br><br>
          
          By: <div class="signature-line"></div>
          Name: _________________________________<br>
          Title: _________________________________<br>
          Date: _________________________________
        </div>

        <div class="signature-block">
          <strong>WRITER(S):</strong><br><br>
          
          By: <div class="signature-line"></div>
          Name: _________________________________<br>
          Address: _________________________________<br>
          Date: _________________________________
        </div>
      </div>

      <div class="footer">
        <p>This ${getAgreementTypeTitle(agreementType)} is governed by the laws of ${contractData.governing_law || 'the applicable jurisdiction'}.</p>
        <p>Generated on ${currentDate} | Agreement ID: ${contract.agreement_id || generateAgreementId()}</p>
        <p>Page 1 of 1</p>
      </div>
    </body>
    </html>
  `;
}

function getAgreementTypeTitle(type: string): string {
  const titles = {
    administration: "ADMINISTRATION AGREEMENT",
    co_publishing: "CO-PUBLISHING AGREEMENT",
    exclusive_songwriter: "EXCLUSIVE SONGWRITER AGREEMENT",
    catalog_acquisition: "CATALOG ACQUISITION AGREEMENT"
  };
  return titles[type as keyof typeof titles] || "PUBLISHING AGREEMENT";
}

function generateAgreementSpecificTerms(agreementType: string, contract: any, contractData: any): string {
  switch (agreementType) {
    case 'administration':
      return generateAdminTerms(contract, contractData);
    case 'co_publishing':
      return generateCoPublishingTerms(contract, contractData);
    case 'exclusive_songwriter':
      return generateExclusiveTerms(contract, contractData);
    case 'catalog_acquisition':
      return generateAcquisitionTerms(contract, contractData);
    default:
      return generateGeneralTerms(contract, contractData);
  }
}

function generateAdminTerms(contract: any, contractData: any): string {
  return `
    <div class="section">
      <div class="section-title">Article III - Administration Terms</div>
      <div class="financial-grid">
        ${contractData.admin_fee_percentage ? `
        <div class="term-box">
          <strong>Administration Fee:</strong><br>
          ${contractData.admin_fee_percentage}% of gross receipts
        </div>
        ` : ''}
        ${contractData.admin_controlled_share ? `
        <div class="term-box">
          <strong>Controlled Share:</strong><br>
          ${contractData.admin_controlled_share}% administration
        </div>
        ` : ''}
        ${contractData.approval_rights ? `
        <div class="term-box">
          <strong>Approval Rights:</strong><br>
          ${formatApprovalRights(contractData.approval_rights)}
        </div>
        ` : ''}
        ${contractData.tail_period_months ? `
        <div class="term-box">
          <strong>Tail Period:</strong><br>
          ${contractData.tail_period_months} months after termination
        </div>
        ` : ''}
      </div>
      
      ${contractData.admin_rights && contractData.admin_rights.length > 0 ? `
      <div class="subsection">
        <strong>Administrative Rights Granted:</strong><br>
        ${contractData.admin_rights.map((right: string) => `• ${right}`).join('<br>')}
      </div>
      ` : ''}
      
      ${contractData.reversion_conditions ? `
      <div class="subsection">
        <strong>Reversion Conditions:</strong><br>
        ${contractData.reversion_conditions}
      </div>
      ` : ''}
    </div>
  `;
}

function generateCoPublishingTerms(contract: any, contractData: any): string {
  return `
    <div class="section">
      <div class="section-title">Article III - Co-Publishing Terms</div>
      <div class="financial-grid">
        ${contractData.publisher_share_percentage ? `
        <div class="term-box">
          <strong>Publisher Share:</strong><br>
          ${contractData.publisher_share_percentage}% of publisher's share
        </div>
        ` : ''}
        ${contractData.writer_share_percentage ? `
        <div class="term-box">
          <strong>Writer Share:</strong><br>
          ${contractData.writer_share_percentage}% retained by writer
        </div>
        ` : ''}
        ${contractData.advance_amount ? `
        <div class="term-box">
          <strong>Advance:</strong><br>
          $${contractData.advance_amount.toLocaleString()}
          ${contractData.recoupable ? ' (Recoupable)' : ' (Non-recoupable)'}
        </div>
        ` : ''}
        ${contractData.delivery_commitment ? `
        <div class="term-box">
          <strong>Delivery Commitment:</strong><br>
          ${contractData.delivery_commitment} songs per year
        </div>
        ` : ''}
      </div>
      
      <div class="subsection">
        <strong>Revenue Splits:</strong><br>
        ${contractData.sync_revenue_split ? `Sync: ${contractData.sync_revenue_split}% to Publisher<br>` : ''}
        ${contractData.print_revenue_split ? `Print: ${contractData.print_revenue_split}% to Publisher<br>` : ''}
        ${contractData.mechanical_revenue_split ? `Mechanical: ${contractData.mechanical_revenue_split}% to Publisher<br>` : ''}
      </div>
      
      <div class="subsection">
        <strong>Additional Terms:</strong><br>
        Exclusivity: ${contractData.exclusivity ? 'Yes' : 'No'}<br>
        Option Periods: ${contractData.option_periods ? 'Yes' : 'No'}
      </div>
    </div>
  `;
}

function generateExclusiveTerms(contract: any, contractData: any): string {
  return `
    <div class="section">
      <div class="section-title">Article III - Exclusive Songwriter Terms</div>
      <div class="clause">
        <strong>Exclusivity:</strong> Writer agrees to provide exclusive songwriting services to Publisher 
        during the term of this Agreement.
      </div>
      
      <div class="financial-grid">
        ${contractData.advance_amount ? `
        <div class="term-box">
          <strong>Advance:</strong><br>
          $${contractData.advance_amount.toLocaleString()}
          ${contractData.recoupable ? ' (Recoupable against royalties)' : ''}
        </div>
        ` : ''}
        ${contractData.delivery_requirement ? `
        <div class="term-box">
          <strong>Delivery Requirement:</strong><br>
          ${contractData.delivery_requirement} acceptable songs per year
        </div>
        ` : ''}
        ${contractData.mechanical_royalty_rate ? `
        <div class="term-box">
          <strong>Mechanical Royalty:</strong><br>
          ${contractData.mechanical_royalty_rate}% to Writer
        </div>
        ` : ''}
        ${contractData.sync_royalty_rate ? `
        <div class="term-box">
          <strong>Sync Royalty:</strong><br>
          ${contractData.sync_royalty_rate}% to Writer
        </div>
        ` : ''}
      </div>
      
      ${contractData.exclusivity_period_start && contractData.exclusivity_period_end ? `
      <div class="subsection">
        <strong>Exclusivity Period:</strong><br>
        From ${new Date(contractData.exclusivity_period_start).toLocaleDateString()} 
        to ${new Date(contractData.exclusivity_period_end).toLocaleDateString()}
      </div>
      ` : ''}
      
      <div class="subsection">
        <strong>Renewal Options:</strong> ${contractData.renewal_options ? 'Publisher has options to renew' : 'No automatic renewal'}
      </div>
    </div>
  `;
}

function generateAcquisitionTerms(contract: any, contractData: any): string {
  return `
    <div class="section">
      <div class="section-title">Article III - Catalog Acquisition Terms</div>
      <div class="financial-grid">
        ${contractData.acquisition_price ? `
        <div class="term-box">
          <strong>Purchase Price:</strong><br>
          $${contractData.acquisition_price.toLocaleString()}
        </div>
        ` : ''}
        ${contractData.rights_acquired ? `
        <div class="term-box">
          <strong>Rights Acquired:</strong><br>
          ${formatRightsAcquired(contractData.rights_acquired)}
        </div>
        ` : ''}
        ${contractData.royalty_override_to_seller ? `
        <div class="term-box">
          <strong>Seller Override:</strong><br>
          ${contractData.royalty_override_to_seller}% ongoing royalty to Seller
        </div>
        ` : ''}
        ${contractData.tail_period_months ? `
        <div class="term-box">
          <strong>Tail Period:</strong><br>
          ${contractData.tail_period_months} months
        </div>
        ` : ''}
      </div>
      
      <div class="subsection">
        <strong>Rights Type:</strong> ${contractData.perpetual_rights ? 'Perpetual' : 'Term-limited'}<br>
        ${contractData.acquired_work_list_url ? `<strong>Work List:</strong> Available at ${contractData.acquired_work_list_url}<br>` : ''}
      </div>
      
      ${contractData.reversion_clause ? `
      <div class="subsection">
        <strong>Reversion Clause:</strong><br>
        ${contractData.reversion_clause}
      </div>
      ` : ''}
      
      ${contractData.original_publisher_participation ? `
      <div class="subsection">
        <strong>Original Publisher Participation:</strong><br>
        ${contractData.original_publisher_participation}
      </div>
      ` : ''}
    </div>
  `;
}

function generateGeneralTerms(contract: any, contractData: any): string {
  return `
    <div class="section">
      <div class="section-title">Article III - Publishing Terms</div>
      <div class="financial-grid">
        ${contract.advance_amount > 0 ? `
        <div class="term-box">
          <strong>Advance Amount:</strong><br>
          $${contract.advance_amount.toLocaleString()}
        </div>
        ` : ''}
        ${contract.commission_percentage > 0 ? `
        <div class="term-box">
          <strong>Commission Rate:</strong><br>
          ${contract.commission_percentage}%
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function formatPartyType(type: string): string {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatApprovalRights(rights: string): string {
  const formatMap = {
    'pre_approved': 'Pre-approved for standard uses',
    'must_approve_syncs': 'Must approve sync licenses',
    'must_approve_all': 'Must approve all uses',
    'consultation_only': 'Consultation only'
  };
  return formatMap[rights as keyof typeof formatMap] || rights;
}

function formatRightsAcquired(rights: string): string {
  const formatMap = {
    '100_percent': '100% Publishing Rights',
    'partial': 'Partial Publishing Rights',
    'admin_only': 'Administration Rights Only',
    'masters_and_publishing': 'Masters & Publishing Rights'
  };
  return formatMap[rights as keyof typeof formatMap] || rights;
}

function generateAgreementId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AGR-${year}${month}${day}-${random}`;
}

async function generatePublishingPDF(htmlContent: string, contract: any): Promise<string> {
  // This is a simplified PDF representation for demo purposes
  // In production, you would use a proper PDF generation library like Puppeteer or jsPDF
  
  const pdfMetadata = {
    title: contract.title,
    author: "Publishing Management System",
    subject: `${getAgreementTypeTitle(contract.contract_data?.agreement_type || 'administration')}`,
    creator: "Encore Music Platform",
    creationDate: new Date().toISOString(),
    pages: 1
  };

  // Return HTML content for now (in production, convert to actual PDF)
  return htmlContent;
}