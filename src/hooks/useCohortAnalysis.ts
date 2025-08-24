import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CohortData {
  id: string;
  cohort_period: string;
  cohort_size: number;
  retention_data: any;
  revenue_data: any;
  created_at: string;
}

export function useCohortAnalysis() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      
      // Generate mock cohort data
      const mockCohorts: CohortData[] = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const cohortSize = Math.floor(Math.random() * 100) + 50;
        
        return {
          id: `cohort-${i}`,
          cohort_period: date.toISOString().slice(0, 7),
          cohort_size: cohortSize,
          retention_data: {
            month_1: Math.floor(cohortSize * 0.8),
            month_3: Math.floor(cohortSize * 0.6),
            month_6: Math.floor(cohortSize * 0.4),
            month_12: Math.floor(cohortSize * 0.25),
          },
          revenue_data: {
            month_1: cohortSize * 75,
            month_3: cohortSize * 180,
            month_6: cohortSize * 240,
            month_12: cohortSize * 300,
          },
          created_at: new Date().toISOString(),
        };
      });
      
      setCohorts(mockCohorts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cohort data');
    } finally {
      setLoading(false);
    }
  };

  const generateCohortAnalysis = async (startDate: string, endDate: string) => {
    try {
      // Simulate cohort analysis generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchCohorts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cohort analysis');
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  return {
    cohorts,
    loading,
    error,
    fetchCohorts,
    generateCohortAnalysis,
  };
}