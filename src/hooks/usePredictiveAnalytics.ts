import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PredictiveInsight {
  id: string;
  customer_user_id: string;
  insight_type: string;
  confidence_score: number;
  prediction_data: any;
  predicted_outcome: string;
  risk_factors: string[];
  recommended_actions: string[];
  created_at: string;
}

export function usePredictiveAnalytics() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      // Generate mock insights based on existing operations data
      const mockInsights: PredictiveInsight[] = [
        {
          id: '1',
          customer_user_id: 'user-1',
          insight_type: 'churn_risk',
          confidence_score: 0.85,
          prediction_data: { risk_factors: ['declining_usage', 'payment_delays'] },
          predicted_outcome: 'High risk of churn within 30 days',
          risk_factors: ['Declining usage patterns', 'Payment delays', 'Support ticket volume'],
          recommended_actions: ['Proactive outreach', 'Discount offer', 'Success manager engagement'],
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          customer_user_id: 'user-2',
          insight_type: 'expansion_opportunity',
          confidence_score: 0.92,
          prediction_data: { growth_indicators: ['high_usage', 'feature_adoption'] },
          predicted_outcome: 'Ready for upsell within 14 days',
          risk_factors: [],
          recommended_actions: ['Schedule upgrade call', 'Send pricing options', 'Demo advanced features'],
          created_at: new Date().toISOString(),
        },
      ];
      
      setInsights(mockInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics-engine');
      if (error) throw error;
      await fetchInsights();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      return null;
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return {
    insights,
    loading,
    error,
    fetchInsights,
    generateInsights,
  };
}