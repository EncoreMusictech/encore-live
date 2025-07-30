import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SavedValuationScenario {
  id?: string;
  user_id?: string;
  scenario_name: string;
  artist_name: string;
  
  // Core valuation data
  valuation_amount?: number;
  risk_adjusted_value?: number;
  dcf_valuation?: number;
  multiple_valuation?: number;
  confidence_score?: number;
  
  // Artist metrics
  total_streams?: number;
  monthly_listeners?: number;
  popularity_score?: number;
  
  // Financial metrics
  ltm_revenue?: number;
  discount_rate?: number;
  catalog_age_years?: number;
  genre?: string;
  
  // Methodology and additional data
  valuation_methodology?: string;
  has_additional_revenue?: boolean;
  total_additional_revenue?: number;
  revenue_diversification_score?: number;
  
  // JSON data for complex objects
  top_tracks?: any[];
  forecasts?: any;
  comparable_artists?: any[];
  cash_flow_projections?: any[];
  industry_benchmarks?: any;
  
  // Metadata
  notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export const useSavedValuations = () => {
  const [savedScenarios, setSavedScenarios] = useState<SavedValuationScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all saved scenarios for the current user
  const fetchSavedScenarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('saved_valuation_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedScenarios((data || []) as SavedValuationScenario[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch saved scenarios';
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

  // Save a new valuation scenario
  const saveScenario = async (scenario: SavedValuationScenario) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_valuation_scenarios')
        .insert({
          ...scenario,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedScenarios(prev => [data as SavedValuationScenario, ...prev]);
      toast({
        title: 'Success',
        description: 'Valuation scenario saved successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save scenario';
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

  // Update an existing scenario
  const updateScenario = async (id: string, updates: Partial<SavedValuationScenario>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_valuation_scenarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSavedScenarios(prev => 
        prev.map(scenario => scenario.id === id ? (data as SavedValuationScenario) : scenario)
      );
      
      toast({
        title: 'Success',
        description: 'Scenario updated successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scenario';
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

  // Delete a scenario
  const deleteScenario = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('saved_valuation_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedScenarios(prev => prev.filter(scenario => scenario.id !== id));
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scenario';
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

  // Toggle favorite status
  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    return updateScenario(id, { is_favorite: isFavorite });
  };

  // Load scenarios when hook is used
  useEffect(() => {
    fetchSavedScenarios();
  }, []);

  return {
    savedScenarios,
    loading,
    error,
    saveScenario,
    updateScenario,
    deleteScenario,
    toggleFavorite,
    refetch: fetchSavedScenarios,
  };
};