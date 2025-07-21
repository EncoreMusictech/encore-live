
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
      .maybeSingle();

    if (contractError) {
      throw new Error(`Database error: ${contractError.message}`);
    }

    if (!contract) {
      throw new Error('Contract not found');
    }

    console.log('Generating Publishing Agreement PDF for contract:', contract.title);

    // Extract agreement type from contract data
    const agreementType = contract.contract_data?.agreement_type || 'administration';
    
    // Generate agreement-specific HTML content
    const htmlContent = generatePublishingAgreementHTML(contract, agreementType);

    // Generate PDF-like content (in production, use proper PDF library)
    const pdfContent = await generatePublishingPDF(htmlContent, contract);

    // Update contract with generated PDF URL
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
  const contractData = contract.contract_data || {};
  
  // Get first interested party as Rights Owner
  const rightsOwner = contract.contract_interested_parties?.find((party: any) => 
    party.party_type === 'writer' || party.party_type === 'songwriter'
  ) || contract.contract_interested_parties?.[0];
  
  // Use actual contract data instead of placeholders
  const effectiveDate = contract.start_date ? 
    new Date(contract.start_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
  const endDate = contract.end_date ? 
    new Date(contract.end_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'December 31, 2026';

  const tailPeriod = contractData.tail_period_months || '6 months';
  const territories = contract.territories && contract.territories.length > 0 
    ? contract.territories.join(', ') 
    : 'United States, Canada, United Kingdom';
  const adminFee = (contractData.admin_fee_percentage || contract.commission_percentage || '15').toString().replace('%', '');
  const controlledShare = (contractData.admin_controlled_share || contract.controlled_percentage || '100').toString().replace('%', '');
  const approvalThreshold = contractData.approval_threshold || '50,000';
  const approvalType = contractData.approval_type || 'Pre-approved';
  const paymentTerms = contractData.payment_terms_days || '60';
  const minimumThreshold = contractData.minimum_payment_threshold || '100';
  const disputePeriod = contractData.statement_dispute_period_months || '12 months';
  const governingLaw = contractData.governing_law || 'New York';
  const disputeResolution = contractData.dispute_resolution_method || 'Mediation followed by Arbitration';
  
  // Administrator data
  const administratorName = contract.counterparty_name || 'Encore Music Publishing';
  const administratorAddress = contract.contact_address || '123 Music Row, Nashville, TN 37203';
  const administratorEmail = contract.recipient_email || 'admin@encoremusic.tech';
  
  // Rights Owner data
  const rightsOwnerName = rightsOwner?.name || contract.counterparty_name || 'Artist/Songwriter';
  const rightsOwnerAddress = rightsOwner?.address || '456 Writer Lane, Los Angeles, CA 90210';
  const rightsOwnerEmail = rightsOwner?.email || 'artist@example.com';
  
  // Delivery requirement data - check contract_data for delivery requirements
  const deliveryReqs = contractData.delivery_requirements || [];
  const metadataDelivered = deliveryReqs.includes('Metadata') ? 'Yes' : 'No';
  const workRegistrationDelivered = deliveryReqs.includes('Work Registration') ? 'Yes' : 'No';
  const leadSheetsDelivered = deliveryReqs.includes('Lead Sheets') ? 'Yes' : 'No';
  const soundFilesDelivered = deliveryReqs.includes('Sound Files') ? 'Yes' : 'No';
  const lyricsDelivered = deliveryReqs.includes('Lyrics') ? 'Yes' : 'No';
  const mastersDelivered = deliveryReqs.includes('Masters') ? 'Yes' : 'No';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.title}</title>
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.6; 
          margin: 40px; 
          font-size: 12pt;
          color: #000;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px;
        }
        .agreement-title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .section { 
          margin: 30px 0; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 14pt; 
          font-weight: bold; 
          margin: 30px 0 15px 0; 
          color: #000; 
        }
        .section-content {
          margin: 15px 0;
          text-align: justify;
          line-height: 1.8;
        }
        .party-section { 
          margin: 20px 0; 
          line-height: 1.8;
        }
        .divider {
          border-bottom: 1px solid #000;
          margin: 30px 0;
          width: 100%;
        }
        .bullet-point {
          margin: 10px 0;
          padding-left: 20px;
        }
        .sub-bullet {
          margin: 8px 0;
          padding-left: 40px;
        }
        .signature-section { 
          margin-top: 60px; 
          page-break-inside: avoid;
        }
        .signature-block { 
          margin: 40px 0; 
        }
        .signature-line { 
          border-bottom: 1px solid #000; 
          width: 300px; 
          margin: 20px 0 5px 0; 
          height: 1px;
          display: inline-block;
        }
        .exhibit-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border: 1px solid #000;
        }
        .exhibit-table th,
        .exhibit-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-size: 10pt;
        }
        .exhibit-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        .bold { font-weight: bold; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="agreement-title">PUBLISHING ADMINISTRATION AGREEMENT</div>
      </div>

      <div class="section-content">
        This Publishing Administration Agreement ("<strong>Agreement</strong>") is made and entered into as of
        <strong>${effectiveDate}</strong>, by and between:
      </div>

      <div class="party-section">
        <strong>Administrator:</strong><br>
        <strong>${administratorName}</strong><br>
        ${administratorAddress}<br>
        ${administratorEmail}<br>
        ("<strong>Administrator</strong>")
      </div>

      <div class="party-section">
        and
      </div>

      <div class="party-section">
        <strong>Original Publisher / Rights Owner:</strong><br>
        <strong>${rightsOwnerName}</strong><br>
        ${rightsOwnerAddress}<br>
        ${rightsOwnerEmail}<br>
        ("<strong>Rights Owner</strong>")
      </div>

      <div class="section-content">
        Administrator and Rights Owner may each be referred to individually as a "<strong>Party</strong>" and 
        collectively as the "<strong>Parties</strong>."
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">1. Purpose</div>
        <div class="section-content">
          This Agreement sets forth the terms under which Administrator will exclusively administer 
          certain musical compositions owned or controlled by Rights Owner ("<strong>Works</strong>"), as listed in 
          <em>Exhibit A</em>, throughout the designated Territory and Term.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">2. Term</div>
        <div class="section-content">
          This Agreement shall be effective as of <strong>${effectiveDate}</strong> and shall continue until <strong>${endDate}</strong>, 
          unless earlier terminated in accordance with Section 10.<br><br>
          The Administrator shall be entitled to continue collecting on licenses entered during the 
          Term for a tail period of <strong>${tailPeriod}</strong> following termination.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">3. Territory</div>
        <div class="section-content">
          The Territory for this Agreement shall include the following jurisdictions:<br>
          <strong>${territories}</strong>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">4. Rights Granted</div>
        <div class="section-content">
          Rights Owner hereby grants Administrator the sole and exclusive right to:
        </div>
        <div class="bullet-point">
          • Register, administer, and license the Works for:
          <div class="sub-bullet">○ Synchronization</div>
          <div class="sub-bullet">○ Mechanical reproduction</div>
          <div class="sub-bullet">○ Print publication</div>
          <div class="sub-bullet">○ Digital and streaming platforms</div>
          <div class="sub-bullet">○ Any other monetizable use of the Works</div>
        </div>
        <div class="bullet-point">
          • Collect and disburse royalties for said uses
        </div>
        <div class="bullet-point">
          • Enter into subpublishing agreements as necessary
        </div>
        <div class="section-content" style="margin-top: 20px;">
          Administrator shall have the right to enforce rights and collect retroactive royalties where applicable.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">5. Administration Fee</div>
        <div class="section-content">
          Administrator shall retain a commission of <strong>${adminFee}%</strong> of all gross revenue 
          received in connection with the Works during the Term and Tail Period.<br><br>
          The balance, after deduction of the administration fee and any authorized expenses, shall be 
          remitted to the Rights Owner.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">6. Controlled Share</div>
        <div class="section-content">
          Rights Owner confirms that Administrator shall administer <strong>${controlledShare}%</strong> of the Rights Owner's 
          controlled share in the Works listed under this Agreement.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">7. Approval Rights</div>
        <div class="section-content">
          Unless otherwise agreed in writing:
        </div>
        <div class="bullet-point">
          • All licenses for fees under <strong>$${approvalThreshold}</strong> USD shall be 
          deemed <strong>pre-approved</strong>
        </div>
        <div class="bullet-point">
          • For licenses exceeding that threshold or involving sensitive use categories (e.g., 
          political, tobacco, alcohol), Administrator shall obtain Rights Owner's prior written consent.
        </div>
        <div class="section-content" style="margin-top: 20px;">
          Approval Type: <strong>${approvalType}</strong>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">8. Delivery Requirements</div>
        <div class="section-content">
          Rights Owner agrees to deliver, for each Work covered under this Agreement:
        </div>
        <div class="bullet-point">• ${metadataDelivered === 'Yes' ? '☑' : '☐'} Metadata (${metadataDelivered})</div>
        <div class="bullet-point">• ${workRegistrationDelivered === 'Yes' ? '☑' : '☐'} Work Registration (${workRegistrationDelivered})</div>
        <div class="bullet-point">• ${leadSheetsDelivered === 'Yes' ? '☑' : '☐'} Lead Sheets (${leadSheetsDelivered})</div>
        <div class="bullet-point">• ${soundFilesDelivered === 'Yes' ? '☑' : '☐'} Sound Files (${soundFilesDelivered})</div>
        <div class="bullet-point">• ${lyricsDelivered === 'Yes' ? '☑' : '☐'} Lyrics (${lyricsDelivered})</div>
        <div class="bullet-point">• ${mastersDelivered === 'Yes' ? '☑' : '☐'} Masters (${mastersDelivered})</div>
        <div class="section-content" style="margin-top: 20px;">
          Failure to provide delivery materials may delay royalty collection and registration obligations.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">9. Warranties and Representations</div>
        <div class="section-content">
          Each Party represents and warrants that:
        </div>
        <div class="bullet-point">
          • It has full authority and legal capacity to enter into and perform under this Agreement
        </div>
        <div class="bullet-point">
          • The Works are original and do not infringe on the rights of any third party
        </div>
        <div class="bullet-point">
          • No prior agreements exist that would conflict with the rights granted herein
        </div>
        <div class="section-content" style="margin-top: 20px;">
          Rights Owner agrees to indemnify Administrator against any third-party claims arising from 
          a breach of the foregoing warranties.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">10. Termination</div>
        <div class="section-content">
          This Agreement may be terminated:
        </div>
        <div class="bullet-point">
          • Upon <strong>30 days' written notice</strong> for material breach not cured within the notice period
        </div>
        <div class="bullet-point">
          • Immediately upon bankruptcy, insolvency, or illegal activity of either Party
        </div>
        <div class="section-content" style="margin-top: 20px;">
          Termination shall not affect Administrator's right to collect on pre-Term licenses for the 
          duration of the Tail Period.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">11. Accounting & Payment</div>
        <div class="bullet-point">
          • Administrator shall provide royalty statements on a <strong>quarterly</strong> basis
        </div>
        <div class="bullet-point">
          • Payments shall be made in USD within <strong>${paymentTerms}</strong> days after statement issuance
        </div>
        <div class="bullet-point">
          • No payment shall be due unless the accrued balance exceeds <strong>${minimumThreshold}</strong>
        </div>
        <div class="bullet-point">
          • All statements shall be final unless challenged within <strong>${disputePeriod}</strong> of issuance
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">12. Governing Law</div>
        <div class="section-content">
          This Agreement shall be governed by and construed in accordance with the laws of the <strong>State of ${governingLaw}</strong>.<br>
          Any disputes shall be resolved through <strong>${disputeResolution}</strong> in the chosen jurisdiction.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">13. Entire Agreement</div>
        <div class="section-content">
          This Agreement contains the entire understanding of the Parties and supersedes any prior 
          or contemporaneous agreements or understandings.<br>
          Any amendments must be made in writing and signed by both Parties.
        </div>
      </div>

      <div class="divider"></div>

      <div class="signature-section">
        <div class="section-title center">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first above written.</div>
        
        <div class="divider"></div>

        <div class="signature-block">
          <strong>ADMINISTRATOR</strong><br>
          Signature: <div class="signature-line"></div><br>
          Name:<br>
          Title:<br>
          Date:
        </div>

        <div class="signature-block">
          <strong>RIGHTS OWNER</strong><br>
          Signature: <div class="signature-line"></div><br>
          Name:<br>
          Title:<br>
          Date:
        </div>

        <div class="divider"></div>
      </div>

      ${generateExhibitA(contract)}
    </body>
    </html>
  `;
}

function generateExhibitA(contract: any): string {
  const works = contract.contract_schedule_works || [];
  const parties = contract.contract_interested_parties || [];
  
  if (works.length === 0) {
    // If no works are defined, show example data
    return `
      <div class="section">
        <div class="section-title center">Exhibit A – Schedule of Works</div>
        <table class="exhibit-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Writers & Splits</th>
              <th>Publishers & Splits</th>
              <th>Controlled Share</th>
              <th>ISWC</th>
              <th>IPI Numbers (W/P)</th>
              <th>Registration Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Shake It Off</td>
              <td>Taylor Swift (100%)</td>
              <td>Swift Music Publishing (100%)</td>
              <td>100%</td>
              <td>T-911.471.758-8</td>
              <td>00014107338</td>
              <td>Registered</td>
            </tr>
            <tr>
              <td>Blank Space</td>
              <td>Taylor Swift (80%), Max Martin (20%)</td>
              <td>Swift Music Publishing (80%), MXM Publishing (20%)</td>
              <td>80%</td>
              <td>T-911.471.759-9</td>
              <td>00014107338, 00014107945</td>
              <td>Registered</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const worksRows = works.map((work: any) => {
    // Get writers for this work
    const workWriters = parties.filter((party: any) => 
      party.party_type === 'writer' || party.party_type === 'songwriter'
    );
    
    const writersText = workWriters.length > 0 
      ? workWriters.map((writer: any) => 
          `${writer.name} (${writer.performance_percentage || writer.ownership_percentage || 0}%)`
        ).join(', ')
      : 'Various Writers (100%)';

    const publishersText = parties.filter((party: any) => 
      party.party_type === 'publisher'
    ).map((pub: any) => 
      `${pub.name} (${pub.performance_percentage || pub.ownership_percentage || 0}%)`
    ).join(', ') || 'Swift Music Publishing LLC (100%)';

    const controlledShare = workWriters.reduce((sum: number, writer: any) => 
      sum + (writer.controlled_status === 'C' ? (writer.performance_percentage || writer.ownership_percentage || 0) : 0), 0
    );

    return `
      <tr>
        <td><strong>${work.song_title}</strong></td>
        <td>${writersText}</td>
        <td>${publishersText}</td>
        <td>${controlledShare || 100}%</td>
        <td>${work.iswc || 'T-911.471.758-8'}</td>
        <td>${work.work_id || workWriters.map(w => w.ipi_number || '00014107338').join(', ') || '00014107338'}</td>
        <td>${work.registration_status || 'Registered'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section">
      <div class="section-title center">Exhibit A – Schedule of Works</div>
      <table class="exhibit-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Writers & Splits</th>
            <th>Publishers & Splits</th>
            <th>Controlled Share</th>
            <th>ISWC</th>
            <th>IPI Numbers (W/P)</th>
            <th>Registration Status</th>
          </tr>
        </thead>
        <tbody>
          ${worksRows}
        </tbody>
      </table>
    </div>
  `;
}

async function generatePublishingPDF(htmlContent: string, contract: any): Promise<string> {
  // This is a simplified PDF representation for demo purposes
  // In production, you would use a proper PDF generation library like Puppeteer or jsPDF
  
  const pdfMetadata = {
    title: contract.title,
    author: "Publishing Management System",
    subject: "Publishing Administration Agreement",
    creator: "Encore Music Platform",
    creationDate: new Date().toISOString(),
    pages: 1
  };

  // Return HTML content for now (in production, convert to actual PDF)
  return htmlContent;
}
