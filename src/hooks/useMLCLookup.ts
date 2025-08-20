import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MLCLookupParams {
  workTitle?: string;
  writerName?: string;
  publisherName?: string;
  iswc?: string;
  isrc?: string;
}

export interface MLCWriter {
  writerFirstName: string;
  writerLastName: string;
  writerIPI?: string;
  share?: number;
  role?: string;
  cae?: string;
  name?: string; // computed full name for backward compatibility
}

export interface MLCPublisher {
  publisherName: string;
  administrators?: MLCPublisher[];
  collectionShare?: number[];
  publisherIpiNumber?: string;
  mlcPublisherNumber?: string;
  cae?: string;
  // backward compatibility
  name?: string;
  ipi?: string;
  share?: number;
}

export interface MLCRecording {
  artist: string;
  id: string;
  isrc: string;
  labels: string;
  mlcsongCode: string;
  title: string;
}

export interface MLCWork {
  artists: string;
  iswc: string;
  primaryTitle: string;
  publishers: MLCPublisher[];
  writers: MLCWriter[];
  recordings?: MLCRecording[];
}

export interface MLCMetadata {
  workTitle?: string;
  iswc?: string;
  mlcWorkId?: string;
  registrationDate?: string;
  status?: string;
  workType?: string;
  territory?: string;
  rightsType?: string;
  // Enhanced metadata
  mlcSongCode?: string;
  source?: string;
}

export interface MLCLookupResult {
  found: boolean;
  writers: MLCWriter[];
  publishers: MLCPublisher[];
  metadata: MLCMetadata;
  works?: MLCWork[];
  recordings?: MLCRecording[];
  confidence?: number;
  totalMatches?: number;
  verification_notes?: string;
  error?: string;
  source?: string;
  processingTime?: number;
}

export function useMLCLookup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MLCLookupResult | null>(null);
  const { toast } = useToast();

  const lookupWork = async (params: MLCLookupParams): Promise<MLCLookupResult | null> => {
    if (!params.workTitle && !params.writerName && !params.iswc && !params.isrc) {
      toast({
        title: "Search Parameters Required",
        description: "Please provide at least a work title, writer name, ISWC, or ISRC",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: {
          ...params,
          enhanced: true,
          includeRecordings: true
        }
      });

      if (error) {
        throw error;
      }

      // Add processing time
      data.processingTime = Date.now() - startTime;
      setResult(data);
      
      if (data.found) {
        const recordingCount = data.recordings?.length || 0;
        const workCount = data.works?.length || 0;
        
        toast({
          title: "Enhanced MLC Data Found",
          description: `Found ${workCount} work(s), ${recordingCount} recording(s), ${data.writers?.length || 0} writers, ${data.publishers?.length || 0} publishers`
        });
      }

      return data;
    } catch (error) {
      console.error('MLC lookup error:', error);
      const errorResult: MLCLookupResult = {
        found: false,
        writers: [],
        publishers: [],
        metadata: {},
        works: [],
        recordings: [],
        error: error.message || 'Failed to search MLC database',
        processingTime: Date.now() - startTime
      };
      setResult(errorResult);
      
      toast({
        title: "MLC Lookup Error",
        description: error.message || 'Failed to search MLC database',
        variant: "destructive"
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  const lookupBulk = async (searches: MLCLookupParams[]): Promise<MLCLookupResult[]> => {
    if (!searches || searches.length === 0) {
      return [];
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: {
          bulk: true,
          searches: searches,
          enhanced: true,
          includeRecordings: true
        }
      });

      if (error) {
        throw error;
      }

      const results = data.results || [];
      const totalProcessingTime = Date.now() - startTime;
      
      toast({
        title: "Bulk MLC Lookup Complete",
        description: `Processed ${searches.length} searches in ${(totalProcessingTime/1000).toFixed(1)}s`
      });

      return results;
    } catch (error) {
      console.error('Bulk MLC lookup error:', error);
      toast({
        title: "Bulk MLC Lookup Error",
        description: error.message || 'Failed to perform bulk MLC lookup',
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return {
    loading,
    result,
    lookupWork,
    lookupBulk,
    clearResult
  };
}