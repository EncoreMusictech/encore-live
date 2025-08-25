import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function generateHTMLStatement(payoutData: any): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

  // Calculate income categories
  const incomeCategories = {
    Performance: { gross: 0, expenses: 0 },
    Mechanical: { gross: 0, expenses: 0 },
    Sync: { gross: 0, expenses: 0 },
    Other: { gross: 0, expenses: 0 }
  };

  payoutData.royalties.forEach((royalty: any) => {
    const category = categorizeIncomeType(royalty.source, royalty.income_type);
    incomeCategories[category as keyof typeof incomeCategories].gross += royalty.amount;
  });

  payoutData.expenses.forEach((expense: any) => {
    const category = categorizeExpense(expense.expense_type);
    incomeCategories[category as keyof typeof incomeCategories].expenses += expense.amount;
  });

  const totalGross = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.gross, 0);
  const totalExpenses = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.expenses, 0);
  const totalNet = totalGross - totalExpenses;
  const closingBalance = payoutData.opening_balance + totalNet - payoutData.amount_due;

  return `
    <h2>ROYALTY PAYOUT STATEMENT</h2>
    <p><strong>Period:</strong> ${payoutData.period}</p>
    <p><strong>Payee:</strong> ${payoutData.client_name}</p>
    <p><strong>Statement ID:</strong> ${payoutData.id.substring(0, 8)}</p>
    <p><strong>Status:</strong> ${payoutData.workflow_stage.replace('_', ' ').toUpperCase()}</p>

    <div class="section">
      <h3>Income Summary</h3>
      <table>
        <tr><th>Category</th><th class="amount">Gross</th><th class="amount">Expenses</th><th class="amount">Net</th></tr>
        ${Object.entries(incomeCategories).map(([category, amounts]) => {
          const net = amounts.gross - amounts.expenses;
          return `<tr><td>${category}</td><td class="amount">${formatCurrency(amounts.gross)}</td><td class="amount">${formatCurrency(amounts.expenses)}</td><td class="amount">${formatCurrency(net)}</td></tr>`;
        }).join('')}
        <tr style="font-weight: bold;"><td>TOTAL</td><td class="amount">${formatCurrency(totalGross)}</td><td class="amount">${formatCurrency(totalExpenses)}</td><td class="amount">${formatCurrency(totalNet)}</td></tr>
      </table>
    </div>

    <div class="section">
      <h3>Balance Summary</h3>
      <table>
        <tr><td>Opening Balance:</td><td class="amount">${formatCurrency(payoutData.opening_balance)}</td></tr>
        <tr><td>Net for Period:</td><td class="amount">${formatCurrency(totalNet)}</td></tr>
        <tr><td>Payments Made:</td><td class="amount">${formatCurrency(payoutData.amount_due)}</td></tr>
        <tr style="font-weight: bold;"><td>Closing Balance:</td><td class="amount">${formatCurrency(closingBalance)}</td></tr>
      </table>
    </div>
  `;
}

