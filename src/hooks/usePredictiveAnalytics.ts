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

interface PredictiveAnalyticsCache {
  id: string;
  customer_user_id: string;
  prediction_type: string;
  prediction_value: number;
  confidence_score: number;
  contributing_factors: any;
  calculation_date: string;
  expires_at: string;
  model_version: string | null;
  metadata: any;
}

export function usePredictiveAnalytics() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('predictive_analytics_cache')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('calculation_date', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Transform cache data into insight format
      const transformedInsights: PredictiveInsight[] = (data || []).map((cache: PredictiveAnalyticsCache) => {
        const factors = cache.contributing_factors || {};
        const metadata = cache.metadata || {};
        
        return {
          id: cache.id,
          customer_user_id: cache.customer_user_id,
          insight_type: cache.prediction_type,
          confidence_score: cache.confidence_score,
          prediction_data: {
            value: cache.prediction_value,
            factors: factors,
          },
          predicted_outcome: generateOutcome(cache.prediction_type, cache.prediction_value),
          risk_factors: extractRiskFactors(factors),
          recommended_actions: generateRecommendations(cache.prediction_type, cache.prediction_value),
          created_at: cache.calculation_date,
        };
      });

      setInsights(transformedInsights);
    } catch (err) {
      console.error('Error fetching predictive insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setError(null);
      
      const { data, error: invokeError } = await supabase.functions.invoke('predictive-analytics-engine');
      
      if (invokeError) throw invokeError;
      
      await fetchInsights();
      return data;
    } catch (err) {
      console.error('Error generating insights:', err);
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

// Helper functions to transform cache data into actionable insights
function generateOutcome(type: string, value: number): string {
  switch (type) {
    case 'churn_risk':
      if (value >= 0.7) return 'High risk of churn within 30 days';
      if (value >= 0.4) return 'Moderate churn risk - monitor closely';
      return 'Low churn risk - customer is stable';
    case 'expansion_opportunity':
      if (value >= 0.8) return 'Strong upsell opportunity identified';
      if (value >= 0.5) return 'Potential for expansion with engagement';
      return 'Focus on retention before expansion';
    case 'engagement_score':
      if (value >= 0.8) return 'Highly engaged - power user';
      if (value >= 0.5) return 'Moderate engagement - room for improvement';
      return 'Low engagement - needs attention';
    default:
      return `Prediction score: ${(value * 100).toFixed(0)}%`;
  }
}

function extractRiskFactors(factors: any): string[] {
  if (!factors || typeof factors !== 'object') return [];
  
  const riskFactors: string[] = [];
  
  if (factors.usage_decline) riskFactors.push('Declining usage patterns');
  if (factors.payment_issues) riskFactors.push('Payment delays or issues');
  if (factors.support_tickets) riskFactors.push('Elevated support ticket volume');
  if (factors.feature_adoption_low) riskFactors.push('Low feature adoption');
  if (factors.login_frequency_low) riskFactors.push('Infrequent logins');
  if (factors.competitor_mentions) riskFactors.push('Competitor interest signals');
  
  // If we have raw factors as array, use them
  if (Array.isArray(factors.risk_factors)) {
    return factors.risk_factors;
  }
  
  return riskFactors;
}

function generateRecommendations(type: string, value: number): string[] {
  switch (type) {
    case 'churn_risk':
      if (value >= 0.7) {
        return ['Immediate customer success outreach', 'Offer personalized discount', 'Schedule executive check-in'];
      }
      if (value >= 0.4) {
        return ['Schedule quarterly review', 'Share new feature updates', 'Gather feedback'];
      }
      return ['Continue regular engagement', 'Monitor usage trends'];
    case 'expansion_opportunity':
      if (value >= 0.8) {
        return ['Present upgrade options', 'Demo premium features', 'Discuss growth needs'];
      }
      return ['Track feature usage', 'Identify additional needs', 'Build relationship'];
    default:
      return ['Review customer profile', 'Analyze usage patterns', 'Plan outreach strategy'];
  }
}
