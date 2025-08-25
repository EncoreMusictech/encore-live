import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayoutData {
  id: string;
  period: string;
  client_name: string;
  client_id: string;
  gross_royalties: number;
  total_expenses: number;
  net_payable: number;
  amount_due: number;
  payment_method: string;
  workflow_stage: string;
  created_at: string;
  opening_balance: number;
  royalties: Array<{
    quarter: string;
    source: string;
    work_id: string;
    work_title: string;
    writers: string;
    pub_share: number;
    income_type: string;
    territory: string;
    units: number;
    amount: number;
    payee: string;
  }>;
  expenses: Array<{
    description: string;
    amount: number;
    expense_type: string;
    category: string;
  }>;
}

function categorizeIncomeType(source: string, revenueSource: string): string {
  const sourceText = (source + ' ' + revenueSource).toLowerCase();
  
  if (sourceText.includes('performance') || sourceText.includes('ascap') || sourceText.includes('bmi') || sourceText.includes('sesac')) {
    return 'Performance';
  }
  if (sourceText.includes('mechanical') || sourceText.includes('streaming') || sourceText.includes('digital')) {
    return 'Mechanical';
  }
  if (sourceText.includes('sync') || sourceText.includes('synchronization') || sourceText.includes('film') || sourceText.includes('tv')) {
    return 'Sync';
  }
  return 'Other';
}

function categorizeExpense(expenseType: string): string {
  const type = expenseType.toLowerCase();
  if (type.includes('performance')) return 'Performance';
  if (type.includes('mechanical')) return 'Mechanical';
  if (type.includes('sync')) return 'Sync';
  return 'Other';
}

