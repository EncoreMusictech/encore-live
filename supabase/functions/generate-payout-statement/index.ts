import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayoutStatement {
  id: string;
  period: string;
  client_name: string;
  gross_royalties: number;
  total_expenses: number;
  net_payable: number;
  amount_due: number;
  payment_method: string;
  workflow_stage: string;
  created_at: string;
  royalties: Array<{
    work_title: string;
    amount: number;
    source: string;
  }>;
  expenses: Array<{
    description: string;
    amount: number;
    expense_type: string;
  }>;
}

function generateStatementHTML(statement: PayoutStatement): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Payout Statement - ${statement.period}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #333;
                line-height: 1.4;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #0066cc;
                padding-bottom: 20px;
            }
            .header h1 { 
                color: #0066cc; 
                margin: 0;
                font-size: 28px;
            }
            .statement-info { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            .client-info, .statement-details { 
                flex: 1; 
            }
            .client-info h3, .statement-details h3 { 
                margin-top: 0; 
                color: #0066cc;
                border-bottom: 1px solid #ddd;
                padding-bottom: 8px;
            }
            .summary-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary-table th, .summary-table td { 
                padding: 12px; 
                text-align: left; 
                border-bottom: 1px solid #ddd; 
            }
            .summary-table th { 
                background-color: #0066cc; 
                color: white;
                font-weight: bold;
            }
            .summary-table .total-row { 
                background-color: #f0f8ff; 
                font-weight: bold;
                font-size: 16px;
            }
            .amount { 
                text-align: right; 
                font-weight: bold;
            }
            .section { 
                margin-bottom: 30px; 
            }
            .section h3 { 
                color: #0066cc; 
                border-bottom: 2px solid #0066cc;
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .details-table { 
                width: 100%; 
                border-collapse: collapse;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .details-table th, .details-table td { 
                padding: 10px; 
                text-align: left; 
                border-bottom: 1px solid #eee; 
            }
            .details-table th { 
                background-color: #f8f9fa; 
                font-weight: bold;
                color: #333;
            }
            .footer { 
                margin-top: 50px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-paid { background: #d4edda; color: #155724; }
            .status-processing { background: #ffeaa7; color: #856404; }
            .status-approved { background: #cce5ff; color: #004085; }
            .status-pending { background: #fff3cd; color: #856404; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Royalty Payout Statement</h1>
            <p>Period: ${statement.period}</p>
        </div>

        <div class="statement-info">
            <div class="client-info">
                <h3>Client Information</h3>
                <p><strong>Client:</strong> ${statement.client_name}</p>
                <p><strong>Statement ID:</strong> ${statement.id.substring(0, 8)}</p>
            </div>
            <div class="statement-details">
                <h3>Statement Details</h3>
                <p><strong>Generated:</strong> ${formatDate(new Date().toISOString())}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${statement.workflow_stage}">${statement.workflow_stage.replace('_', ' ')}</span></p>
                <p><strong>Payment Method:</strong> ${statement.payment_method || 'Not specified'}</p>
            </div>
        </div>

        <table class="summary-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Gross Royalties</td>
                    <td class="amount">${formatCurrency(statement.gross_royalties)}</td>
                </tr>
                <tr>
                    <td>Total Expenses</td>
                    <td class="amount">-${formatCurrency(statement.total_expenses)}</td>
                </tr>
                <tr>
                    <td>Net Payable</td>
                    <td class="amount">${formatCurrency(statement.net_payable)}</td>
                </tr>
                <tr class="total-row">
                    <td>Amount Due</td>
                    <td class="amount">${formatCurrency(statement.amount_due)}</td>
                </tr>
            </tbody>
        </table>

        ${statement.royalties && statement.royalties.length > 0 ? `
        <div class="section">
            <h3>Royalty Details</h3>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Work Title</th>
                        <th>Source</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${statement.royalties.map(royalty => `
                        <tr>
                            <td>${royalty.work_title}</td>
                            <td>${royalty.source}</td>
                            <td class="amount">${formatCurrency(royalty.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${statement.expenses && statement.expenses.length > 0 ? `
        <div class="section">
            <h3>Expense Details</h3>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Type</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${statement.expenses.map(expense => `
                        <tr>
                            <td>${expense.description}</td>
                            <td>${expense.expense_type}</td>
                            <td class="amount">-${formatCurrency(expense.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p>This statement was generated automatically. Please retain for your records.</p>
            <p>Generated on ${formatDate(new Date().toISOString())}</p>
        </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payoutId } = await req.json()

    if (!payoutId) {
      return new Response(JSON.stringify({ error: 'Payout ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user access
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch payout data with related information
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select(`
        *,
        contacts (name),
        payout_royalties (
          allocated_amount,
          royalty_allocations (work_title, source)
        ),
        payout_expenses (
          description,
          amount,
          expense_type
        )
      `)
      .eq('id', payoutId)
      .eq('user_id', user.id)
      .single()

    if (payoutError || !payout) {
      return new Response(JSON.stringify({ error: 'Payout not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prepare statement data
    const statement: PayoutStatement = {
      id: payout.id,
      period: payout.period || 'Unknown Period',
      client_name: payout.contacts?.name || 'Unknown Client',
      gross_royalties: payout.gross_royalties || 0,
      total_expenses: payout.total_expenses || 0,
      net_payable: payout.net_payable || 0,
      amount_due: payout.amount_due || 0,
      payment_method: payout.payment_method || '',
      workflow_stage: payout.workflow_stage || 'draft',
      created_at: payout.created_at,
      royalties: payout.payout_royalties?.map((pr: any) => ({
        work_title: pr.royalty_allocations?.work_title || 'Unknown Work',
        amount: pr.allocated_amount || 0,
        source: pr.royalty_allocations?.source || 'Unknown Source'
      })) || [],
      expenses: payout.payout_expenses?.map((pe: any) => ({
        description: pe.description || 'Unknown Expense',
        amount: pe.amount || 0,
        expense_type: pe.expense_type || 'Unknown Type'
      })) || []
    }

    // Generate HTML content
    const htmlContent = generateStatementHTML(statement)

    // Convert HTML to PDF using a lightweight approach
    // For production, you might want to use a more robust PDF generation service
    const pdfBytes = new TextEncoder().encode(htmlContent)

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="payout-statement-${statement.period}.html"`
      }
    })

  } catch (error) {
    console.error('Error generating payout statement:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate statement',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})