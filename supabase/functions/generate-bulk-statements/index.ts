import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payoutIds } = await req.json()

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Payout IDs array is required' }), {
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

    // Fetch all requested payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select(`
        *,
        contacts (name)
      `)
      .in('id', payoutIds)
      .eq('user_id', user.id)

    if (payoutsError || !payouts || payouts.length === 0) {
      return new Response(JSON.stringify({ error: 'No accessible payouts found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate a simple text-based bulk report
    // In production, you'd want to generate individual PDFs and zip them
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

    let reportContent = `BULK PAYOUT STATEMENTS EXPORT\n`;
    reportContent += `Generated: ${formatDate(new Date().toISOString())}\n`;
    reportContent += `Total Statements: ${payouts.length}\n`;
    reportContent += `\n${'='.repeat(80)}\n\n`;

    for (const payout of payouts) {
      reportContent += `PAYOUT STATEMENT\n`;
      reportContent += `Period: ${payout.period || 'Unknown'}\n`;
      reportContent += `Client: ${payout.contacts?.name || 'Unknown Client'}\n`;
      reportContent += `Status: ${(payout.workflow_stage || 'draft').replace('_', ' ').toUpperCase()}\n`;
      reportContent += `Gross Royalties: ${formatCurrency(payout.gross_royalties || 0)}\n`;
      reportContent += `Total Expenses: ${formatCurrency(payout.total_expenses || 0)}\n`;
      reportContent += `Net Payable: ${formatCurrency(payout.net_payable || 0)}\n`;
      reportContent += `Amount Due: ${formatCurrency(payout.amount_due || 0)}\n`;
      reportContent += `Payment Method: ${payout.payment_method || 'Not specified'}\n`;
      reportContent += `Created: ${formatDate(payout.created_at)}\n`;
      reportContent += `\n${'-'.repeat(40)}\n\n`;
    }

    // Summary
    const totalGross = payouts.reduce((sum, p) => sum + (p.gross_royalties || 0), 0);
    const totalExpenses = payouts.reduce((sum, p) => sum + (p.total_expenses || 0), 0);
    const totalDue = payouts.reduce((sum, p) => sum + (p.amount_due || 0), 0);

    reportContent += `SUMMARY\n`;
    reportContent += `Total Gross Royalties: ${formatCurrency(totalGross)}\n`;
    reportContent += `Total Expenses: ${formatCurrency(totalExpenses)}\n`;
    reportContent += `Total Amount Due: ${formatCurrency(totalDue)}\n`;

    // Convert to bytes for download
    const reportBytes = new TextEncoder().encode(reportContent);

    return new Response(reportBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="bulk-payout-statements-${new Date().toISOString().split('T')[0]}.txt"`
      }
    })

  } catch (error) {
    console.error('Error generating bulk statements:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate bulk statements',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})