import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

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

async function generateExcelStatement(payoutData: PayoutData): Promise<Uint8Array> {
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['ROYALTY PAYOUT STATEMENT', '', '', ''],
    ['', '', '', ''],
    ['Period:', payoutData.period, '', ''],
    ['Payee:', payoutData.client_name, '', ''],
    ['Statement ID:', payoutData.id.substring(0, 8), '', ''],
    ['Date Issued:', new Date().toLocaleDateString(), '', ''],
    ['', '', '', ''],
    ['INCOME SUMMARY', '', '', ''],
    ['Category', 'Gross Amount', 'Expenses/Recoupment', 'Net Amount'],
  ];

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

  // Add category rows
  Object.entries(incomeCategories).forEach(([category, amounts]) => {
    summaryData.push([
      category + ' Income',
      amounts.gross,
      amounts.expenses,
      amounts.gross - amounts.expenses
    ]);
  });

  const totalGross = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.gross, 0);
  const totalExpenses = Object.values(incomeCategories).reduce((sum, cat) => sum + cat.expenses, 0);
  const totalNet = totalGross - totalExpenses;

  summaryData.push(
    ['TOTAL', totalGross, totalExpenses, totalNet],
    ['', '', '', ''],
    ['BALANCE SUMMARY', '', '', ''],
    ['Opening Balance', payoutData.opening_balance, '', ''],
    ['Net for Period', totalNet, '', ''],
    ['Payments Made', payoutData.amount_due, '', ''],
    ['Closing Balance', payoutData.opening_balance + totalNet - payoutData.amount_due, '', ''],
    ['', '', '', ''],
    ['Payment Method:', payoutData.payment_method || 'Not specified', '', '']
  );

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Format summary sheet
  summarySheet['!cols'] = [
    { width: 20 },
    { width: 15 },
    { width: 18 },
    { width: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Details Sheet
  const detailsHeaders = [
    'QUARTER', 'SOURCE', 'WORK ID', 'WORK TITLE', 'WRITER(S)', 
    'PUB SHARE (%)', 'INCOME TYPE', 'TERRITORY', 'UNITS', 'AMOUNT', 'PAYEE'
  ];
  
  const detailsData = [detailsHeaders];
  
  payoutData.royalties.forEach(royalty => {
    detailsData.push([
      royalty.quarter,
      royalty.source,
      royalty.work_id,
      royalty.work_title,
      royalty.writers,
      royalty.pub_share,
      categorizeIncomeType(royalty.source, royalty.income_type),
      royalty.territory,
      royalty.units,
      royalty.amount,
      royalty.payee
    ]);
  });

  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
  
  // Format details sheet
  detailsSheet['!cols'] = [
    { width: 10 }, // QUARTER
    { width: 15 }, // SOURCE
    { width: 12 }, // WORK ID
    { width: 25 }, // WORK TITLE
    { width: 20 }, // WRITER(S)
    { width: 12 }, // PUB SHARE (%)
    { width: 15 }, // INCOME TYPE
    { width: 12 }, // TERRITORY
    { width: 10 }, // UNITS
    { width: 12 }, // AMOUNT
    { width: 20 }  // PAYEE
  ];

  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Royalty Details');

  // Generate XLSX buffer
  const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(xlsxBuffer);
}

async function generatePDFStatement(payoutData: PayoutData, includeDetails: boolean = false): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  let yPosition = height - 50;
  
  // Header
  page.drawText('ROYALTY PAYOUT STATEMENT', {
    x: 50,
    y: yPosition,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0.4, 0.8)
  });
  
  yPosition -= 40;
  
  // Statement info
  const infoItems = [
    `Period: ${payoutData.period}`,
    `Payee: ${payoutData.client_name}`, 
    `Statement ID: ${payoutData.id.substring(0, 8)}`,
    `Date Issued: ${new Date().toLocaleDateString()}`,
    `Status: ${payoutData.workflow_stage.replace('_', ' ').toUpperCase()}`
  ];
  
  infoItems.forEach(item => {
    page.drawText(item, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont
    });
    yPosition -= 20;
  });
  
  yPosition -= 20;
  
  // Income Summary Table
  page.drawText('INCOME SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  
  yPosition -= 30;
  
  // Calculate categories (same logic as Excel)
  const incomeCategories = {
    Performance: { gross: 0, expenses: 0 },
    Mechanical: { gross: 0, expenses: 0 },
    Sync: { gross: 0, expenses: 0 },
    Other: { gross: 0, expenses: 0 }
  };

  payoutData.royalties.forEach(royalty => {
    const category = categorizeIncomeType(royalty.source, royalty.income_type);
    incomeCategories[category as keyof typeof incomeCategories].gross += royalty.amount;
  });

  payoutData.expenses.forEach(expense => {
    const category = categorizeExpense(expense.expense_type);
    incomeCategories[category as keyof typeof incomeCategories].expenses += expense.amount;
  });
  
  // Table headers
  const headers = ['Category', 'Gross Amount', 'Expenses', 'Net Amount'];
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: 50 + (index * 120),
      y: yPosition,
      size: 10,
      font: helveticaBold
    });
  });
  
  yPosition -= 20;
  
  // Table rows
  Object.entries(incomeCategories).forEach(([category, amounts]) => {
    const net = amounts.gross - amounts.expenses;
    const rowData = [
      category + ' Income',
      `$${amounts.gross.toFixed(2)}`,
      `$${amounts.expenses.toFixed(2)}`,
      `$${net.toFixed(2)}`
    ];
    
    rowData.forEach((data, index) => {
      page.drawText(data, {
        x: 50 + (index * 120),
        y: yPosition,
        size: 10,
        font: helveticaFont
      });
    });
    yPosition -= 15;
  });
  
  yPosition -= 20;
  
  // Balance Summary
  page.drawText('BALANCE SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  
  yPosition -= 30;
  
  const totalNet = Object.values(incomeCategories).reduce((sum, cat) => sum + (cat.gross - cat.expenses), 0);
  const closingBalance = payoutData.opening_balance + totalNet - payoutData.amount_due;
  
  const balanceItems = [
    `Opening Balance: $${payoutData.opening_balance.toFixed(2)}`,
    `Net for Period: $${totalNet.toFixed(2)}`,
    `Payments Made: $${payoutData.amount_due.toFixed(2)}`,
    `Closing Balance: $${closingBalance.toFixed(2)}`,
    `Payment Method: ${payoutData.payment_method || 'Not specified'}`
  ];
  
  balanceItems.forEach(item => {
    page.drawText(item, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont
    });
    yPosition -= 20;
  });
  
  // Add details page if requested
  if (includeDetails && payoutData.royalties.length > 0) {
    const detailsPage = pdfDoc.addPage([792, 612]); // Landscape for details
    let detailsY = 550;
    
    detailsPage.drawText('ROYALTY DETAILS', {
      x: 50,
      y: detailsY,
      size: 16,
      font: helveticaBold
    });
    
    detailsY -= 40;
    
    // Headers (condensed for landscape)
    const detailHeaders = ['Work Title', 'Source', 'Income Type', 'Amount'];
    detailHeaders.forEach((header, index) => {
      detailsPage.drawText(header, {
        x: 50 + (index * 150),
        y: detailsY,
        size: 10,
        font: helveticaBold
      });
    });
    
    detailsY -= 20;
    
    // Limit to first 20 rows to fit on page
    payoutData.royalties.slice(0, 20).forEach(royalty => {
      const rowData = [
        royalty.work_title.substring(0, 20), // Truncate long titles
        royalty.source.substring(0, 15),
        categorizeIncomeType(royalty.source, royalty.income_type),
        `$${royalty.amount.toFixed(2)}`
      ];
      
      rowData.forEach((data, index) => {
        detailsPage.drawText(data, {
          x: 50 + (index * 150),
          y: detailsY,
          size: 9,
          font: helveticaFont
        });
      });
      detailsY -= 15;
    });
    
    if (payoutData.royalties.length > 20) {
      detailsPage.drawText(`... and ${payoutData.royalties.length - 20} more items`, {
        x: 50,
        y: detailsY - 20,
        size: 9,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }
  
  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'pdf';
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    
    const { payoutId } = await req.json();

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
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
      return new Response(JSON.stringify({ error: 'Payout not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    if (format === 'xlsx') {
      const xlsxBuffer = await generateExcelStatement(payoutData);
      
      return new Response(xlsxBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`
        }
      });
    } else {
      const pdfBuffer = await generatePDFStatement(payoutData, includeDetails);
      
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${baseFilename}.pdf"`
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