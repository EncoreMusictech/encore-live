import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HistoricalStatement {
  id?: string;
  user_id?: string;
  artist_name: string;
  artist_id?: string;
  catalog_name?: string;
  year: number;
  quarter: number;
  period_label: string;
  statement_type: 'recording' | 'publishing' | 'both';
  gross_revenue: number;
  net_revenue: number;
  streams?: number;
  mechanical_royalties?: number;
  performance_royalties?: number;
  sync_revenue?: number;
  streaming_revenue?: number;
  other_revenue?: number;
  expenses?: number;
  revenue_sources?: Record<string, number>;
  notes?: string;
  file_url?: string;
  source_detected?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatementMetrics {
  averageRevenue: number;
  quarterOverQuarterGrowth: number;
  yearOverYearGrowth: number;
  trendDirection: 'up' | 'down' | 'stable';
  volatility: number;
  projectedNextQuarter: number;
}

export function useHistoricalStatements(artistName?: string) {
  const [statements, setStatements] = useState<HistoricalStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatements = useCallback(async (name?: string) => {
    if (!name && !artistName) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deal_historical_statements')
        .select('*')
        .eq('user_id', user.id)
        .eq('artist_name', name || artistName)
        .order('year', { ascending: true })
        .order('quarter', { ascending: true });

      if (error) throw error;
      // Cast the data to our interface type
      setStatements((data || []) as HistoricalStatement[]);
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch historical statements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [artistName, toast]);

  const addStatement = useCallback(async (statement: Omit<HistoricalStatement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deal_historical_statements')
        .insert({
          ...statement,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Cast the returned data to our interface type
      const typedData = data as HistoricalStatement;
      setStatements(prev => [...prev, typedData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      }));

      toast({
        title: 'Success',
        description: 'Statement added successfully',
      });

      return typedData;
    } catch (error) {
      console.error('Error adding statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to add statement',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updateStatement = useCallback(async (id: string, updates: Partial<HistoricalStatement>) => {
    try {
      const { data, error } = await supabase
        .from('deal_historical_statements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Cast the returned data to our interface type
      const typedData = data as HistoricalStatement;
      setStatements(prev => prev.map(s => s.id === id ? typedData : s));

      toast({
        title: 'Success',
        description: 'Statement updated successfully',
      });

      return typedData;
    } catch (error) {
      console.error('Error updating statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update statement',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteStatement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('deal_historical_statements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStatements(prev => prev.filter(s => s.id !== id));

      toast({
        title: 'Success',
        description: 'Statement deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete statement',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const calculateMetrics = useCallback((): StatementMetrics | null => {
    if (statements.length < 2) return null;

    const revenues = statements.map(s => s.net_revenue);
    const averageRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;

    // Calculate quarter-over-quarter growth
    const qoqGrowths = [];
    for (let i = 1; i < revenues.length; i++) {
      if (revenues[i - 1] > 0) {
        qoqGrowths.push(((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100);
      }
    }
    const quarterOverQuarterGrowth = qoqGrowths.length > 0
      ? qoqGrowths.reduce((sum, g) => sum + g, 0) / qoqGrowths.length
      : 0;

    // Calculate year-over-year growth if we have enough data
    let yearOverYearGrowth = 0;
    if (statements.length >= 4) {
      const lastYearRevenue = statements.slice(-4).reduce((sum, s) => sum + s.net_revenue, 0);
      const previousYearRevenue = statements.slice(-8, -4).reduce((sum, s) => sum + s.net_revenue, 0);
      if (previousYearRevenue > 0) {
        yearOverYearGrowth = ((lastYearRevenue - previousYearRevenue) / previousYearRevenue) * 100;
      }
    }

    // Determine trend direction
    const recentGrowth = qoqGrowths.slice(-3).reduce((sum, g) => sum + g, 0) / Math.max(1, qoqGrowths.slice(-3).length);
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (recentGrowth > 5) trendDirection = 'up';
    else if (recentGrowth < -5) trendDirection = 'down';

    // Calculate volatility (standard deviation of growth rates)
    const meanGrowth = qoqGrowths.reduce((sum, g) => sum + g, 0) / qoqGrowths.length;
    const variance = qoqGrowths.reduce((sum, g) => sum + Math.pow(g - meanGrowth, 2), 0) / qoqGrowths.length;
    const volatility = Math.sqrt(variance);

    // Project next quarter (weighted average of recent trends)
    const recentRevenues = revenues.slice(-4);
    const weights = [0.1, 0.2, 0.3, 0.4]; // More weight to recent quarters
    const weightedGrowth = qoqGrowths.slice(-3).reduce((sum, g, i) => sum + g * weights[i + 1], 0) / 
                           weights.slice(1).reduce((sum, w) => sum + w, 0);
    const projectedNextQuarter = revenues[revenues.length - 1] * (1 + weightedGrowth / 100);

    return {
      averageRevenue,
      quarterOverQuarterGrowth,
      yearOverYearGrowth,
      trendDirection,
      volatility,
      projectedNextQuarter,
    };
  }, [statements]);

  const validateSequence = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (statements.length === 0) {
      return { valid: true, errors: [] };
    }

    if (statements.length > 8) {
      errors.push('Maximum 8 quarters (2 years) allowed');
    }

    // Check for sequential quarters
    for (let i = 1; i < statements.length; i++) {
      const prev = statements[i - 1];
      const curr = statements[i];
      
      const prevIndex = prev.year * 4 + prev.quarter;
      const currIndex = curr.year * 4 + curr.quarter;
      
      if (currIndex !== prevIndex + 1) {
        errors.push(`Gap detected between Q${prev.quarter} ${prev.year} and Q${curr.quarter} ${curr.year}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }, [statements]);

  useEffect(() => {
    if (artistName) {
      fetchStatements();
    }
  }, [artistName, fetchStatements]);

  return {
    statements,
    loading,
    fetchStatements,
    addStatement,
    updateStatement,
    deleteStatement,
    calculateMetrics,
    validateSequence,
    hasData: statements.length > 0,
    dataCount: statements.length,
  };
}
