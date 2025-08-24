import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePredictiveAnalytics } from "@/hooks/usePredictiveAnalytics";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";

export function PredictiveAnalyticsDashboard() {
  const { insights, loading, generateInsights } = usePredictiveAnalytics();
  const [generating, setGenerating] = useState(false);

  const handleGenerateInsights = async () => {
    setGenerating(true);
    await generateInsights();
    setGenerating(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'churn_risk':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'expansion_opportunity':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'usage_trend':
        return <Target className="h-5 w-5 text-primary" />;
      default:
        return <Zap className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">AI-powered insights and predictions</p>
        </div>
        <Button 
          onClick={handleGenerateInsights} 
          disabled={generating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Refresh Insights'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {insights.filter(i => i.insight_type === 'churn_risk').length}
            </div>
            <p className="text-xs text-muted-foreground">High-risk customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Growth Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {insights.filter(i => i.insight_type === 'expansion_opportunity').length}
            </div>
            <p className="text-xs text-muted-foreground">Upsell candidates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.length > 0 
                ? `${Math.round(insights.reduce((acc, i) => acc + i.confidence_score, 0) / insights.length * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Prediction accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Insights</h3>
        
        {insights.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No predictive insights available. Click "Refresh Insights" to generate new predictions.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.insight_type)}
                      <CardTitle className="text-base capitalize">
                        {insight.insight_type.replace('_', ' ')}
                      </CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(insight.confidence_score)}
                    >
                      {Math.round(insight.confidence_score * 100)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{insight.predicted_outcome}</p>
                  
                  <div className="space-y-3">
                    {insight.risk_factors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.risk_factors.map((factor, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                      <div className="flex flex-wrap gap-1">
                        {insight.recommended_actions.map((action, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Confidence Level</span>
                        <span className="text-sm font-medium">
                          {Math.round(insight.confidence_score * 100)}%
                        </span>
                      </div>
                      <Progress value={insight.confidence_score * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}