import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import type { RevenueType } from '@/utils/revenueTypeClassifier';

export interface WriterMatchResult {
  writer_id: string;
  writer_name: string;
  writer_uuid: string;
  royalty_allocations: any[];
  total_amount: number;
}

export interface WriterPayoutSummary {
  writer_id: string;
  writer_name: string;
  payout_id: string;
  total_amount: number;
  royalty_count: number;
  payee_count: number;
}

export const useWriterPayouts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  // Match royalty allocations to writers by name
  const matchRoyaltiesToWriters = async (royaltyAllocations: any[]): Promise<WriterMatchResult[]> => {
    if (!user) return [];

    // Get unique writer names from royalty allocations
    const uniqueWriterNames = Array.from(
      new Set(
        royaltyAllocations
          .map(allocation => allocation.work_writers)
          .filter(Boolean)
      )
    );

    // Fetch writers for matching
    const { data: writers, error } = await supabase
      .from('writers')
      .select('id, writer_id, writer_name')
      .eq('user_id', user.id)
      .in('writer_name', uniqueWriterNames);

    if (error) {
      console.error('Error fetching writers:', error);
      return [];
    }

    // Group royalties by matched writers
    const writerMatches: WriterMatchResult[] = [];

    for (const writer of writers || []) {
      const matchedRoyalties = royaltyAllocations.filter(
        allocation => allocation.work_writers === writer.writer_name
      );

      if (matchedRoyalties.length > 0) {
        const totalAmount = matchedRoyalties.reduce(
          (sum, allocation) => sum + (allocation.gross_royalty_amount || 0), 
          0
        );

        writerMatches.push({
          writer_id: writer.writer_id,
          writer_name: writer.writer_name,
          writer_uuid: writer.id,
          royalty_allocations: matchedRoyalties,
          total_amount: totalAmount,
        });
      }
    }

    return writerMatches;
  };

  // Create individual payouts for each writer
  const createWriterPayouts = async (
    writerMatches: WriterMatchResult[],
    quarter: number,
    year: number,
    batchId: string
  ): Promise<WriterPayoutSummary[]> => {
    if (!user) return [];

    const payoutSummaries: WriterPayoutSummary[] = [];

    for (const writerMatch of writerMatches) {
      try {
        // First, find the payee for this writer
        const { data: payee, error: payeeError } = await supabase
          .from('payees')
          .select('id')
          .eq('user_id', user.id)
          .eq('writer_id', writerMatch.writer_uuid)
          .maybeSingle();

        if (payeeError) throw payeeError;
        
        if (!payee) {
          console.warn(`No payee found for writer ${writerMatch.writer_name}`);
          continue;
        }

        // Ensure a contact exists for this writer
        let contact;
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', writerMatch.writer_name)
          .eq('contact_type', 'writer')
          .maybeSingle();

        if (existingContact) {
          contact = existingContact;
        } else {
          // Create a contact for this writer
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              name: writerMatch.writer_name,
              contact_type: 'writer'
            })
            .select('id')
            .single();

          if (contactError) throw contactError;
          contact = newContact;
        }

        // Create payout for this writer with both payee_id and client_id
        const { data: payout, error: payoutError } = await supabase
          .from('payouts')
          .insert({
            user_id: user.id,
            payee_id: payee.id, // Required by validation trigger
            client_id: contact.id, // Use contact ID
            period: `Q${quarter} ${year}`,
            period_start: `${year}-${(quarter - 1) * 3 + 1}-01`,
            period_end: `${year}-${quarter * 3}-${quarter === 4 ? 31 : 30}`,
            gross_royalties: writerMatch.total_amount,
            total_expenses: 0,
            net_payable: writerMatch.total_amount,
            amount_due: writerMatch.total_amount,
            status: 'pending',
            notes: `Auto-generated for writer ${writerMatch.writer_name} from batch ${batchId} - Q${quarter} ${year}`,
          })
          .select()
          .single();

        if (payoutError) throw payoutError;

        // Phase 6: Create payout_royalties with ownership audit snapshots
        // Look up contract interested parties for this writer to record splits
        let writerParty: any = null;
        const { data: payeeWriter } = await supabase
          .from('writers')
          .select('original_publisher_id, original_publishers!inner(agreement_id)')
          .eq('id', writerMatch.writer_uuid)
          .maybeSingle();

        const agreementId = payeeWriter?.original_publishers?.agreement_id;
        if (agreementId) {
          const { data: parties } = await supabase
            .from('contract_interested_parties')
            .select('id, name, performance_percentage, mechanical_percentage, synch_percentage, controlled_status, party_type')
            .eq('contract_id', agreementId)
            .ilike('name', `%${writerMatch.writer_name}%`)
            .maybeSingle();
          writerParty = parties;
        }

        const payoutRoyalties = writerMatch.royalty_allocations.map((allocation: any) => {
          const revenueType = allocation.revenue_type as RevenueType | null;
          let splitPct = 100; // default if no party found
          if (writerParty && revenueType) {
            splitPct = revenueType === 'performance' ? writerParty.performance_percentage
              : revenueType === 'mechanical' ? writerParty.mechanical_percentage
              : revenueType === 'synch' ? writerParty.synch_percentage
              : writerParty.performance_percentage; // fallback for 'other'
          }
          const allocatedAmount = (allocation.gross_royalty_amount || 0) * (splitPct / 100);

          return {
            payout_id: payout.id,
            royalty_id: allocation.id,
            allocated_amount: allocatedAmount,
            revenue_type: revenueType || null,
            party_id: writerParty?.id || null,
            party_role: writerParty?.party_type || 'writer',
            split_percentage: splitPct,
            controlled_status: writerParty?.controlled_status || 'C',
            contract_id: agreementId || null,
            ownership_snapshot: writerParty ? {
              party_name: writerParty.name,
              performance_percentage: writerParty.performance_percentage,
              mechanical_percentage: writerParty.mechanical_percentage,
              synch_percentage: writerParty.synch_percentage,
              controlled_status: writerParty.controlled_status,
              applied_split: splitPct,
              revenue_type: revenueType,
            } : null,
          };
        });

        const { error: linkError } = await supabase
          .from('payout_royalties')
          .insert(payoutRoyalties);

        if (linkError) throw linkError;

        // Get payees for this writer to link them to the payout
        const { data: payees } = await supabase
          .from('payees')
          .select('id')
          .eq('user_id', user.id)
          .eq('writer_id', writerMatch.writer_uuid);

        // Update quarterly balance reports for each payee
        if (payees && payees.length > 0) {
          await updateQuarterlyReports(payees, writerMatch.total_amount, quarter, year);
        }

        payoutSummaries.push({
          writer_id: writerMatch.writer_id,
          writer_name: writerMatch.writer_name,
          payout_id: payout.id,
          total_amount: writerMatch.total_amount,
          royalty_count: writerMatch.royalty_allocations.length,
          payee_count: payees?.length || 0,
        });

      } catch (error) {
        console.error(`Error creating payout for writer ${writerMatch.writer_name}:`, error);
        toast({
          title: "Warning",
          description: `Failed to create payout for writer ${writerMatch.writer_name}`,
          variant: "destructive",
        });
      }
    }

    return payoutSummaries;
  };

  // Update quarterly balance reports for payees
  const updateQuarterlyReports = async (
    payees: any[],
    totalAmount: number,
    quarter: number,
    year: number
  ) => {
    if (!user) return;

    for (const payee of payees) {
      try {
        // Check if quarterly report exists
        const { data: existingReport } = await supabase
          .from('quarterly_balance_reports')
          .select('id, opening_balance')
          .eq('user_id', user.id)
          .eq('payee_id', payee.id)
          .eq('quarter', quarter)
          .eq('year', year)
          .single();

        if (existingReport) {
          // Update existing report
          await supabase
            .from('quarterly_balance_reports')
            .update({
              royalties_amount: totalAmount,
              closing_balance: (existingReport.opening_balance || 0) + totalAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingReport.id);
        } else {
          // Create new quarterly report
          await supabase
            .from('quarterly_balance_reports')
            .insert({
              user_id: user.id,
              payee_id: payee.id,
              quarter: quarter,
              year: year,
              opening_balance: 0,
              royalties_amount: totalAmount,
              expenses_amount: 0,
              payments_amount: 0,
              closing_balance: totalAmount,
            });
        }
      } catch (error) {
        console.error(`Error updating quarterly report for payee ${payee.id}:`, error);
      }
    }
  };

  // Main function to process batch with writer-level payouts
  const processBatchToWriterPayouts = async (
    batchId: string,
    quarter: number,
    year: number
  ): Promise<{ success: boolean; summary: WriterPayoutSummary[] }> => {
    if (!user) return { success: false, summary: [] };

    setProcessing(true);
    try {
      // Get royalty allocations for the batch
      const { data: allocations, error: allocationsError } = await supabase
        .from('royalty_allocations')
        .select('*')
        .eq('user_id', user.id)
        .eq('batch_id', batchId);

      if (allocationsError) throw allocationsError;

      if (!allocations || allocations.length === 0) {
        toast({
          title: "Error",
          description: "No royalty allocations found for this batch",
          variant: "destructive",
        });
        return { success: false, summary: [] };
      }

      // Match royalties to writers
      const writerMatches = await matchRoyaltiesToWriters(allocations);

      if (writerMatches.length === 0) {
        toast({
          title: "Warning",
          description: "No writers matched for the royalty allocations in this batch",
          variant: "destructive",
        });
        return { success: false, summary: [] };
      }

      // Create writer-specific payouts
      const payoutSummaries = await createWriterPayouts(writerMatches, quarter, year, batchId);

      // Update batch as processed
      const { error: updateError } = await supabase
        .from('reconciliation_batches')
        .update({
          processed_at: new Date().toISOString(),
          processed_by_user_id: user.id,
          processing_count: 1,
        })
        .eq('id', batchId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Batch processed successfully. Created ${payoutSummaries.length} writer-specific payouts.`,
      });

      return { success: true, summary: payoutSummaries };

    } catch (error: any) {
      console.error('Error processing batch to writer payouts:', error);
      toast({
        title: "Error",
        description: "Failed to process batch to writer payouts",
        variant: "destructive",
      });
      return { success: false, summary: [] };
    } finally {
      setProcessing(false);
    }
  };

  return {
    matchRoyaltiesToWriters,
    createWriterPayouts,
    processBatchToWriterPayouts,
    processing,
  };
};