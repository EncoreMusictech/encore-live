import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RevenueSource {
  id?: string;
  catalog_valuation_id?: string;
  user_id?: string;
  revenue_type: 'streaming' | 'sync' | 'performance' | 'mechanical' | 'merchandise' | 'touring' | 'publishing' | 'master_licensing' | 'other';
  revenue_source: string;
  annual_revenue: number;
  currency: string;
  growth_rate: number;
  confidence_level: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
  notes?: string;
  supporting_documents?: any[];
  created_at?: string;
  updated_at?: string;
}

export const useCatalogRevenueSources = (catalogValuationId?: string) => {
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveCatalogValuationId, setEffectiveCatalogValuationId] = useState<string | null>(catalogValuationId || null);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Auto-fetch the most recent catalog valuation if none provided
  useEffect(() => {
    const fetchMostRecentValuation = async () => {
      console.log('[useCatalogRevenueSources] useEffect triggered', { catalogValuationId, isResetting });
      
      // If we're explicitly resetting, clear the effective ID
      if (isResetting) {
        console.log('[useCatalogRevenueSources] Resetting - clearing effectiveCatalogValuationId');
        setEffectiveCatalogValuationId(null);
        return;
      }
      
      // If a catalogValuationId is provided (not undefined), use it (even if null)
      if (catalogValuationId !== undefined) {
        console.log('[useCatalogRevenueSources] Setting effectiveCatalogValuationId to:', catalogValuationId);
        setEffectiveCatalogValuationId(catalogValuationId);
        return;
      }

      // Otherwise, try to fetch the most recent catalog valuation
      console.log('[useCatalogRevenueSources] No catalogValuationId provided, fetching most recent');
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data, error } = await supabase
          .from('catalog_valuations')
          .select('id')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          console.log('[useCatalogRevenueSources] Found most recent valuation:', data.id);
          setEffectiveCatalogValuationId(data.id);
        } else {
          console.log('[useCatalogRevenueSources] No recent valuation found');
        }
      } catch (error) {
        console.log('Could not fetch most recent catalog valuation:', error);
      }
    };

    fetchMostRecentValuation();
  }, [catalogValuationId, isResetting]);

  // Fetch revenue sources for a specific catalog valuation
  const fetchRevenueSources = async (valuationId: string) => {
    if (!valuationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('catalog_revenue_sources')
        .select('*')
        .eq('catalog_valuation_id', valuationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRevenueSources((data || []) as RevenueSource[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch revenue sources';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new revenue source
  const addRevenueSource = async (revenueSource: RevenueSource) => {
    console.log('[useCatalogRevenueSources] addRevenueSource called', { effectiveCatalogValuationId, catalogValuationId });
    
    if (!effectiveCatalogValuationId) {
      console.error('[useCatalogRevenueSources] No effectiveCatalogValuationId available');
      toast({
        title: 'Error',
        description: 'No catalog valuation found. Please complete a catalog valuation first.',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('catalog_revenue_sources')
        .insert({
          ...revenueSource,
          catalog_valuation_id: effectiveCatalogValuationId,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setRevenueSources(prev => [data as RevenueSource, ...prev]);
      toast({
        title: 'Success',
        description: 'Revenue source added successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add revenue source';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing revenue source
  const updateRevenueSource = async (id: string, updates: Partial<RevenueSource>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('catalog_revenue_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRevenueSources(prev => 
        prev.map(source => source.id === id ? (data as RevenueSource) : source)
      );
      
      toast({
        title: 'Success',
        description: 'Revenue source updated successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update revenue source';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a revenue source
  const deleteRevenueSource = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('catalog_revenue_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRevenueSources(prev => prev.filter(source => source.id !== id));
      toast({
        title: 'Success',
        description: 'Revenue source deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete revenue source';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calculate total additional revenue and diversification score
  const calculateRevenueMetrics = () => {
    const totalRevenue = revenueSources.reduce((sum, source) => sum + source.annual_revenue, 0);
    const revenueTypes = new Set(revenueSources.map(source => source.revenue_type));
    const diversificationScore = Math.min(revenueTypes.size / 9, 1); // Max 9 revenue types
    
    return {
      totalAdditionalRevenue: totalRevenue,
      revenueDiversificationScore: diversificationScore,
      revenueBreakdown: revenueSources.reduce((acc, source) => {
        acc[source.revenue_type] = (acc[source.revenue_type] || 0) + source.annual_revenue;
        return acc;
      }, {} as Record<string, number>),
    };
  };

  // Import revenue sources from CSV data
  const importRevenueSources = async (csvData: RevenueSource[]) => {
    if (!effectiveCatalogValuationId) {
      toast({
        title: 'Error',
        description: 'No catalog valuation found. Please complete a catalog valuation first.',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

        const sourcesToInsert = csvData.map(source => ({
          ...source,
          catalog_valuation_id: effectiveCatalogValuationId,
          user_id: userData.user.id,
        }));

      const { data, error } = await supabase
        .from('catalog_revenue_sources')
        .insert(sourcesToInsert)
        .select();

      if (error) throw error;

      setRevenueSources(prev => [...((data || []) as RevenueSource[]), ...prev]);
      toast({
        title: 'Success',
        description: `${data?.length || 0} revenue sources imported successfully`,
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import revenue sources';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load revenue sources when effectiveCatalogValuationId changes
  useEffect(() => {
    if (effectiveCatalogValuationId) {
      fetchRevenueSources(effectiveCatalogValuationId);
    } else {
      // Clear revenue sources when no catalog valuation ID is available
      setRevenueSources([]);
    }
  }, [effectiveCatalogValuationId]);

  // Reset revenue sources and prevent auto-fetching
  const resetRevenueSources = () => {
    setIsResetting(true);
    setRevenueSources([]);
    setEffectiveCatalogValuationId(null);
    setError(null);
    // Reset the resetting flag after a short delay to allow for new searches
    setTimeout(() => setIsResetting(false), 100);
  };

  return {
    revenueSources,
    loading,
    error,
    addRevenueSource,
    updateRevenueSource,
    deleteRevenueSource,
    importRevenueSources,
    calculateRevenueMetrics,
    resetRevenueSources,
    refetch: () => effectiveCatalogValuationId && fetchRevenueSources(effectiveCatalogValuationId),
  };
};