function generateStatementText(payoutData: any): string {
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
  payoutData.royalties.forEach((royalty: any) => {
    const category = categorizeIncomeType(royalty.source, royalty.income_type);
    incomeCategories[category as keyof typeof incomeCategories].gross += royalty.amount;
  });

  // Categorize expenses
  payoutData.expenses.forEach((expense: any) => {
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
    content += `${'-'.repeat(50)}\n`;
    content += `QUARTER | SOURCE | WORK ID | WORK TITLE | AMOUNT\n`;
    content += `${'-'.repeat(80)}\n`;
    payoutData.royalties.forEach((royalty: any) => {
      content += `${royalty.quarter} | ${royalty.source || 'N/A'} | ${royalty.work_id || 'N/A'} | ${royalty.work_title.substring(0, 20)} | ${formatCurrency(royalty.amount)}\n`;
    });
  }

  return content;
}

serve(async (req) => {
  console.log('🚀 Function started: generate-bulk-statements');
  
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
    const { payoutIds } = body;
    console.log('Request body:', body);
    console.log('Payout IDs:', payoutIds);

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Payout IDs array is required' }), {
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

    // Fetch all requested payouts with comprehensive data
    const { data: payouts, error: payoutsError } = await supabase
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
      .in('id', payoutIds)
      .eq('user_id', user.id);

    if (payoutsError || !payouts || payouts.length === 0) {
      console.error('Payouts fetch error:', payoutsError);
      return new Response(JSON.stringify({ error: 'No accessible payouts found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetched ${payouts.length} payouts successfully`);

    if (format === 'pdf') {
      // Generate HTML for bulk statements
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Bulk Payout Statements</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .statement { page-break-before: always; margin-bottom: 40px; }
            .statement:first-child { page-break-before: auto; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
            th { background-color: #f5f5f5; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BULK PAYOUT STATEMENTS EXPORT</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <p>Total Statements: ${payouts.length}</p>
          </div>
      `;

      for (const payout of payouts) {
      const payoutData = {
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
        opening_balance: 0,
        royalties: payout.payout_royalties?.map((pr: any) => ({
          quarter: pr.royalty_allocations?.quarter || 'N/A',
          source: pr.royalty_allocations?.source || 'Unknown Source',
          work_id: pr.royalty_allocations?.work_id || 'N/A',
          work_title: pr.royalty_allocations?.song_title || 'Unknown Work',
          writers: pr.royalty_allocations?.mapped_data?.writers || 'N/A',
          pub_share: 100,
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

        htmlContent += `<div class="statement">`;
        htmlContent += generateHTMLStatement(payoutData);
        htmlContent += `</div>`;
      }

      // Summary
      const totalGross = payouts.reduce((sum, p) => sum + (p.gross_royalties || 0), 0);
      const totalExpenses = payouts.reduce((sum, p) => sum + (p.total_expenses || 0), 0);
      const totalDue = payouts.reduce((sum, p) => sum + (p.amount_due || 0), 0);

      htmlContent += `
          <div class="section" style="page-break-before: always;">
            <h3>Bulk Summary</h3>
            <table>
              <tr><td>Total Gross Royalties:</td><td class="amount">${totalGross.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
              <tr><td>Total Expenses:</td><td class="amount">${totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
              <tr><td>Total Amount Due:</td><td class="amount">${totalDue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
            </table>
          </div>
        </body>
        </html>
      `;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const filename = `bulk-payout-statements-${timestamp[0]}-${timestamp[1].split('.')[0]}.html`;

      console.log('Returning bulk HTML statements:', filename);

      return new Response(htmlContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${filename}"`
        }
      });
    } else {
      // Generate text format for other exports
      let bulkContent = `BULK PAYOUT STATEMENTS EXPORT\n`;
      bulkContent += `Generated: ${new Date().toLocaleDateString()}\n`;
      bulkContent += `Total Statements: ${payouts.length}\n`;
      bulkContent += `\n${'='.repeat(80)}\n\n`;

      for (const payout of payouts) {
        const payoutData = {
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
          opening_balance: 0,
          royalties: payout.payout_royalties?.map((pr: any) => ({
            quarter: pr.royalty_allocations?.quarter || 'N/A',
            source: pr.royalty_allocations?.source || 'Unknown Source',
            work_id: pr.royalty_allocations?.work_id || 'N/A',
            work_title: pr.royalty_allocations?.song_title || 'Unknown Work',
            writers: pr.royalty_allocations?.mapped_data?.writers || 'N/A',
            pub_share: 100,
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

        bulkContent += generateStatementText(payoutData);
        bulkContent += `\n${'='.repeat(80)}\n\n`;
      }

      // Summary
      const totalGross = payouts.reduce((sum, p) => sum + (p.gross_royalties || 0), 0);
      const totalExpenses = payouts.reduce((sum, p) => sum + (p.total_expenses || 0), 0);
      const totalDue = payouts.reduce((sum, p) => sum + (p.amount_due || 0), 0);

      bulkContent += `BULK SUMMARY\n`;
      bulkContent += `Total Gross Royalties: ${totalGross.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\n`;
      bulkContent += `Total Expenses: ${totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\n`;
      bulkContent += `Total Amount Due: ${totalDue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\n`;

      const textBytes = new TextEncoder().encode(bulkContent);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const filename = `bulk-payout-statements-${timestamp[0]}-${timestamp[1].split('.')[0]}.txt`;

      console.log('Returning bulk text statements:', filename);

      return new Response(textBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Error generating bulk statements:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate bulk statements',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});