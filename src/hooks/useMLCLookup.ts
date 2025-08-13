import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MLCLookupParams {
  workTitle?: string;
  writerName?: string;
  publisherName?: string;
  iswc?: string;
}

export interface MLCWriter {
  name: string;
  ipi?: string;
  share?: number;
  role?: string;
  cae?: string;
}

export interface MLCPublisher {
  name: string;
  ipi?: string;
  share?: number;
  cae?: string;
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
}

export interface MLCLookupResult {
  found: boolean;
  writers: MLCWriter[];
  publishers: MLCPublisher[];
  metadata: MLCMetadata;
  confidence?: number;
  totalMatches?: number;
  verification_notes?: string;
  error?: string;
}

export function useMLCLookup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MLCLookupResult | null>(null);
  const { toast } = useToast();

  const lookupWork = async (params: MLCLookupParams): Promise<MLCLookupResult | null> => {
    if (!params.workTitle && !params.writerName && !params.iswc) {
      toast({
        title: "Search Parameters Required",
        description: "Please provide at least a work title, writer name, or ISWC",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mlc-repertoire-lookup', {
        body: params
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.found) {
        toast({
          title: "MLC Data Found",
          description: `Found work with ${data.writers?.length || 0} writers and ${data.publishers?.length || 0} publishers`
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
        error: error.message || 'Failed to search MLC database'
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

  const clearResult = () => {
    setResult(null);
  };

  return {
    loading,
    result,
    lookupWork,
    clearResult
  };
}