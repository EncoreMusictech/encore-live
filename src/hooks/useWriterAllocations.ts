import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WriterAllocation {
  id: string;
  sync_license_id: string;
  copyright_id: string;
  writer_id: string;
  writer_name: string;
  ownership_percentage: number;
  allocated_amount: number;
  allocation_type: 'publishing' | 'master' | 'both';
  payment_priority: number;
  recoupment_applicable: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayeeBreakdown {
  writer_id: string;
  writer_name: string;
  total_allocation: number;
  publishing_allocation: number;
  master_allocation: number;
  payment_method?: string;
  payment_address?: string;
  tax_id?: string;
  priority_level: number;
}

export const useWriterAllocations = (syncLicenseId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch writer allocations for a sync license
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['writer-allocations', syncLicenseId],
    queryFn: async () => {
      if (!syncLicenseId) return [];
      
      const { data, error } = await supabase
        .from('writer_allocations' as any)
        .select(`
          *,
          copyright:copyrights(work_title),
          writer:contacts(name, email, payment_info)
        `)
        .eq('sync_license_id', syncLicenseId)
        .order('payment_priority', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!syncLicenseId,
  });

  // Calculate writer allocations based on sync license data
  const calculateAllocations = async (
    syncLicenseId: string,
    pubFee: number,
    masterFee: number,
    selectedCopyrights: any[]
  ): Promise<WriterAllocation[]> => {
    const allocations: WriterAllocation[] = [];

    for (const copyright of selectedCopyrights) {
      // Get controlled writers for this copyright
      const { data: writers, error } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyright.id)
        .eq('controlled_status', 'C');

      if (error || !writers?.length) continue;

      // Calculate per-song allocation
      const pubAllocationPerSong = pubFee / selectedCopyrights.length;
      const masterAllocationPerSong = masterFee / selectedCopyrights.length;

      // Calculate total controlled percentage for this copyright
      const totalControlledPercentage = writers.reduce(
        (sum, writer) => sum + (writer.ownership_percentage || 0), 
        0
      );

      if (totalControlledPercentage === 0) continue;

      // Allocate to each controlled writer
      writers.forEach((writer, index) => {
        const writerPercentage = (writer.ownership_percentage || 0) / totalControlledPercentage;
        
        const pubAllocation = pubAllocationPerSong * writerPercentage;
        const masterAllocation = masterAllocationPerSong * writerPercentage;

        allocations.push({
          id: `temp-${copyright.id}-${writer.id}`,
          sync_license_id: syncLicenseId,
          copyright_id: copyright.id,
          writer_id: writer.id,
          writer_name: writer.writer_name,
          ownership_percentage: writer.ownership_percentage || 0,
          allocated_amount: pubAllocation + masterAllocation,
          allocation_type: 'both',
          payment_priority: index + 1,
          recoupment_applicable: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    return allocations;
  };

  // Generate payee breakdown
  const generatePayeeBreakdown = (allocations: WriterAllocation[]): PayeeBreakdown[] => {
    const writerMap = new Map<string, PayeeBreakdown>();

    allocations.forEach(allocation => {
      const existing = writerMap.get(allocation.writer_id);
      
      if (existing) {
        existing.total_allocation += allocation.allocated_amount;
        if (allocation.allocation_type === 'publishing' || allocation.allocation_type === 'both') {
          existing.publishing_allocation += allocation.allocated_amount;
        }
        if (allocation.allocation_type === 'master' || allocation.allocation_type === 'both') {
          existing.master_allocation += allocation.allocated_amount;
        }
      } else {
        writerMap.set(allocation.writer_id, {
          writer_id: allocation.writer_id,
          writer_name: allocation.writer_name,
          total_allocation: allocation.allocated_amount,
          publishing_allocation: allocation.allocation_type === 'publishing' || allocation.allocation_type === 'both' 
            ? allocation.allocated_amount : 0,
          master_allocation: allocation.allocation_type === 'master' || allocation.allocation_type === 'both' 
            ? allocation.allocated_amount : 0,
          priority_level: allocation.payment_priority,
        });
      }
    });

    return Array.from(writerMap.values()).sort((a, b) => a.priority_level - b.priority_level);
  };

  // Save writer allocations
  const saveAllocations = useMutation({
    mutationFn: async (allocations: Omit<WriterAllocation, 'id' | 'created_at' | 'updated_at'>[]) => {
      // First, delete existing allocations for this sync license
      await supabase
        .from('writer_allocations' as any)
        .delete()
        .eq('sync_license_id', allocations[0]?.sync_license_id);

      // Insert new allocations
      const { data, error } = await supabase
        .from('writer_allocations' as any)
        .insert(allocations)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer-allocations'] });
      toast({
        title: "Success",
        description: "Writer allocations saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save writer allocations",
        variant: "destructive",
      });
    },
  });

  return {
    allocations,
    isLoading,
    calculateAllocations,
    generatePayeeBreakdown,
    saveAllocations,
  };
};