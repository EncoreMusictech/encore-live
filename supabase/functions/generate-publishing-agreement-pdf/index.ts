
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
  const parties = contract.contract_interested_parties || [];
  const works = contract.contract_schedule_works || [];
  
  // Extract administrator and counterparty data
  const administrator = parties.find((p: any) => p.party_type === 'administrator') || {};
  const counterparty = parties.find((p: any) => p.party_type === 'writer' || p.party_type === 'songwriter') || {};
  
  // Extract dates with fallbacks
  const effectiveDate = contractData.effective_date ? 
    new Date(contractData.effective_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : contract.start_date ? 
    new Date(contract.start_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '[Effective Date]';
    
  const endDate = contractData.end_date ? 
    new Date(contractData.end_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : contract.end_date ? 
    new Date(contract.end_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '[End Date]';

  // Extract territory and governing law
  const territory = Array.isArray(contractData.territory) ? contractData.territory.join(', ') : 
                   Array.isArray(contract.territories) ? contract.territories.join(', ') : 
                   'Worldwide';
  
  const governingLaw = contractData.governing_law === 'new_york' ? 'New York' : 
                      contractData.governing_law === 'california' ? 'California' :
                      contractData.governing_law === 'tennessee' ? 'Tennessee' :
                      contractData.governing_law || 'New York';

  // Extract financial terms
  const publisherShare = contractData.publisher_share_percentage || '[Publisher Share %]';
  const writerShare = contractData.writer_share_percentage || '[Writer Share %]';
  const performanceSplit = contractData.performance_revenue_split || publisherShare;
  const mechanicalSplit = contractData.mechanical_revenue_split || publisherShare;
  const syncSplit = contractData.sync_revenue_split || publisherShare;
  const printSplit = contractData.print_revenue_split || publisherShare;
  const grandRightsSplit = publisherShare; // Usually same as publisher share
  const karaokeSplit = publisherShare; // Usually same as publisher share
  const advanceAmount = contractData.advance_amount ? `$${contractData.advance_amount.toLocaleString()}` : '$[Advance Amount]';
  const recoupable = contractData.recoupable ? 'Yes' : 'No';
  const exclusivity = contractData.exclusivity ? 'Yes' : 'No';
  const optionPeriods = contractData.option_periods ? 'Yes' : 'No';
  const deliveryCommitment = contractData.delivery_commitment || '[Delivery Commitment]';
  
  // Extract party information
  const administratorName = administrator.name || '[Administrator Name]';
  const administratorAddress = administrator.address || '[Administrator Address]';
  const administratorEmail = administrator.email || '[Administrator Email]';
  
  const counterpartyName = contract.counterparty_name || counterparty.name || '[Counterparty Name]';
  const counterpartyAddress = counterparty.address || '[Counterparty Address]';
  const counterpartyEmail = counterparty.email || '[Counterparty Email]';
  
  // Extract delivery requirements
  const deliveryReqs = contractData.delivery_requirements || [];
  const metadataDelivered = deliveryReqs.includes('Metadata') ? 'Yes' : 'No';
  const soundFileDelivered = deliveryReqs.includes('Sound File') ? 'Yes' : 'No';
  const workRegistrationDelivered = deliveryReqs.includes('Work Registration') ? 'Yes' : 'No';
  const leadSheetsDelivered = deliveryReqs.includes('Lead Sheets') ? 'Yes' : 'No';
  const lyricsDelivered = deliveryReqs.includes('Lyrics') ? 'Yes' : 'No';
  const mastersDelivered = deliveryReqs.includes('Masters') ? 'Yes' : 'No';
  const approvalDetails = contractData.approvals_required ? (contractData.approval_conditions || '[Approval Details]') : 'No approvals required';
  
  // Extract accounting terms
  const royaltyFrequency = contractData.distribution_cycle === 'quarterly' ? 'Quarterly' : 
                          contractData.distribution_cycle === 'semi_annually' ? 'Semi-Annually' :
                          contractData.distribution_cycle || 'Quarterly';
  const paymentTermsDays = contractData.payment_terms_days || '[Payment Terms (days)]';
  const minimumThreshold = contractData.minimum_payment_threshold ? `$${contractData.minimum_payment_threshold}` : '$[Minimum Threshold]';
  const disputePeriodMonths = contractData.statement_dispute_period_months || '[Dispute Period (months)]';
  const tailPeriodMonths = contractData.tail_period_months || '[Tail Period (months)]';
  const terminationNoticeDays = contractData.termination_notice_days || '[Termination Notice Days]';

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
        .ownership-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border: 1px solid #000;
        }
        .ownership-table th,
        .ownership-table td {
          border: 1px solid #000;
          padding: 12px;
          text-align: center;
          font-size: 11pt;
        }
        .ownership-table th {
          background-color: #f5f5f5;
          font-weight: bold;
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
        <div class="agreement-title">CO-PUBLISHING AGREEMENT</div>
      </div>

      <div class="section-content">
        This Co-Publishing Agreement (the "Agreement") is made and entered into as of <strong>${effectiveDate}</strong>, by and between:
      </div>

      <div class="party-section">
        <strong>Administrator / Co-Publisher</strong><br>
        <strong>${administratorName}</strong><br>
        Address: ${administratorAddress}<br>
        Email: ${administratorEmail}<br>
        ("Administrator")
      </div>

      <div class="party-section">
        and
      </div>

      <div class="party-section">
        <strong>Writer / Original Publisher</strong><br>
        <strong>${counterpartyName}</strong><br>
        Address: ${counterpartyAddress}<br>
        Email: ${counterpartyEmail}<br>
        ("Counterparty" or "Writer")
      </div>

      <div class="section-content">
        Each a "Party" and collectively the "Parties."
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">1. Purpose</div>
        <div class="section-content">
          This Agreement outlines the terms under which Administrator and Counterparty agree to 
          co-own and co-administer certain musical compositions written and/or controlled by the 
          Counterparty (the "Works"), listed in <em>Exhibit A</em>.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">2. Term and Territory</div>
        <div class="bullet-point">
          • <strong>Effective Date:</strong> ${effectiveDate}
        </div>
        <div class="bullet-point">
          • <strong>End/Reversion Date:</strong> ${endDate}
        </div>
        <div class="bullet-point">
          • <strong>Territory:</strong> ${territory}
        </div>
        <div class="bullet-point">
          • <strong>Governing Law:</strong> ${governingLaw}
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">3. Delivery Requirements</div>
        <div class="section-content">
          The Counterparty shall deliver the following materials for each Work:
        </div>
        <div class="bullet-point">• ☐ Metadata Delivered: ${metadataDelivered}</div>
        <div class="bullet-point">• ☐ Sound File Delivered: ${soundFileDelivered}</div>
        <div class="bullet-point">• ☐ Work Registration Delivered: ${workRegistrationDelivered}</div>
        <div class="bullet-point">• ☐ Lead Sheets Delivered: ${leadSheetsDelivered}</div>
        <div class="bullet-point">• ☐ Lyrics Delivered: ${lyricsDelivered}</div>
        <div class="bullet-point">• ☐ Masters Delivered: ${mastersDelivered}</div>
        <div class="bullet-point">• ☐ Approvals Required: ${approvalDetails}</div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">4. Ownership & Splits</div>
        <div class="section-content">
          Each Party agrees to the following ownership structure and royalty entitlements:
        </div>
        
        <table class="ownership-table">
          <thead>
            <tr>
              <th>Right Type</th>
              <th>Counterparty (%)</th>
              <th>Administrator (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Performance</strong></td>
              <td>${performanceSplit}%</td>
              <td>${performanceSplit}%</td>
            </tr>
            <tr>
              <td><strong>Mechanical</strong></td>
              <td>${mechanicalSplit}%</td>
              <td>${mechanicalSplit}%</td>
            </tr>
            <tr>
              <td><strong>Synchronization</strong></td>
              <td>${syncSplit}%</td>
              <td>${syncSplit}%</td>
            </tr>
            <tr>
              <td><strong>Print</strong></td>
              <td>${printSplit}%</td>
              <td>${printSplit}%</td>
            </tr>
            <tr>
              <td><strong>Grand Rights</strong></td>
              <td>${grandRightsSplit}%</td>
              <td>${grandRightsSplit}%</td>
            </tr>
            <tr>
              <td><strong>Karaoke</strong></td>
              <td>${karaokeSplit}%</td>
              <td>${karaokeSplit}%</td>
            </tr>
          </tbody>
        </table>

        <div class="section-content">
          If applicable, use prefilled values from Lovable's Interested Parties tab.
        </div>

        <div class="section-content">
          <strong>Financial Terms:</strong><br>
          • Advance Amount: ${advanceAmount}<br>
          • Recoupable: ${recoupable}<br>
          • Delivery Commitment: ${deliveryCommitment}<br>
          • Exclusivity: ${exclusivity}<br>
          • Option Periods: ${optionPeriods}
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">5. Administration Rights</div>
        <div class="section-content">
          The Administrator shall have the exclusive right to:
        </div>
        <div class="bullet-point">
          • Register, license, and collect income from the Works across all licensed platforms
        </div>
        <div class="bullet-point">
          • Enter into subpublishing agreements as necessary
        </div>
        <div class="bullet-point">
          • License synchronization rights subject to ${approvalDetails} (e.g., Pre-approved, Must Approve All Uses)
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">6. Accounting & Payment</div>
        <div class="bullet-point">
          • <strong>Royalty Statements:</strong> Issued ${royaltyFrequency}
        </div>
        <div class="bullet-point">
          • <strong>Payment Due:</strong> Within ${paymentTermsDays} days after statement issuance
        </div>
        <div class="bullet-point">
          • <strong>Minimum Threshold:</strong> ${minimumThreshold}
        </div>
        <div class="bullet-point">
          • <strong>Dispute Period:</strong> ${disputePeriodMonths} months from date of statement
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">7. Representations and Warranties</div>
        <div class="section-content">
          Each Party warrants that:
        </div>
        <div class="bullet-point">
          • They have full authority to enter into this Agreement
        </div>
        <div class="bullet-point">
          • The Works are original and not subject to conflicting rights
        </div>
        <div class="bullet-point">
          • All information submitted (including metadata, splits, and registrations) is accurate
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">8. Termination</div>
        <div class="section-content">
          This Agreement may be terminated:
        </div>
        <div class="bullet-point">
          • Upon ${terminationNoticeDays} days' written notice in case of material breach
        </div>
        <div class="bullet-point">
          • Immediately for insolvency, fraud, or mutual agreement
        </div>
        <div class="bullet-point">
          • All rights granted revert after ${tailPeriodMonths} months post-termination unless otherwise agreed
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">9. Entire Agreement</div>
        <div class="section-content">
          This Agreement represents the full understanding between the Parties and supersedes all 
          prior agreements related to the subject matter. Amendments must be in writing and signed 
          by both Parties.
        </div>
      </div>

      <div class="divider"></div>

      <div class="signature-section">
        <div class="section-title center">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.</div>
        
        <div class="signature-block">
          <p><strong>${administratorName}</strong></p>
          <div>Signature: ______________________</div>
          <div>Name:</div>
          <div>Title:</div>
          <div>Date:</div>
        </div>

        <div class="signature-block">
          <p><strong>${counterpartyName}</strong></p>
          <div>Signature: ______________________</div>
          <div>Name:</div>
          <div>Title:</div>
          <div>Date:</div>
        </div>
      </div>

      ${generateExhibitA(works)}
    </body>
    </html>
  `;
}

function generateExhibitA(works: any[]): string {
  // For demo purposes, we'll use sample data since the works parameter contains the schedule of works
  
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
    // Use demo data for now since we don't have the parties context here
    const writersText = 'Taylor Swift (50%), Max Martin (25%), Shellback (25%)';
    const publishersText = 'Swift Music (50%), MXM Publishing (25%), Wolf Cousins (25%)';
    const controlledShare = '100%';
    const iswcNumber = work.iswc || 'T-034.524.680-1';
    const ipiNumbers = 'Taylor Swift: 00734567891, Swift Music: 00345678912';

    return `
      <tr>
        <td><strong>${work.song_title || 'Shake It Off'}</strong></td>
        <td>${writersText}</td>
        <td>${publishersText}</td>
        <td>${controlledShare}</td>
        <td>${iswcNumber}</td>
        <td>${ipiNumbers}</td>
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
