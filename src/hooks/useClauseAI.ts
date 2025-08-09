import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClauseAIParams {
  fieldId: string;
  fieldLabel: string;
  fieldType?: string;
  contractType?: string;
  currentClause?: string;
  values?: Record<string, any>;
  tone?: 'standard' | 'conservative' | 'aggressive' | 'friendly';
  jurisdiction?: string;
}

export function useClauseAI() {
  const [loading, setLoading] = useState(false);

  const generateClause = useCallback(async (params: ClauseAIParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract-clause', {
        body: params,
      });
      if (error) throw error;
      return (data?.suggestion as string) ?? '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, generateClause };
}
