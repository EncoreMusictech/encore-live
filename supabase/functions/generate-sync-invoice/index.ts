import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  licenseId: string;
  templateId?: string;
  customFields?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SIMPLE TEST FUNCTION ===');
    
    // Just return a success response to test if the function itself works
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Function is working',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in simple test:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateInvoiceHTML(license: any, template: any, customFields: any = {}): string {
  const currentDate = new Date().toLocaleDateString();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(); // 30 days from now

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${license.license_id || 'DRAFT'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: #f8f9fa;
        }
        .container { 
          max-width: 800px; 
          margin: 20px auto; 
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { 
          font-size: 2.5em; 
          margin-bottom: 10px; 
          font-weight: 300;
        }
        .header p { 
          font-size: 1.1em; 
          opacity: 0.9;
        }
        .content { 
          padding: 30px; 
        }
        .invoice-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        .meta-section h3 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.2em;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 8px;
        }
        .meta-item {
          margin-bottom: 10px;
        }
        .meta-label {
          font-weight: 600;
          color: #495057;
          display: inline-block;
          width: 120px;
        }
        .license-details {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
          border-left: 4px solid #667eea;
        }
        .license-details h3 {
          color: #667eea;
          margin-bottom: 20px;
          font-size: 1.3em;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .amount-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
        }
        .amount-section h3 {
          margin-bottom: 15px;
          font-size: 1.2em;
          opacity: 0.9;
        }
        .total-amount {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .works-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .works-table th {
          background: #667eea;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        .works-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e9ecef;
        }
        .works-table tr:hover {
          background: #f8f9fa;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
        }
        .payment-terms {
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
        }
        @media print {
          body { background: white; }
          .container { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SYNC LICENSE INVOICE</h1>
          <p>Professional Music Licensing Services</p>
        </div>
        
        <div class="content">
          <div class="invoice-meta">
            <div class="meta-section">
              <h3>Invoice Details</h3>
               <div class="meta-item">
                 <span class="meta-label">Invoice #:</span>
                 <span>${license.synch_id || 'DRAFT'}</span>
               </div>
              <div class="meta-item">
                <span class="meta-label">Date:</span>
                <span>${currentDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Due Date:</span>
                <span>${dueDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Status:</span>
                <span>${license.license_status || 'Draft'}</span>
              </div>
            </div>
            
            <div class="meta-section">
              <h3>Bill To</h3>
              <div class="meta-item">
                <span class="meta-label">Company:</span>
                <span>${license.licensee_company || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Contact:</span>
                <span>${license.licensee_name || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Email:</span>
                <span>${license.licensee_email || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Phone:</span>
                <span>${license.licensee_phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="license-details">
            <h3>License Information</h3>
            <div class="details-grid">
              <div>
                <div class="meta-item">
                  <span class="meta-label">Project:</span>
                  <span>${license.project_title || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Usage Type:</span>
                  <span>${license.usage_type || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Territory:</span>
                  <span>${license.territory || 'Worldwide'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Duration:</span>
                  <span>${license.duration || 'N/A'}</span>
                </div>
              </div>
              <div>
                <div class="meta-item">
                  <span class="meta-label">Media Type:</span>
                  <span>${license.media_type || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Start Date:</span>
                  <span>${license.start_date ? new Date(license.start_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">End Date:</span>
                  <span>${license.end_date ? new Date(license.end_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Exclusive:</span>
                  <span>${license.is_exclusive ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          ${license.copyrights && license.copyrights.length > 0 ? `
          <h3>Licensed Works</h3>
          <table class="works-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>ISRC</th>
                <th>Writers</th>
                <th>Publishers</th>
              </tr>
            </thead>
            <tbody>
              ${license.copyrights.map((work: any) => `
                <tr>
                  <td><strong>${work.work_title || 'N/A'}</strong></td>
                  <td>${work.isrc || 'N/A'}</td>
                  <td>${work.writers?.map((w: any) => w.name).join(', ') || 'N/A'}</td>
                  <td>${work.publishers?.map((p: any) => p.name).join(', ') || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

           <div class="amount-section">
             <h3>Total License Fee</h3>
             <div class="total-amount">
               ${license.currency || 'USD'} ${((license.pub_fee || 0) + (license.master_fee || 0)).toLocaleString()}
             </div>
             <p>All fees are payable upon receipt</p>
           </div>

          <div class="payment-terms">
            <h4 style="margin-bottom: 10px; color: #856404;">Payment Terms & Conditions</h4>
            <p style="margin-bottom: 10px;">
              • Payment is due within 30 days of invoice date<br>
              • Late payments may incur additional fees<br>
              • License becomes effective upon payment receipt<br>
              • All rights reserved until full payment is received
            </p>
            ${license.payment_terms ? `<p><strong>Additional Terms:</strong> ${license.payment_terms}</p>` : ''}
          </div>

          ${customFields && Object.keys(customFields).length > 0 ? `
          <div class="license-details">
            <h3>Additional Information</h3>
            ${Object.entries(customFields).map(([key, value]) => `
              <div class="meta-item">
                <span class="meta-label">${key}:</span>
                <span>${value}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Thank you for your business. For questions about this invoice, please contact your licensing representative.</p>
          <p style="margin-top: 10px; font-size: 0.9em;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}