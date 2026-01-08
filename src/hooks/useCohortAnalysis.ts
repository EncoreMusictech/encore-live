import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CohortData {
  id: string;
  cohort_period: string;
  cohort_name: string;
  cohort_type: string;
  cohort_size: number;
  retention_data: any;
  revenue_data: any;
  churn_data: any;
  calculated_metrics: any;
  is_active: boolean;
  created_at: string;
}

export function useCohortAnalysis() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('cohort_analysis')
        .select('*')
        .order('cohort_period', { ascending: false })
        .limit(12);

      if (fetchError) throw fetchError;

      const formattedCohorts: CohortData[] = (data || []).map(cohort => ({
        id: cohort.id,
        cohort_period: cohort.cohort_period,
        cohort_name: cohort.cohort_name,
        cohort_type: cohort.cohort_type,
        cohort_size: cohort.customer_count,
        retention_data: cohort.retention_data,
        revenue_data: cohort.revenue_data,
        churn_data: cohort.churn_data,
        calculated_metrics: cohort.calculated_metrics,
        is_active: cohort.is_active ?? true,
        created_at: cohort.created_at || new Date().toISOString(),
      }));

      setCohorts(formattedCohorts);
    } catch (err) {
      console.error('Error fetching cohort data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cohort data');
    } finally {
      setLoading(false);
    }
  };

  const generateCohortAnalysis = async (startDate: string, endDate: string) => {
    try {
      setError(null);
      
      const { data, error: invokeError } = await supabase.functions.invoke('generate-cohort-analysis', {
        body: { startDate, endDate }
      });

      if (invokeError) throw invokeError;
      
      await fetchCohorts();
      return data;
    } catch (err) {
      console.error('Error generating cohort analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cohort analysis');
      return null;
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, [user]);

  return {
    cohorts,
    loading,
    error,
    fetchCohorts,
    generateCohortAnalysis,
  };
}
