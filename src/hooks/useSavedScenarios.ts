import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SavedScenario {
  id: string;
  user_id: string;
  scenario_name: string;
  artist_name: string;
  valuation_amount: number | null;
  risk_adjusted_value: number | null;
  dcf_valuation: number | null;
  multiple_valuation: number | null;
  confidence_score: number | null;
  total_streams: number | null;
  monthly_listeners: number | null;
  popularity_score: number | null;
  ltm_revenue: number | null;
  discount_rate: number | null;
  catalog_age_years: number | null;
  genre: string | null;
  valuation_methodology: string | null;
  has_additional_revenue: boolean | null;
  total_additional_revenue: number | null;
  revenue_diversification_score: number | null;
  top_tracks: any | null;
  forecasts: any | null;
  comparable_artists: any | null;
  cash_flow_projections: any | null;
  industry_benchmarks: any | null;
  notes: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  created_at: string;
  updated_at: string;
  revenue_sources_count?: number;
}

export interface SaveScenarioData {
  scenario_name: string;
  artist_name: string;
  notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  valuation_data: any;
  revenue_sources?: any[];
}

export const useSavedScenarios = () => {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchScenarios = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_valuation_scenarios')
        .select(`
          *,
          catalog_revenue_sources:catalog_revenue_sources(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add revenue sources count to each scenario
      const scenariosWithCounts = data?.map(scenario => ({
        ...scenario,
        revenue_sources_count: Array.isArray(scenario.catalog_revenue_sources) ? scenario.catalog_revenue_sources.length : 0
      })) || [];

      setScenarios(scenariosWithCounts);
    } catch (error: any) {
      console.error('Error fetching scenarios:', error);
      toast({
        title: "Error fetching scenarios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveScenario = async (saveData: SaveScenarioData): Promise<string | null> => {
    if (!user) return null;

    setSaving(true);
    try {
      const { valuation_data, revenue_sources, ...scenarioData } = saveData;
      
      // Prepare scenario data
      const scenarioToSave = {
        user_id: user.id,
        ...scenarioData,
        valuation_amount: valuation_data.valuation_amount,
        risk_adjusted_value: valuation_data.risk_adjusted_value,
        dcf_valuation: valuation_data.dcf_valuation,
        multiple_valuation: valuation_data.multiple_valuation,
        confidence_score: valuation_data.confidence_score,
        total_streams: valuation_data.total_streams,
        monthly_listeners: valuation_data.monthly_listeners,
        popularity_score: valuation_data.popularity_score,
        ltm_revenue: valuation_data.ltm_revenue,
        discount_rate: valuation_data.discount_rate,
        catalog_age_years: valuation_data.catalog_age_years,
        genre: valuation_data.genre,
        valuation_methodology: valuation_data.valuation_methodology,
        has_additional_revenue: valuation_data.has_additional_revenue,
        total_additional_revenue: valuation_data.total_additional_revenue,
        revenue_diversification_score: valuation_data.revenue_diversification_score,
        top_tracks: valuation_data.top_tracks,
        forecasts: valuation_data.forecasts,
        comparable_artists: valuation_data.comparable_artists,
        cash_flow_projections: valuation_data.cash_flow_projections,
        industry_benchmarks: valuation_data.industry_benchmarks,
      };

      const { data: savedScenario, error } = await supabase
        .from('saved_valuation_scenarios')
        .insert(scenarioToSave)
        .select()
        .single();

      if (error) throw error;

      // If there are revenue sources, save them linked to this scenario
      if (revenue_sources && revenue_sources.length > 0 && savedScenario) {
        const revenueSourcesToSave = revenue_sources.map(source => ({
          ...source,
          user_id: user.id,
          catalog_valuation_id: savedScenario.id, // Link to the saved scenario
        }));

        const { error: revenueError } = await supabase
          .from('catalog_revenue_sources')
          .insert(revenueSourcesToSave);

        if (revenueError) {
          console.error('Error saving revenue sources:', revenueError);
          // Don't throw error here, scenario is already saved
        }
      }

      toast({
        title: "Scenario saved successfully",
        description: `"${saveData.scenario_name}" has been saved to your scenarios.`,
      });

      fetchScenarios(); // Refresh the list
      return savedScenario.id;
    } catch (error: any) {
      console.error('Error saving scenario:', error);
      toast({
        title: "Error saving scenario",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      // First delete associated revenue sources
      await supabase
        .from('catalog_revenue_sources')
        .delete()
        .eq('catalog_valuation_id', id);

      // Then delete the scenario
      const { error } = await supabase
        .from('saved_valuation_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Scenario deleted",
        description: "The scenario has been removed from your saved scenarios.",
      });

      fetchScenarios(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting scenario:', error);
      toast({
        title: "Error deleting scenario",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateScenario = async (id: string, updates: Partial<SavedScenario>) => {
    try {
      const { error } = await supabase
        .from('saved_valuation_scenarios')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Scenario updated",
        description: "Changes have been saved successfully.",
      });

      fetchScenarios(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating scenario:', error);
      toast({
        title: "Error updating scenario",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const duplicateScenario = async (scenario: SavedScenario) => {
    if (!user) return;

    try {
      const { id, created_at, updated_at, ...scenarioData } = scenario;
      const duplicatedScenario = {
        ...scenarioData,
        scenario_name: `${scenario.scenario_name} (Copy)`,
        user_id: user.id,
      };

      const { data: newScenario, error } = await supabase
        .from('saved_valuation_scenarios')
        .insert(duplicatedScenario)
        .select()
        .single();

      if (error) throw error;

      // Duplicate revenue sources if they exist
      const { data: revenueSources } = await supabase
        .from('catalog_revenue_sources')
        .select('*')
        .eq('catalog_valuation_id', id);

      if (revenueSources && revenueSources.length > 0) {
        const duplicatedSources = revenueSources.map(source => ({
          ...source,
          id: undefined, // Let database generate new ID
          catalog_valuation_id: newScenario.id,
          created_at: undefined,
          updated_at: undefined,
        }));

        await supabase
          .from('catalog_revenue_sources')
          .insert(duplicatedSources);
      }

      toast({
        title: "Scenario duplicated",
        description: `"${duplicatedScenario.scenario_name}" has been created.`,
      });

      fetchScenarios(); // Refresh the list
    } catch (error: any) {
      console.error('Error duplicating scenario:', error);
      toast({
        title: "Error duplicating scenario",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [user]);

  return {
    scenarios,
    loading,
    saving,
    fetchScenarios,
    saveScenario,
    deleteScenario,
    updateScenario,
    duplicateScenario,
  };
};