// HTML version for PDF-like display
function generateHTMLStatement(payoutData: PayoutData): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

  // Calculate income categories
  const incomeCategories = {
    Performance: { gross: 0, expenses: 0 },
    Mechanical: { gross: 0, expenses: 0 },
    Sync: { gross: 0, expenses: 0 },
    Other: { gross: 0, expenses: 0 }
  };

  // Categorize royalties and expenses
  payoutData.royalties.forEach(royalty => {
    const category = categorizeIncomeType(royalty.source, royalty.income_type);
    incomeCategories[category as keyof typeof incomeCategories].gross += royalty.amount;
  });

  payoutData.expenses.forEach(expense => {
    const category = categorizeExpense(expense.expense_type);
    incomeCategories[category as keyof typeof incomeCategories].expenses += expense.amount;
  });

  const totalGross = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.gross, 0);
  const totalExpenses = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.expenses, 0);
  const totalNet = totalGross - totalExpenses;
  const closingBalance = payoutData.opening_balance + totalNet - payoutData.amount_due;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Royalty Payout Statement</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 40px auto; 
          max-width: 800px;
          line-height: 1.6;
          color: #333;
          background: #f9f9f9;
        }
        .document {
          background: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 {
          color: #2563eb;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .header-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .header-info div {
          background: #f8fafc;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #2563eb;
        }
        .section { margin-bottom: 30px; }
        .section h3 { 
          color: #1e40af; 
          border-bottom: 2px solid #e5e7eb; 
          padding-bottom: 8px; 
          margin-bottom: 15px;
          font-size: 18px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th { 
          background: linear-gradient(135deg, #2563eb, #1d4ed8); 
          color: white; 
          padding: 12px 8px; 
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        td { 
          padding: 12px 8px; 
          border-bottom: 1px solid #f1f5f9; 
        }
        tr:hover {
          background-color: #f8fafc;
        }
        .amount { 
          text-align: right; 
          font-weight: 600;
          color: #059669;
        }
        .total-row {
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          font-weight: bold;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .print-button:hover {
          background: #1d4ed8;
        }
      </style>
      <script>
        function printStatement() {
          window.print();
        }
      </script>
    </head>
    <body>
      <button class="print-button no-print" onclick="printStatement()">Print Statement</button>
      <div class="document">
        <div class="header">
          <h1>ROYALTY PAYOUT STATEMENT</h1>
          <div class="header-info">
            <div><strong>Period:</strong> ${payoutData.period}</div>
            <div><strong>Payee:</strong> ${payoutData.client_name}</div>
            <div><strong>Statement ID:</strong> ${payoutData.id.substring(0, 8)}</div>
            <div><strong>Date Issued:</strong> ${formatDate(new Date().toISOString())}</div>
            <div><strong>Status:</strong> ${payoutData.workflow_stage.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>

      <div class="section">
        <h3>Income Summary</h3>
        <table>
          <tr><th>Category</th><th class="amount">Gross</th><th class="amount">Expenses</th><th class="amount">Net</th></tr>
          ${Object.entries(incomeCategories).map(([category, amounts]) => {
            const net = amounts.gross - amounts.expenses;
            return `<tr><td>${category}</td><td class="amount">${formatCurrency(amounts.gross)}</td><td class="amount">${formatCurrency(amounts.expenses)}</td><td class="amount">${formatCurrency(net)}</td></tr>`;
          }).join('')}
          <tr class="total-row">
            <td>TOTAL</td>
            <td class="amount">${formatCurrency(totalGross)}</td>
            <td class="amount">${formatCurrency(totalExpenses)}</td>
            <td class="amount">${formatCurrency(totalNet)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>Balance Summary</h3>
        <table>
          <tr><td>Opening Balance:</td><td class="amount">${formatCurrency(payoutData.opening_balance)}</td></tr>
          <tr><td>Net for Period:</td><td class="amount">${formatCurrency(totalNet)}</td></tr>
          <tr><td>Payments Made:</td><td class="amount">${formatCurrency(payoutData.amount_due)}</td></tr>
          <tr class="total-row"><td>Closing Balance:</td><td class="amount">${formatCurrency(closingBalance)}</td></tr>
        </table>
      </div>

      ${payoutData.royalties.length > 0 ? `
      <div class="section">
        <h3>Royalty Details</h3>
        <table>
          <tr><th>Quarter</th><th>Source</th><th>Work ID</th><th>Title</th><th class="amount">Amount</th></tr>
          ${payoutData.royalties.map(royalty => 
            `<tr><td>${royalty.quarter}</td><td>${royalty.source}</td><td>${royalty.work_id}</td><td>${royalty.work_title}</td><td class="amount">${formatCurrency(royalty.amount)}</td></tr>`
          ).join('')}
        </table>
      </div>
      ` : ''}
      </div>
    </body>
    </html>
  `;
}

// Simple text format for non-PDF exports
function generateSimpleStatementText(payoutData: PayoutData): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

  // Calculate income categories
  const incomeCategories = {
    Performance: { gross: 0, expenses: 0 },
    Mechanical: { gross: 0, expenses: 0 },
    Sync: { gross: 0, expenses: 0 },
    Other: { gross: 0, expenses: 0 }
  };

  // Categorize royalties
  payoutData.royalties.forEach(royalty => {
    const category = categorizeIncomeType(royalty.source, royalty.income_type);
    incomeCategories[category as keyof typeof incomeCategories].gross += royalty.amount;
  });

  // Categorize expenses
  payoutData.expenses.forEach(expense => {
    const category = categorizeExpense(expense.expense_type);
    incomeCategories[category as keyof typeof incomeCategories].expenses += expense.amount;
  });

  const totalGross = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.gross, 0);
  const totalExpenses = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.expenses, 0);
  const totalNet = totalGross - totalExpenses;
  const closingBalance = payoutData.opening_balance + totalNet - payoutData.amount_due;

  let content = `ROYALTY PAYOUT STATEMENT\n`;
  content += `${'='.repeat(50)}\n\n`;
  content += `Period: ${payoutData.period}\n`;
  content += `Payee: ${payoutData.client_name}\n`;
  content += `Statement ID: ${payoutData.id.substring(0, 8)}\n`;
  content += `Date Issued: ${formatDate(new Date().toISOString())}\n`;
  content += `Status: ${payoutData.workflow_stage.replace('_', ' ').toUpperCase()}\n\n`;

  content += `INCOME SUMMARY\n`;
  content += `${'-'.repeat(30)}\n`;
  Object.entries(incomeCategories).forEach(([category, amounts]) => {
    const net = amounts.gross - amounts.expenses;
    content += `${category} Income: ${formatCurrency(amounts.gross)} (expenses: ${formatCurrency(amounts.expenses)}) = ${formatCurrency(net)}\n`;
  });
  content += `\nTOTAL: ${formatCurrency(totalGross)} (expenses: ${formatCurrency(totalExpenses)}) = ${formatCurrency(totalNet)}\n\n`;

  content += `BALANCE SUMMARY\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `Opening Balance: ${formatCurrency(payoutData.opening_balance)}\n`;
  content += `Net for Period: ${formatCurrency(totalNet)}\n`;
  content += `Payments Made: ${formatCurrency(payoutData.amount_due)}\n`;
  content += `Closing Balance: ${formatCurrency(closingBalance)}\n`;
  content += `Payment Method: ${payoutData.payment_method || 'Not specified'}\n\n`;

  if (payoutData.royalties.length > 0) {
    content += `ROYALTY DETAILS\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `QUARTER | SOURCE | WORK ID | WORK TITLE | AMOUNT\n`;
    content += `${'-'.repeat(80)}\n`;
    payoutData.royalties.forEach(royalty => {
      content += `${royalty.quarter} | ${royalty.source} | ${royalty.work_id} | ${royalty.work_title.substring(0, 20)} | ${formatCurrency(royalty.amount)}\n`;
    });
  }

  return content;
}

serve(async (req) => {
  console.log('🚀 Function started: generate-payout-statement');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('✅ Processing request:', req.method, req.url);
    
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'pdf';
    console.log('Format requested:', format);
    
    const body = await req.json();
    const { payoutId } = body;
    console.log('Request body:', body);
    console.log('Payout ID:', payoutId);

    if (!payoutId) {
      return new Response(JSON.stringify({ error: 'Payout ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Fetch comprehensive payout data
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select(`
        *,
        contacts (name),
        payout_royalties (
          allocated_amount,
          royalty_allocations (
            work_id,
            song_title,
            source,
            revenue_source,
            quarter,
            country,
            quantity,
            gross_amount,
            mapped_data
          )
        ),
        payout_expenses (
          description,
          amount,
          expense_type,
          expense_flags
        )
      `)
      .eq('id', payoutId)
      .eq('user_id', user.id)
      .single();

    if (payoutError || !payout) {
      console.error('Payout fetch error:', payoutError);
      return new Response(JSON.stringify({ error: 'Payout not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Payout data fetched successfully');

    // Prepare enhanced payout data
    const payoutData: PayoutData = {
      id: payout.id,
      period: payout.period || 'Unknown Period',
      client_name: payout.contacts?.name || 'Unknown Client',
      client_id: payout.client_id,
      gross_royalties: payout.gross_royalties || 0,
      total_expenses: payout.total_expenses || 0,
      net_payable: payout.net_payable || 0,
      amount_due: payout.amount_due || 0,
      payment_method: payout.payment_method || '',
      workflow_stage: payout.workflow_stage || 'draft',
      created_at: payout.created_at,
      opening_balance: 0, // Could be calculated from previous periods
      royalties: payout.payout_royalties?.map((pr: any) => ({
        quarter: pr.royalty_allocations?.quarter || 'N/A',
        source: pr.royalty_allocations?.source || 'Unknown Source',
        work_id: pr.royalty_allocations?.work_id || 'N/A',
        work_title: pr.royalty_allocations?.song_title || 'Unknown Work',
        writers: pr.royalty_allocations?.mapped_data?.writers || 'N/A',
        pub_share: 100, // Default, could be calculated from ownership data
        income_type: pr.royalty_allocations?.revenue_source || 'Other',
        territory: pr.royalty_allocations?.country || 'Unknown',
        units: parseInt(pr.royalty_allocations?.quantity) || 0,
        amount: pr.allocated_amount || 0,
        payee: payout.contacts?.name || 'Unknown'
      })) || [],
      expenses: payout.payout_expenses?.map((pe: any) => ({
        description: pe.description || 'Unknown Expense',
        amount: pe.amount || 0,
        expense_type: pe.expense_type || 'Unknown Type',
        category: categorizeExpense(pe.expense_type || '')
      })) || []
    };

    const period = payoutData.period.replace(/[^a-zA-Z0-9]/g, '-');
    const baseFilename = `payout-statement-${period}-${payoutData.id.substring(0, 8)}`;

    if (format === 'pdf') {
      // Generate HTML for PDF conversion
      const htmlContent = generateHTMLStatement(payoutData);
      
      // Return as HTML that browsers can display and print as PDF
      const filename = `${baseFilename}.html`;
      
      console.log('Returning HTML statement:', filename);
      
      return new Response(htmlContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    } else {
      // Generate simple text format for other formats
      const statementText = generateSimpleStatementText(payoutData);
      const textBytes = new TextEncoder().encode(statementText);
      const contentType = 'text/plain';
      const filename = `${baseFilename}.txt`;

      console.log('Returning text statement:', filename);

      return new Response(textBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Error generating payout statement:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate statement',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});