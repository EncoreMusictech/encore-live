import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuarterlyReportData {
  user_id: string;
  payee_id: string;
  contact_id?: string;
  agreement_id?: string;
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

    // Get all payouts with payee information
    const { data: payouts, error: payoutsError } = await supabaseClient
      .from('payouts')
      .select(`
        id, client_id, payee_id, gross_royalties, total_expenses, amount_due, 
        status, workflow_stage, created_at, period_start
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1000);

    // Get contacts separately to avoid complex joins that trigger recursion
    const { data: contacts } = await supabaseClient
      .from('contacts')
      .select('id, name')
      .eq('user_id', user.id);

    // Create a contact lookup map
    const contactMap = new Map(
      (contacts || []).map(c => [c.id, c.name])
    );

    if (payoutsError || !payouts || payouts.length === 0) {
      console.log('No payouts found:', payoutsError);
      console.log('Payouts array:', payouts);
      console.log('User ID:', user.id);
      return new Response(
        JSON.stringify({ error: 'No payouts found to generate reports from' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${payouts.length} payouts to process`);
    console.log(`✅ Found ${contacts?.length || 0} contacts for mapping`);

    // Log first few payouts for debugging
    console.log('First few payouts:', payouts.slice(0, 2).map(p => ({
      id: p.id,
      client_id: p.client_id,
      contact_name: contactMap.get(p.client_id),
      gross_royalties: p.gross_royalties,
      period_start: p.period_start,
      created_at: p.created_at
    })));

    // Get all payees for name mapping AND beginning balances
    const { data: payees } = await supabaseClient
      .from('payees')
      .select('id, payee_name, beginning_balance')
      .eq('user_id', user.id);

    const payeeByName = new Map<string, string>(
      (payees || []).map(p => [String(p.payee_name || '').toLowerCase().trim(), p.id])
    );

    console.log(`Found ${payees?.length || 0} payees for mapping`);
    console.log('Existing payees:', Array.from(payeeByName.entries()));

    // Group payouts by payee and quarter
    const reportData = new Map<string, {
      payee_id: string;
      contact_id?: string;
      agreement_id?: string;
      year: number;
      quarter: number;
      royalties_amount: number;
      expenses_amount: number;
      payments_amount: number;
    }>();

    let processedCount = 0;
    console.log('🔍 Starting to process payouts...');
    
    for (const payout of payouts as any[]) {
      console.log(`\n--- Processing payout ${payout.id} ---`);
      
      const payeeId = payout.payee_id as string | undefined;
      if (!payeeId) {
        console.warn(`⚠️ Skipping payout ${payout.id} — missing payee_id`);
        continue;
      }
      console.log(`✅ Using existing payee_id: ${payeeId}`);
      
      // Try to find the contract associated with this payout
      let agreementId: string | undefined;
      const contactName = contactMap.get(payout.client_id) || 'Unknown';
      try {
        // First, try to match by counterparty name
        const { data: matchingContracts } = await supabaseClient
          .from('contracts')
          .select('id')
          .eq('user_id', user.id)
          .eq('counterparty_name', contactName)
          .limit(1);
          
        if (matchingContracts && matchingContracts.length > 0) {
          agreementId = matchingContracts[0].id;
          console.log(`✅ Found contract for "${contactName}" -> contract ID: ${agreementId}`);
        } else {
          // Fallback: try to find any active contract for this user
          const { data: fallbackContracts } = await supabaseClient
            .from('contracts')
            .select('id')
            .eq('user_id', user.id)
            .in('contract_status', ['active', 'signed'])
            .limit(1);
            
          if (fallbackContracts && fallbackContracts.length > 0) {
            agreementId = fallbackContracts[0].id;
            console.log(`⚠️ Using fallback contract for "${contactName}" -> contract ID: ${agreementId}`);
          }
        }
      } catch (e) {
        console.log('Could not find contract for contact:', contactName, e);
        agreementId = undefined;
      }

      console.log('Payout data:', {
        id: payout.id,
        payee_id: payeeId,
        client_id: payout.client_id,
        gross_royalties: payout.gross_royalties,
        period_start: payout.period_start,
        created_at: payout.created_at,
        contact_name: contactName,
        agreement_id: agreementId
      });
      
      const periodDate = payout.period_start || payout.created_at;
      const d = new Date(periodDate);
      const year = d.getFullYear();
      const quarter = Math.ceil((d.getMonth() + 1) / 3);
      
      console.log(`Calculated period: ${year} Q${quarter} from date ${periodDate}`);

      if (!payeeId) {
        console.error(`No payee ID found for contact: ${contactName}`);
        continue;
      }

      const key = `${payeeId}-${year}-Q${quarter}`;
      
      if (!reportData.has(key)) {
        reportData.set(key, {
          payee_id: payeeId,
          contact_id: payout.client_id,
          agreement_id: agreementId,
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
      
      // Start with the payee's beginning balance (if set)
      const payeeInfo = payees?.find(p => p.id === payeeId);
      let runningBalance = Number(payeeInfo?.beginning_balance) || 0;
      console.log(`Payee ${payeeId} starting with beginning balance: $${runningBalance}`);
      
      for (const entry of entries) {
        const openingBalance = Number(runningBalance.toFixed(2));
        const closingBalance = Number((openingBalance + entry.royalties_amount - entry.expenses_amount - entry.payments_amount).toFixed(2));
        
        reportsToInsert.push({
          user_id: user.id,
          payee_id: entry.payee_id,
          contact_id: entry.contact_id,
          agreement_id: entry.agreement_id,
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

    // Insert reports using the safe database function
    console.log(`Using database function to insert ${reportsToInsert.length} reports...`);
    
    // Convert reports to JSON format for the database function
    const reportsJson = reportsToInsert.map(report => ({
      user_id: report.user_id,
      payee_id: report.payee_id,
      contact_id: report.contact_id || null,
      agreement_id: report.agreement_id || null,
      year: report.year,
      quarter: report.quarter,
      opening_balance: report.opening_balance,
      royalties_amount: report.royalties_amount,
      expenses_amount: report.expenses_amount,
      payments_amount: report.payments_amount,
      closing_balance: report.closing_balance,
      is_calculated: report.is_calculated,
      calculation_date: report.calculation_date
    }));
    
    // Log the data being sent 
    console.log('Sample report data:', JSON.stringify(reportsJson[0], null, 2));
    console.log(`Attempting to insert ${reportsJson.length} reports directly...`);
    
    try {
      // Try direct insertion to see actual errors
      let successfulInsertions = 0;
      
      for (const report of reportsJson) {
        try {
          const { data, error } = await supabaseClient
            .from('quarterly_balance_reports')
            .insert([{
              user_id: report.user_id,
              payee_id: report.payee_id, 
              contact_id: report.contact_id,
              agreement_id: report.agreement_id,
              year: report.year,
              quarter: report.quarter,
              opening_balance: report.opening_balance,
              royalties_amount: report.royalties_amount,
              expenses_amount: report.expenses_amount,
              payments_amount: report.payments_amount,
              closing_balance: report.closing_balance,
              is_calculated: report.is_calculated,
              calculation_date: report.calculation_date
            }])
            .select('*');
            
          if (error) {
            console.error('Direct insertion error for report:', error);
            console.error('Report data that failed:', JSON.stringify(report, null, 2));
            
            // Try upsert instead
            const { error: upsertError } = await supabaseClient
              .from('quarterly_balance_reports')
              .upsert([{
                user_id: report.user_id,
                payee_id: report.payee_id,
                contact_id: report.contact_id,
                agreement_id: report.agreement_id,
                year: report.year,
                quarter: report.quarter,
                opening_balance: report.opening_balance,
                royalties_amount: report.royalties_amount,
                expenses_amount: report.expenses_amount,
                payments_amount: report.payments_amount,
                closing_balance: report.closing_balance,
                is_calculated: report.is_calculated,
                calculation_date: report.calculation_date
              }]);
              
            if (upsertError) {
              console.error('Upsert also failed:', upsertError);
            } else {
              console.log('✅ Upsert successful for report');
              successfulInsertions++;
            }
          } else {
            console.log('✅ Direct insertion successful:', data);
            successfulInsertions++;
          }
        } catch (reportError) {
          console.error('Exception during report insertion:', reportError);
        }
      }
      
      console.log(`✅ Successfully processed ${successfulInsertions} quarterly balance reports`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Generated ${successfulInsertions} quarterly balance reports from existing payout data`,
          totalProcessed: successfulInsertions
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (insertError) {
      console.error('Failed to insert reports via database function:', insertError);
      
      // Final fallback - try direct inserts one by one
      let fallbackCount = 0;
      for (const report of reportsToInsert.slice(0, 10)) { // Limit to prevent timeout
        try {
          const { error: singleError } = await supabaseClient
            .from('quarterly_balance_reports')
            .insert([{
              user_id: report.user_id,
              payee_id: report.payee_id,
              contact_id: report.contact_id,
              agreement_id: report.agreement_id,
              year: report.year,
              quarter: report.quarter,
              opening_balance: report.opening_balance,
              royalties_amount: report.royalties_amount,
              expenses_amount: report.expenses_amount,
              payments_amount: report.payments_amount,
              closing_balance: report.closing_balance,
            }]);
          
          if (!singleError) {
            fallbackCount++;
          }
        } catch (e) {
          console.error('Single insert failed:', e);
        }
      }
      
      console.log(`Fallback: inserted ${fallbackCount} reports individually`);
      
      return new Response(
        JSON.stringify({ 
          success: fallbackCount > 0, 
          message: `Generated ${fallbackCount} quarterly balance reports (fallback mode)`,
          totalProcessed: fallbackCount,
          warning: 'Database function failed, used fallback insertion method'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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