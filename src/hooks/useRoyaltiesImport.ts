import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface RoyaltiesImportStaging {
  id: string;
  user_id: string;
  batch_id: string;
  statement_id: string;
  original_filename: string;
  detected_source: string;
  mapping_version: string;
  raw_data: any;
  mapped_data: any;
  validation_status: any;
  unmapped_fields: string[];
  processing_status: 'pending' | 'processed' | 'failed' | 'needs_review';
  work_matches: any;
  payee_matches: any;
  import_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SourceMappingConfig {
  id: string;
  source_name: string;
  mapping_rules: any;
  header_patterns: string[];
  version: string;
  is_active: boolean;
}

export function useRoyaltiesImport(batchId?: string) {
  const [stagingRecords, setStagingRecords] = useState<RoyaltiesImportStaging[]>([]);
  const [mappingConfigs, setMappingConfigs] = useState<SourceMappingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStagingRecords = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('royalties_import_staging')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStagingRecords(data as RoyaltiesImportStaging[] || []);
    } catch (error) {
      console.error('Error fetching staging records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch import records",
        variant: "destructive",
      });
    }
  };

  const fetchMappingConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('source_mapping_config')
        .select('*')
        .eq('is_active', true)
        .order('source_name');

      if (error) throw error;
      setMappingConfigs(data || []);
    } catch (error) {
      console.error('Error fetching mapping configs:', error);
    }
  };

  const createStagingRecord = async (recordData: Omit<RoyaltiesImportStaging, 'id' | 'user_id' | 'statement_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('royalties_import_staging')
        .insert({
          ...recordData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchStagingRecords();
      toast({
        title: "Success",
        description: "Import record created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating staging record:', error);
      toast({
        title: "Error",
        description: "Failed to create import record",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStagingRecord = async (id: string, updates: Partial<RoyaltiesImportStaging>) => {
    try {
      const { error } = await supabase
        .from('royalties_import_staging')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchStagingRecords();
      toast({
        title: "Success",
        description: "Import record updated successfully",
      });
    } catch (error) {
      console.error('Error updating staging record:', error);
      toast({
        title: "Error",
        description: "Failed to update import record",
        variant: "destructive",
      });
    }
  };

  const updateMappingConfig = async (sourceName: string, mappingRules: any, headerPatterns: string[]) => {
    if (!user) return null;

    try {
      // Check if mapping config exists for this source
      const { data: existingConfig } = await supabase
        .from('source_mapping_config')
        .select('*')
        .eq('source_name', sourceName)
        .eq('is_active', true)
        .single();

      if (existingConfig) {
        // Update existing mapping
        const { data, error } = await supabase
          .from('source_mapping_config')
          .update({
            mapping_rules: mappingRules,
            header_patterns: headerPatterns,
            version: '1.1', // Increment version for user customizations
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) throw error;
        
        await fetchMappingConfigs();
        toast({
          title: "Mapping Updated",
          description: `Updated mapping configuration for ${sourceName}`,
        });
        
        return data;
      } else {
        // Create new mapping config
        const { data, error } = await supabase
          .from('source_mapping_config')
          .insert({
            source_name: sourceName,
            mapping_rules: mappingRules,
            header_patterns: headerPatterns,
            version: '1.1',
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        
        await fetchMappingConfigs();
        toast({
          title: "Mapping Saved",
          description: `Created new mapping configuration for ${sourceName}`,
        });
        
        return data;
      }
    } catch (error) {
      console.error('Error updating mapping config:', error);
      toast({
        title: "Error",
        description: "Failed to save mapping configuration",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteStagingRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('royalties_import_staging')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStagingRecords();
      toast({
        title: "Success",
        description: "Import record deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting staging record:', error);
      toast({
        title: "Error",
        description: "Failed to delete import record",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStagingRecords(), fetchMappingConfigs()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, batchId]);

  return {
    stagingRecords,
    mappingConfigs,
    loading,
    createStagingRecord,
    updateStagingRecord,
    deleteStagingRecord,
    updateMappingConfig,
    refreshRecords: fetchStagingRecords,
  };
}