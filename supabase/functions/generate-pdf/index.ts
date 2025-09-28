
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

    console.log('Generating PDF for contract:', contract.title);

    // Generate HTML content for the contract
    const htmlContent = generateContractHTML(contract);

    // For now, we'll return the HTML content as a simple PDF placeholder
    // In production, you would use a proper PDF generation library like Puppeteer
    const pdfContent = createSimplePDF(htmlContent, contract);

    return new Response(JSON.stringify({
      success: true,
      contractId: contractId,
      contractTitle: contract.title,
      pdfData: pdfContent,
      downloadUrl: null // Would be a signed URL in production
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateContractHTML(contract: any): string {
  const currentDate = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .party-info { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
        .financial-terms { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .term-item { padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .signature-section { margin-top: 60px; }
        .signature-block { margin: 40px 0; }
        .signature-line { border-bottom: 1px solid #333; width: 300px; margin: 20px 0; }
        .footer { margin-top: 60px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${contract.title.toUpperCase()}</h1>
        <h2>${formatContractType(contract.contract_type)} AGREEMENT</h2>
        <p>Agreement Date: ${currentDate}</p>
        <p>Agreement ID: ${contract.agreement_id || 'N/A'}</p>
      </div>

      <div class="section">
        <div class="section-title">PARTIES TO THE AGREEMENT</div>
        <div class="party-info">
          <strong>Publisher/Administrator:</strong><br>
          ${contract.counterparty_name}<br>
          ${contract.contact_address || 'Address not specified'}<br>
          ${contract.contact_phone ? `Phone: ${contract.contact_phone}` : ''}<br>
          ${contract.recipient_email ? `Email: ${contract.recipient_email}` : ''}
        </div>
      </div>

      ${contract.advance_amount > 0 || contract.commission_percentage > 0 ? `
      <div class="section">
        <div class="section-title">FINANCIAL TERMS</div>
        <div class="financial-terms">
          ${contract.advance_amount > 0 ? `
          <div class="term-item">
            <strong>Advance Amount:</strong><br>
            $${contract.advance_amount.toLocaleString()}
          </div>
          ` : ''}
          ${contract.commission_percentage > 0 ? `
          <div class="term-item">
            <strong>Commission Rate:</strong><br>
            ${contract.commission_percentage}%
          </div>
          ` : ''}
          ${contract.rate_reduction_percentage > 0 ? `
          <div class="term-item">
            <strong>Rate Reduction:</strong><br>
            ${contract.rate_reduction_percentage}%
          </div>
          ` : ''}
          ${contract.controlled_percentage > 0 ? `
          <div class="term-item">
            <strong>Controlled Share:</strong><br>
            ${contract.controlled_percentage}%
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${contract.territories && contract.territories.length > 0 ? `
      <div class="section">
        <div class="section-title">TERRITORIES</div>
        <p>This agreement covers the following territories:</p>
        <p><strong>${contract.territories.join(', ')}</strong></p>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">TERM</div>
        <p>
          <strong>Start Date:</strong> ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}<br>
          <strong>End Date:</strong> ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'To be determined'}
        </p>
      </div>

      ${contract.contract_interested_parties && contract.contract_interested_parties.length > 0 ? `
      <div class="section">
        <div class="section-title">INTERESTED PARTIES</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Performance %</th>
              <th>Mechanical %</th>
              <th>Sync %</th>
            </tr>
          </thead>
          <tbody>
            ${contract.contract_interested_parties.map((party: any) => `
            <tr>
              <td>${party.name}</td>
              <td>${party.party_type}</td>
              <td>${party.controlled_status === 'C' ? 'Controlled' : 'Non-Controlled'}</td>
              <td>${party.performance_percentage || 0}%</td>
              <td>${party.mechanical_percentage || 0}%</td>
              <td>${party.synch_percentage || 0}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${contract.contract_schedule_works && contract.contract_schedule_works.length > 0 ? `
      <div class="section">
        <div class="section-title">SCHEDULE OF WORKS</div>
        <table>
          <thead>
            <tr>
              <th>Song Title</th>
              <th>Artist</th>
              <th>Work ID</th>
              <th>ISWC</th>
              <th>ISRC</th>
            </tr>
          </thead>
          <tbody>
            ${contract.contract_schedule_works.map((work: any) => `
            <tr>
              <td><strong>${work.song_title}</strong></td>
              <td>${work.artist_name || 'N/A'}</td>
              <td>${work.work_id || 'N/A'}</td>
              <td>${work.iswc || 'N/A'}</td>
              <td>${work.isrc || 'N/A'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">GENERAL TERMS AND CONDITIONS</div>
        <ol>
          <li><strong>Rights Granted:</strong> The Writer hereby grants to the Publisher the exclusive right to administer, exploit, and collect income from the musical works listed in the Schedule of Works.</li>
          <li><strong>Territory:</strong> The rights granted herein shall apply to the territories specified above.</li>
          <li><strong>Term:</strong> This agreement shall commence on the Start Date and continue until the End Date, unless terminated earlier in accordance with the terms herein.</li>
          <li><strong>Royalty Distribution:</strong> All royalties collected shall be distributed according to the percentages specified in the Interested Parties section above.</li>
          <li><strong>Accounting:</strong> Publisher shall provide quarterly statements and payments to the Writer within sixty (60) days after the end of each calendar quarter.</li>
          <li><strong>Audit Rights:</strong> Writer shall have the right to audit Publisher's books and records relating to this agreement upon reasonable notice.</li>
        </ol>
      </div>

      ${contract.notes ? `
      <div class="section">
        <div class="section-title">ADDITIONAL TERMS</div>
        <p>${contract.notes}</p>
      </div>
      ` : ''}

      <div class="signature-section">
        <div class="section-title">SIGNATURES</div>
        
        <div class="signature-block">
          <strong>PUBLISHER:</strong><br>
          ${contract.counterparty_name}<br><br>
          <div class="signature-line"></div>
          Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date<br><br>
          
          Name: _______________________________<br>
          Title: _______________________________
        </div>

        <div class="signature-block">
          <strong>WRITER/COMPOSER:</strong><br><br>
          <div class="signature-line"></div>
          Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date<br><br>
          
          Name: _______________________________<br>
          Address: _______________________________
        </div>
      </div>

      <div class="footer">
        <p>This agreement is governed by the laws of the applicable jurisdiction. Any disputes shall be resolved through binding arbitration.</p>
        <p>Generated on ${currentDate} | Agreement ID: ${contract.agreement_id || 'N/A'}</p>
      </div>
    </body>
    </html>
  `;
}

function formatContractType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
}

function createSimplePDF(htmlContent: string, contract: any): string {
  // This is a simplified PDF representation
  // In production, you would use a proper PDF library
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${htmlContent.length + 200}
>>
stream
BT
/F1 12 Tf
72 720 Td
(${contract.title.toUpperCase()}) Tj
0 -24 Td
(${formatContractType(contract.contract_type)} AGREEMENT) Tj
0 -24 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -48 Td
(This is a professional contract document.) Tj
0 -24 Td
(Contract ID: ${contract.agreement_id || 'N/A'}) Tj
0 -24 Td
(Counterparty: ${contract.counterparty_name}) Tj
0 -48 Td
(For full contract details, please refer to the) Tj
0 -24 Td
(complete agreement document.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000275 00000 n 
0000000${(500 + htmlContent.length).toString().padStart(3, '0')} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${600 + htmlContent.length}
%%EOF`;

  return pdfHeader;
}
