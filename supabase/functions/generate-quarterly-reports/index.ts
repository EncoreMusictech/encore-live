import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuarterlyReportData {
  user_id: string;
  payee_id: string;
  contact_id?: string;
  year: number;
  quarter: number;
  opening_balance: number;
  royalties_amount: number;
  expenses_amount: number;
  payments_amount: number;
  closing_balance: number;
  is_calculated: boolean;
  calculation_date: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating quarterly reports for user: ${user.id}`);

    // Get all payouts with client contact information
    const { data: payouts, error: payoutsError } = await supabaseClient
      .from('payouts')
      .select(`
        id, client_id, gross_royalties, total_expenses, amount_due, 
        status, workflow_stage, created_at, period_start,
        contacts!payouts_client_id_fkey(id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1000);

    if (payoutsError || !payouts || payouts.length === 0) {
      console.log('No payouts found:', payoutsError);
      return new Response(
        JSON.stringify({ error: 'No payouts found to generate reports from' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${payouts.length} payouts...`);

    // Get all payees for name mapping
    const { data: payees } = await supabaseClient
      .from('payees')
      .select('id, payee_name')
      .eq('user_id', user.id);

    const payeeByName = new Map<string, string>(
      (payees || []).map(p => [String(p.payee_name || '').toLowerCase().trim(), p.id])
    );

    console.log(`Found ${payees?.length || 0} payees for mapping`);

    // Group payouts by payee and quarter
    const reportData = new Map<string, {
      payee_id: string;
      contact_id?: string;
      year: number;
      quarter: number;
      royalties_amount: number;
      expenses_amount: number;
      payments_amount: number;
    }>();

    let processedCount = 0;
    for (const payout of payouts as any[]) {
      const periodDate = payout.period_start || payout.created_at;
      const d = new Date(periodDate);
      const year = d.getFullYear();
      const quarter = Math.ceil((d.getMonth() + 1) / 3);
      
      const contactName = payout.contacts?.name || 'Unknown';
      const contactNameLower = contactName.toLowerCase().trim();
      
      // Find matching payee ID with improved matching
      let payeeId = payeeByName.get(contactNameLower);
      if (!payeeId) {
        // Try partial matching
        for (const [payeeName, id] of payeeByName.entries()) {
          if (payeeName.includes(contactNameLower) || contactNameLower.includes(payeeName)) {
            payeeId = id;
            console.log(`🔗 Matched "${contactName}" to payee "${payeeName}"`);
            break;
          }
        }
      }

      if (!payeeId) {
        console.log(`⚠️ No payee found for contact "${contactName}", skipping...`);
        continue;
      }

      const key = `${payeeId}-${year}-Q${quarter}`;
      
      if (!reportData.has(key)) {
        reportData.set(key, {
          payee_id: payeeId,
          contact_id: payout.client_id,
          year,
          quarter,
          royalties_amount: 0,
          expenses_amount: 0,
          payments_amount: 0,
        });
      }

      const entry = reportData.get(key)!;
      entry.royalties_amount += Number(payout.gross_royalties || 0);
      entry.expenses_amount += Number(payout.total_expenses || 0);
      
      const isPaid = String(payout.status || '').toLowerCase() === 'paid' || 
                    String(payout.workflow_stage || '').toLowerCase() === 'paid';
      if (isPaid) {
        entry.payments_amount += Number(payout.amount_due || 0);
      }

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${payouts.length} payouts...`);
      }
    }

    console.log(`Grouped into ${reportData.size} quarterly periods`);

    // Generate reports with proper opening/closing balances
    const reportsToInsert: QuarterlyReportData[] = [];
    const byPayee = new Map<string, any[]>();
    
    // Group by payee
    for (const [key, data] of reportData) {
      if (!byPayee.has(data.payee_id)) byPayee.set(data.payee_id, []);
      byPayee.get(data.payee_id)!.push(data);
    }

    console.log(`Processing ${byPayee.size} unique payees...`);

    // Calculate running balances for each payee
    for (const [payeeId, entries] of byPayee) {
      entries.sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter));
      
      let runningBalance = 0;
      for (const entry of entries) {
        const openingBalance = Number(runningBalance.toFixed(2));
        const closingBalance = Number((openingBalance + entry.royalties_amount - entry.expenses_amount - entry.payments_amount).toFixed(2));
        
        reportsToInsert.push({
          user_id: user.id,
          payee_id: entry.payee_id,
          contact_id: entry.contact_id,
          year: entry.year,
          quarter: entry.quarter,
          opening_balance: openingBalance,
          royalties_amount: Number(entry.royalties_amount.toFixed(2)),
          expenses_amount: Number(entry.expenses_amount.toFixed(2)),
          payments_amount: Number(entry.payments_amount.toFixed(2)),
          closing_balance: closingBalance,
          is_calculated: true,
          calculation_date: new Date().toISOString(),
        });
        
        runningBalance = closingBalance;
      }
    }

    if (reportsToInsert.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No reports could be generated from the available data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Preparing to insert ${reportsToInsert.length} reports...`);

    // Delete existing reports for this user to avoid conflicts
    console.log('Clearing existing reports...');
    const { error: deleteError } = await supabaseClient
      .from('quarterly_balance_reports')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting existing reports:', deleteError);
    }

    // Insert reports in small batches without triggers
    const BATCH_SIZE = 25;
    let insertedCount = 0;
    
    for (let i = 0; i < reportsToInsert.length; i += BATCH_SIZE) {
      const batch = reportsToInsert.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(reportsToInsert.length/BATCH_SIZE);
      
      console.log(`Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
      
      try {
        // Use direct insert with service role to bypass RLS and triggers
        const { error } = await supabaseClient
          .from('quarterly_balance_reports')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${batchNumber}:`, error);
          continue; // Continue with next batch instead of failing entirely
        }
        
        insertedCount += batch.length;
        console.log(`✅ Batch ${batchNumber} completed successfully`);
        
      } catch (batchError) {
        console.error(`❌ Failed on batch ${batchNumber}:`, batchError);
        continue;
      }
      
      // Small delay between batches
      if (i + BATCH_SIZE < reportsToInsert.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Successfully generated ${insertedCount} quarterly balance reports`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${insertedCount} quarterly balance reports from existing payout data`,
        totalProcessed: insertedCount 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quarterly-reports function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});