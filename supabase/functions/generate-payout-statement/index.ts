import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

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

// Simple HTML to PDF-like text format for now (avoiding complex dependencies)
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Edge function called - generate-payout-statement');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
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
            work_title,
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
        work_title: pr.royalty_allocations?.work_title || 'Unknown Work',
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

    // Generate simple text format for both PDF and Excel (avoiding complex dependencies for now)
    const statementText = generateSimpleStatementText(payoutData);
    const textBytes = new TextEncoder().encode(statementText);

    // Return as text file with appropriate extension
    const contentType = format === 'xlsx' ? 'text/plain' : 'text/plain';
    const filename = `${baseFilename}.${format === 'xlsx' ? 'txt' : 'txt'}`;

    console.log('Returning statement:', filename);

    return new Response(textBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

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