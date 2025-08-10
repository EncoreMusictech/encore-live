import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ReportSection = 'executive' | 'technical' | 'market';

interface GenerateReportParams {
  section: ReportSection;
  valuation: any;
  minWords?: number;
  queries?: string[];
}

export function useReportAI() {
  const [loading, setLoading] = useState(false);

  const generateReport = useCallback(async (params: GenerateReportParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: params,
      });
      if (error) throw error;
      return (data?.html as string) ?? '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, generateReport };
}
