import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnrichmentHistoryEntry {
  id: string;
  copyright_id: string;
  enriched_at: string;
  source: 'MLC' | 'ASCAP' | 'BMI' | 'Manual' | 'Other';
  search_params: Record<string, any> | null;
  data_added: Record<string, any> | null;
  confidence: number | null;
  writers_found: number;
  publishers_found: number;
  recordings_found: number;
  user_id: string;
  created_at: string;
}

export interface CreateEnrichmentHistoryParams {
  copyright_id: string;
  source: 'MLC' | 'ASCAP' | 'BMI' | 'Manual' | 'Other';
  search_params?: Record<string, any>;
  data_added?: Record<string, any>;
  confidence?: number;
  writers_found?: number;
  publishers_found?: number;
  recordings_found?: number;
}

export function useEnrichmentHistory() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EnrichmentHistoryEntry[]>([]);
  const { toast } = useToast();

  const fetchHistory = useCallback(async (copyrightId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('enrichment_history')
        .select('*')
        .order('enriched_at', { ascending: false });

      if (copyrightId) {
        query = query.eq('copyright_id', copyrightId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setHistory(data as EnrichmentHistoryEntry[]);
      return data as EnrichmentHistoryEntry[];
    } catch (error) {
      console.error('Error fetching enrichment history:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const logEnrichment = useCallback(async (params: CreateEnrichmentHistoryParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user for enrichment logging');
        return null;
      }

      const { data, error } = await supabase
        .from('enrichment_history')
        .insert({
          copyright_id: params.copyright_id,
          source: params.source,
          search_params: params.search_params || null,
          data_added: params.data_added || null,
          confidence: params.confidence || null,
          writers_found: params.writers_found || 0,
          publishers_found: params.publishers_found || 0,
          recordings_found: params.recordings_found || 0,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging enrichment:', error);
      return null;
    }
  }, []);

  const updateCopyrightWithMLCData = useCallback(async (
    copyrightId: string,
    mlcData: {
      mlc_work_id?: string;
      mlc_song_code?: string;
      iswc?: string;
      confidence?: number;
    }
  ) => {
    try {
      const updateData: Record<string, any> = {
        mlc_enriched_at: new Date().toISOString(),
        mlc_source: 'MLC'
      };

      if (mlcData.mlc_work_id) updateData.mlc_work_id = mlcData.mlc_work_id;
      if (mlcData.mlc_song_code) updateData.mlc_song_code = mlcData.mlc_song_code;
      if (mlcData.iswc) updateData.iswc = mlcData.iswc;
      if (mlcData.confidence !== undefined) updateData.mlc_confidence = mlcData.confidence;

      const { error } = await supabase
        .from('copyrights')
        .update(updateData)
        .eq('id', copyrightId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating copyright with MLC data:', error);
      return false;
    }
  }, []);

  const getEnrichmentStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enrichment_history')
        .select('source, confidence')
        .order('enriched_at', { ascending: false });

      if (error) throw error;

      const stats = {
        totalEnrichments: data.length,
        bySource: {} as Record<string, number>,
        avgConfidence: 0
      };

      let confidenceSum = 0;
      let confidenceCount = 0;

      data.forEach(entry => {
        // Count by source
        stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + 1;
        
        // Sum confidence for average
        if (entry.confidence) {
          confidenceSum += entry.confidence;
          confidenceCount++;
        }
      });

      stats.avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting enrichment stats:', error);
      return {
        totalEnrichments: 0,
        bySource: {},
        avgConfidence: 0
      };
    }
  }, []);

  const clearHistory = useCallback(async (copyrightId: string) => {
    try {
      const { error } = await supabase
        .from('enrichment_history')
        .delete()
        .eq('copyright_id', copyrightId);

      if (error) throw error;
      
      toast({
        title: "History Cleared",
        description: "Enrichment history for this copyright has been cleared."
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing enrichment history:', error);
      toast({
        title: "Error",
        description: "Failed to clear enrichment history.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    loading,
    history,
    fetchHistory,
    logEnrichment,
    updateCopyrightWithMLCData,
    getEnrichmentStats,
    clearHistory
  };
}
