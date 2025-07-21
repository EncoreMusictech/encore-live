
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
  
  // Based on agreement type, generate appropriate template
  switch (agreementType) {
    case 'administration':
      return generateAdministrationAgreementHTML(contract, contractData, parties, works);
    case 'co_publishing':
      return generateCoPublishingAgreementHTML(contract, contractData, parties, works);
    case 'exclusive_songwriter':
      return generateSongwriterAgreementHTML(contract, contractData, parties, works);
    case 'catalog_acquisition':
      return generateCatalogAcquisitionHTML(contract, contractData, parties, works);
    default:
      return generateAdministrationAgreementHTML(contract, contractData, parties, works);
  }
}

function generateAdministrationAgreementHTML(contract: any, contractData: any, parties: any[], works: any[]): string {
  // Extract administrator and original publisher data
  const administrator = parties.find((p: any) => p.party_type === 'administrator') || {};
  const originalPublisher = parties.find((p: any) => p.party_type === 'original_publisher' || p.party_type === 'publisher') || {};
  
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
  
  // Extract party information for administration agreement
  const administratorName = administrator.name || 'Music Rights Administrator';
  const administratorAddress = administrator.address || '[Administrator Address]';
  const administratorEmail = administrator.email || '[Administrator Email]';
  
  const originalPublisherName = contract.counterparty_name || originalPublisher.name || 'Original Publisher';
  const originalPublisherAddress = originalPublisher.address || '[Original Publisher Address]';
  const originalPublisherEmail = originalPublisher.email || '[Original Publisher Email]';
  
  // Extract administration-specific terms
  const adminFeePercentage = contractData.admin_fee_percentage || 15;
  const controlledShare = contractData.admin_controlled_share || 100;
  const adminRights = Array.isArray(contractData.admin_rights) ? contractData.admin_rights.join(', ') : 'All Rights';
  
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
  const paymentTermsDays = contractData.payment_terms_days || '60';
  const minimumThreshold = contractData.minimum_payment_threshold ? `$${contractData.minimum_payment_threshold}` : '$100';
  const disputePeriodMonths = contractData.statement_dispute_period_months || '12';
  const tailPeriodMonths = contractData.tail_period_months || '6';
  const terminationNoticeDays = contractData.termination_notice_days || '30';

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
        <div class="agreement-title">ADMINISTRATION AGREEMENT</div>
      </div>

      <div class="section-content">
        This Administration Agreement (the "Agreement") is made and entered into as of <strong>${effectiveDate}</strong>, by and between:
      </div>

      <div class="party-section">
        <strong>Administrator</strong><br>
        <strong>${administratorName}</strong><br>
        Address: ${administratorAddress}<br>
        Email: ${administratorEmail}<br>
        ("Administrator")
      </div>

      <div class="party-section">
        and
      </div>

      <div class="party-section">
        <strong>Original Publisher</strong><br>
        <strong>${originalPublisherName}</strong><br>
        Address: ${originalPublisherAddress}<br>
        Email: ${originalPublisherEmail}<br>
        ("Original Publisher")
      </div>

      <div class="section-content">
        Each a "Party" and collectively the "Parties."
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">1. Grant of Rights</div>
        <div class="section-content">
          Original Publisher hereby grants to Administrator the exclusive right to administer 
          ${controlledShare}% of the publisher's share of certain musical compositions (the "Works"), 
          listed in <em>Exhibit A</em>, for the rights of: ${adminRights}.
        </div>
        <div class="section-content">
          <strong>Administrative Fee:</strong> ${adminFeePercentage}% of gross receipts collected
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
        <div class="section-title">4. Administration Scope</div>
        <div class="section-content">
          <strong>Controlled Share:</strong> Administrator shall administer ${controlledShare}% of the publisher's share
        </div>
        <div class="section-content">
          <strong>Administrative Rights Include:</strong> ${adminRights}
        </div>
        <div class="section-content">
          <strong>Administrative Fee:</strong> ${adminFeePercentage}% of gross receipts collected by Administrator
        </div>
        <div class="section-content">
          <strong>Approval Rights:</strong> ${approvalDetails}
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
          <p><strong>${originalPublisherName}</strong></p>
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

function generateCoPublishingAgreementHTML(contract: any, contractData: any, parties: any[], works: any[]): string {
  // Extract administrator and counterparty data for co-publishing
  const administrator = parties.find((p: any) => p.party_type === 'administrator' || p.party_type === 'publisher') || {};
  const counterparty = parties.find((p: any) => p.party_type === 'writer' || p.party_type === 'songwriter') || {};
  
  // Get actual percentages from interested parties if available
  const performanceSplit = administrator.performance_percentage || contractData.publisher_share_percentage || 50;
  const mechanicalSplit = administrator.mechanical_percentage || contractData.mechanical_revenue_split || 50;
  const syncSplit = administrator.synch_percentage || contractData.sync_revenue_split || 50;
  const printSplit = administrator.print_percentage || contractData.print_revenue_split || 50;
  
  // Extract dates and other common fields
  const effectiveDate = contractData.effective_date ? 
    new Date(contractData.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
    contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
    'January 1, 2024';
    
  const endDate = contractData.end_date ? 
    new Date(contractData.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
    contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
    'January 1, 2027';
    
  const territory = Array.isArray(contractData.territory) ? contractData.territory.join(', ') : 
                   Array.isArray(contract.territories) ? contract.territories.join(', ') : 
                   'United States, Canada, United Kingdom';
                   
  const governingLaw = contractData.governing_law || 'New York State Law';
  
  // Extract party information
  const administratorName = administrator.name || '[Administrator Name]';
  const administratorAddress = administrator.address || '[Administrator Address]';
  const administratorEmail = administrator.email || '[Administrator Email]';
  
  const counterpartyName = contract.counterparty_name || counterparty.name || '[Counterparty Name]';
  const counterpartyAddress = counterparty.address || '[Counterparty Address]';
  const counterpartyEmail = counterparty.email || '[Counterparty Email]';
  
  // Extract other terms
  const advanceAmount = contractData.advance_amount ? `$${contractData.advance_amount.toLocaleString()}` : '$[Advance Amount]';
  const recoupable = contractData.recoupable ? 'Yes' : 'No';
  const exclusivity = contractData.exclusivity ? 'Yes' : 'No';
  const optionPeriods = contractData.option_periods ? 'Yes' : 'No';
  const deliveryCommitment = contractData.delivery_commitment || '[Delivery Commitment]';
  
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
  const paymentTermsDays = contractData.payment_terms_days || '60';
  const minimumThreshold = contractData.minimum_payment_threshold ? `$${contractData.minimum_payment_threshold}` : '$100';
  const disputePeriodMonths = contractData.statement_dispute_period_months || '12';
  const tailPeriodMonths = contractData.tail_period_months || '6';
  const terminationNoticeDays = contractData.termination_notice_days || '30';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; font-size: 12pt; color: #000; background: white; }
        .header { text-align: center; margin-bottom: 40px; }
        .agreement-title { font-size: 18pt; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section-title { font-size: 14pt; font-weight: bold; margin: 30px 0 15px 0; color: #000; }
        .section-content { margin: 15px 0; text-align: justify; line-height: 1.8; }
        .party-section { margin: 20px 0; line-height: 1.8; }
        .divider { border-bottom: 1px solid #000; margin: 30px 0; width: 100%; }
        .bullet-point { margin: 10px 0; padding-left: 20px; }
        .signature-section { margin-top: 60px; page-break-inside: avoid; }
        .signature-block { margin: 40px 0; }
        .ownership-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000; }
        .ownership-table th, .ownership-table td { border: 1px solid #000; padding: 12px; text-align: center; font-size: 11pt; }
        .ownership-table th { background-color: #f5f5f5; font-weight: bold; }
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

      <div class="party-section">and</div>

      <div class="party-section">
        <strong>Writer / Original Publisher</strong><br>
        <strong>${counterpartyName}</strong><br>
        Address: ${counterpartyAddress}<br>
        Email: ${counterpartyEmail}<br>
        ("Counterparty" or "Writer")
      </div>

      <div class="section-content">Each a "Party" and collectively the "Parties."</div>
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
        <div class="bullet-point">• <strong>Effective Date:</strong> ${effectiveDate}</div>
        <div class="bullet-point">• <strong>End/Reversion Date:</strong> ${endDate}</div>
        <div class="bullet-point">• <strong>Territory:</strong> ${territory}</div>
        <div class="bullet-point">• <strong>Governing Law:</strong> ${governingLaw}</div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">3. Ownership & Revenue Splits</div>
        <div class="section-content">Each Party agrees to the following ownership structure and royalty entitlements:</div>
        
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
              <td>${100 - performanceSplit}%</td>
              <td>${performanceSplit}%</td>
            </tr>
            <tr>
              <td><strong>Mechanical</strong></td>
              <td>${100 - mechanicalSplit}%</td>
              <td>${mechanicalSplit}%</td>
            </tr>
            <tr>
              <td><strong>Synchronization</strong></td>
              <td>${100 - syncSplit}%</td>
              <td>${syncSplit}%</td>
            </tr>
            <tr>
              <td><strong>Print</strong></td>
              <td>${100 - printSplit}%</td>
              <td>${printSplit}%</td>
            </tr>
          </tbody>
        </table>

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

function generateSongwriterAgreementHTML(contract: any, contractData: any, parties: any[], works: any[]): string {
  // Extract publisher and songwriter data
  const publisher = parties.find((p: any) => p.party_type === 'publisher') || {};
  const songwriter = parties.find((p: any) => p.party_type === 'writer' || p.party_type === 'songwriter') || {};
  
  // Extract party information
  const publisherName = publisher.name || '[Publisher Name]';
  const publisherAddress = publisher.address || '[Publisher Address]';
  const publisherEmail = publisher.email || '[Publisher Email]';
  
  const songwriterName = contract.counterparty_name || songwriter.name || '[Songwriter Name]';
  const songwriterAddress = songwriter.address || contract.contact_address || '[Songwriter Address]';
  const songwriterEmail = songwriter.email || contract.recipient_email || '[Songwriter Email]';

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

  // Extract financial terms
  const advanceAmount = contractData.advance_amount ? `$${contractData.advance_amount.toLocaleString()}` : contract.advance_amount ? `$${contract.advance_amount.toLocaleString()}` : '$[Advance Amount]';
  const publisherShare = contractData.publisher_share_percentage || 50;
  const writerShare = contractData.writer_share_percentage || 50;
  const adminFeePercentage = contractData.admin_fee_percentage || 15;
  
  // Extract territory and governing law
  const territory = Array.isArray(contractData.territory) ? contractData.territory.join(', ') : 
                   Array.isArray(contract.territories) ? contract.territories.join(', ') : 
                   'Worldwide';
  
  const governingLaw = contractData.governing_law === 'new_york' ? 'New York' : 
                      contractData.governing_law === 'california' ? 'California' :
                      contractData.governing_law === 'tennessee' ? 'Tennessee' :
                      contractData.governing_law || 'New York';

  // Extract delivery terms
  const deliveryCommitment = contractData.delivery_commitment || contractData.delivery_commitment_songs || '[Number] songs per year';
  const minimumDelivery = contractData.minimum_delivery_songs || '[Minimum Number]';
  
  // Extract accounting terms
  const royaltyFrequency = contractData.distribution_cycle === 'quarterly' ? 'Quarterly' : 
                          contractData.distribution_cycle === 'semi_annually' ? 'Semi-Annually' :
                          contractData.distribution_cycle || 'Quarterly';
  const paymentTermsDays = contractData.payment_terms_days || '60';
  const minimumThreshold = contractData.minimum_payment_threshold ? `$${contractData.minimum_payment_threshold}` : '$100';

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
        .bold { font-weight: bold; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="agreement-title">EXCLUSIVE SONGWRITER AGREEMENT</div>
      </div>

      <div class="section-content">
        This Exclusive Songwriter Agreement (this "Agreement") is entered into on <strong>${effectiveDate}</strong> (the "Effective Date") between:
      </div>

      <div class="party-section">
        <strong>${publisherName}</strong>, a [State/Country] [Entity Type] (the "Publisher"), with an address at ${publisherAddress}, and
      </div>

      <div class="party-section">
        <strong>${songwriterName}</strong> (the "Songwriter"), with an address at ${songwriterAddress}.
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">1. Grant of Rights</div>
        <div class="section-content">
          <strong>1.1 Exclusive Grant.</strong> Subject to the terms and conditions of this Agreement, Songwriter hereby grants, assigns, and transfers to Publisher, exclusively and irrevocably, all right, title, and interest in and to all Compositions (as defined below) created, written, composed, or otherwise produced by Songwriter during the Term.
        </div>
        <div class="section-content">
          <strong>1.2 Compositions.</strong> "Compositions" means all musical compositions, including lyrics and music, created by Songwriter alone or in collaboration with others during the Term, including any and all copyrights therein and renewals and extensions thereof.
        </div>
        <div class="section-content">
          <strong>1.3 Territory.</strong> The rights granted hereunder shall apply throughout the universe (the "Territory").
        </div>
        <div class="section-content">
          <strong>1.4 Rights Included.</strong> The rights granted to Publisher include, without limitation:
        </div>
        <div class="bullet-point">(a) The exclusive right to publish, print, and sell the Compositions in all forms;</div>
        <div class="bullet-point">(b) The exclusive right to license mechanical reproduction rights;</div>
        <div class="bullet-point">(c) The exclusive right to license synchronization rights;</div>
        <div class="bullet-point">(d) The exclusive right to license grand rights;</div>
        <div class="bullet-point">(e) The exclusive right to collect and receive all income derived from the Compositions;</div>
        <div class="bullet-point">(f) The exclusive right to register copyrights and renew the same.</div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">2. Term</div>
        <div class="section-content">
          <strong>2.1 Initial Term.</strong> The initial term of this Agreement shall commence on the Effective Date and continue until ${endDate} (the "Initial Term").
        </div>
        <div class="section-content">
          <strong>2.2 Options.</strong> Publisher shall have [Number] (___) successive options to extend this Agreement for additional periods of [Duration] (__) year(s) each (each an "Option Period").
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">3. Delivery Commitment</div>
        <div class="section-content">
          <strong>3.1 Minimum Delivery.</strong> During each Contract Period, Songwriter agrees to deliver to Publisher not less than ${minimumDelivery} newly-written Compositions that are Commercially Satisfactory (as defined below).
        </div>
        <div class="section-content">
          <strong>3.2 Commercially Satisfactory.</strong> "Commercially Satisfactory" means, with respect to each Composition, that such Composition is entirely original with Songwriter, is of high commercial and artistic quality, and is suitable for commercial exploitation.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">4. Advances and Compensation</div>
        <div class="section-content">
          <strong>4.1 Advance.</strong> As an advance against Songwriter's share of Net Publisher's Share (as defined below), Publisher shall pay Songwriter ${advanceAmount} upon execution of this Agreement.
        </div>
        <div class="section-content">
          <strong>4.2 Additional Advances.</strong> Publisher may, in its sole discretion, pay additional advances to Songwriter against future earnings.
        </div>
        <div class="section-content">
          <strong>4.3 Recoupment.</strong> All advances shall be recoupable from Songwriter's share of Net Publisher's Share.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">5. Revenue Sharing</div>
        <div class="section-content">
          <strong>5.1 Publisher's Share.</strong> Publisher shall retain ${publisherShare}% of all Net Publisher's Share derived from the Compositions.
        </div>
        <div class="section-content">
          <strong>5.2 Songwriter's Share.</strong> Songwriter shall receive ${writerShare}% of all Net Publisher's Share derived from the Compositions, subject to recoupment of advances and other charges.
        </div>
        <div class="section-content">
          <strong>5.3 Net Publisher's Share.</strong> "Net Publisher's Share" means all income received by Publisher from the exploitation of the Compositions, less a ${adminFeePercentage}% administration fee and any direct costs of exploitation.
        </div>

        <table class="ownership-table">
          <thead>
            <tr>
              <th>Revenue Type</th>
              <th>Publisher Share (%)</th>
              <th>Songwriter Share (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Mechanical Royalties</strong></td>
              <td>${publisherShare}%</td>
              <td>${writerShare}%</td>
            </tr>
            <tr>
              <td><strong>Performance Royalties</strong></td>
              <td>${publisherShare}%</td>
              <td>${writerShare}%</td>
            </tr>
            <tr>
              <td><strong>Synchronization</strong></td>
              <td>${publisherShare}%</td>
              <td>${writerShare}%</td>
            </tr>
            <tr>
              <td><strong>Print</strong></td>
              <td>${publisherShare}%</td>
              <td>${writerShare}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">6. Exclusivity and Services</div>
        <div class="section-content">
          <strong>6.1 Exclusive Services.</strong> During the Term, Songwriter's songwriting services shall be exclusive to Publisher. Songwriter shall not write, compose, or create any musical compositions for any third party without Publisher's prior written consent.
        </div>
        <div class="section-content">
          <strong>6.2 Professional Commitment.</strong> Songwriter agrees to devote Songwriter's professional efforts and time to the creation of Compositions hereunder.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">7. Warranties and Representations</div>
        <div class="section-content">
          Songwriter represents and warrants that:
        </div>
        <div class="bullet-point">(a) Songwriter has the full right, power, and authority to enter into this Agreement;</div>
        <div class="bullet-point">(b) Each Composition shall be original with Songwriter;</div>
        <div class="bullet-point">(c) No Composition shall infringe upon any copyright or other right of any third party;</div>
        <div class="bullet-point">(d) Songwriter has not and will not grant any rights in the Compositions to any third party that would conflict with the rights granted to Publisher hereunder.</div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">8. Accounting and Payment</div>
        <div class="section-content">
          <strong>8.1 Statements.</strong> Publisher shall render statements to Songwriter ${royaltyFrequency} showing all income received and expenses incurred with respect to the Compositions.
        </div>
        <div class="section-content">
          <strong>8.2 Payment.</strong> Payments shall be made within ${paymentTermsDays} days after the end of each accounting period, provided the amount due exceeds ${minimumThreshold}.
        </div>
        <div class="section-content">
          <strong>8.3 Audit Rights.</strong> Songwriter may, upon reasonable notice, examine Publisher's books and records relating to the Compositions during normal business hours.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">9. Termination</div>
        <div class="section-content">
          <strong>9.1 Termination for Cause.</strong> Either party may terminate this Agreement upon material breach by the other party, provided written notice is given and the breach is not cured within thirty (30) days.
        </div>
        <div class="section-content">
          <strong>9.2 Effect of Termination.</strong> Upon termination, all rights in Compositions created during the Term shall remain with Publisher in perpetuity.
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">10. General Provisions</div>
        <div class="section-content">
          <strong>10.1 Governing Law.</strong> This Agreement shall be governed by the laws of ${governingLaw}.
        </div>
        <div class="section-content">
          <strong>10.2 Entire Agreement.</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings.
        </div>
        <div class="section-content">
          <strong>10.3 Amendments.</strong> This Agreement may be amended only by written instrument signed by both parties.
        </div>
      </div>

      <div class="signature-section">
        <div class="section-title center">IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.</div>
        
        <div class="signature-block">
          <p><strong>PUBLISHER:</strong></p>
          <p><strong>${publisherName}</strong></p>
          <div>By: <span class="signature-line"></span></div>
          <div>Name:</div>
          <div>Title:</div>
          <div>Date:</div>
        </div>

        <div class="signature-block">
          <p><strong>SONGWRITER:</strong></p>
          <div>Signature: <span class="signature-line"></span></div>
          <div>${songwriterName}</div>
          <div>Date:</div>
        </div>
      </div>

      ${generateExhibitA(works)}
    </body>
    </html>
  `;
}

function generateCatalogAcquisitionHTML(contract: any, contractData: any, parties: any[], works: any[]): string {
  // Extract buyer and seller data
  const buyer = parties.find((p: any) => p.party_type === 'buyer' || p.party_type === 'administrator') || {};
  const seller = parties.find((p: any) => p.party_type === 'seller' || p.party_type === 'publisher') || {};
  
  const buyerName = buyer.name || '[Buyer Name]';
  const sellerName = contract.counterparty_name || seller.name || '[Seller Name]';
  
  const effectiveDate = contractData.effective_date ? 
    new Date(contractData.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
    'January 1, 2024';
    
  const acquisitionPrice = contractData.acquisition_price ? `$${contractData.acquisition_price.toLocaleString()}` : '$[Acquisition Price]';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; font-size: 12pt; color: #000; background: white; }
        .header { text-align: center; margin-bottom: 40px; }
        .agreement-title { font-size: 18pt; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section-title { font-size: 14pt; font-weight: bold; margin: 30px 0 15px 0; color: #000; }
        .section-content { margin: 15px 0; text-align: justify; line-height: 1.8; }
        .party-section { margin: 20px 0; line-height: 1.8; }
        .divider { border-bottom: 1px solid #000; margin: 30px 0; width: 100%; }
        .bullet-point { margin: 10px 0; padding-left: 20px; }
        .signature-section { margin-top: 60px; page-break-inside: avoid; }
        .signature-block { margin: 40px 0; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="agreement-title">CATALOG ACQUISITION AGREEMENT</div>
      </div>

      <div class="section-content">
        This Catalog Acquisition Agreement (the "Agreement") is made and entered into as of <strong>${effectiveDate}</strong>, by and between:
      </div>

      <div class="party-section">
        <strong>Buyer</strong><br>
        <strong>${buyerName}</strong><br>
        ("Buyer")
      </div>

      <div class="party-section">and</div>

      <div class="party-section">
        <strong>Seller</strong><br>
        <strong>${sellerName}</strong><br>
        ("Seller")
      </div>

      <div class="section-content">Each a "Party" and collectively the "Parties."</div>
      <div class="divider"></div>

      <div class="section">
        <div class="section-title">1. Purchase and Sale</div>
        <div class="section-content">
          Seller agrees to sell and Buyer agrees to purchase the musical catalog described in Exhibit A 
          for the total purchase price of <strong>${acquisitionPrice}</strong>.
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
