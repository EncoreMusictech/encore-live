import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Info,
  Music,
  Radio,
  Tv,
  Gamepad2,
  ShirtIcon
} from 'lucide-react';
import { REVENUE_TYPE_MULTIPLIERS, assessPortfolioRisk } from '@/utils/revenueCalculations';

interface RevenueTypeGuideProps {
  currentRevenueSources?: Array<{
    revenue_type: string;
    annual_revenue: number;
    confidence_level: 'low' | 'medium' | 'high';
  }>;
}

export const RevenueTypeGuide: React.FC<RevenueTypeGuideProps> = ({
  currentRevenueSources = []
}) => {
  const riskAssessment = assessPortfolioRisk(currentRevenueSources);
  
  const getIcon = (revenueType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      publishing: <Music className="h-4 w-4" />,
      streaming: <Radio className="h-4 w-4" />,
      sync: <Tv className="h-4 w-4" />,
      mechanical: <Music className="h-4 w-4" />,
      performance: <TrendingUp className="h-4 w-4" />,
      master_licensing: <Radio className="h-4 w-4" />,
      other: <Info className="h-4 w-4" />,
      merchandise: <ShirtIcon className="h-4 w-4" />,
      touring: <TrendingUp className="h-4 w-4" />
    };
    return iconMap[revenueType] || <BarChart3 className="h-4 w-4" />;
  };

  const getRiskColor = (riskLevel: string) => {
    return {
      low: 'bg-green-500',
      medium: 'bg-yellow-500', 
      high: 'bg-red-500'
    }[riskLevel] || 'bg-gray-500';
  };

  const sortedMultipliers = Object.values(REVENUE_TYPE_MULTIPLIERS)
    .sort((a, b) => b.multiplier - a.multiplier);

  return (
    <div className="space-y-6">
      {/* Portfolio Risk Assessment */}
      {currentRevenueSources.length > 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Portfolio Risk Assessment</span>
                <Badge 
                  variant="outline" 
                  className={`${getRiskColor(riskAssessment.riskLevel)} text-white`}
                >
                  {riskAssessment.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Portfolio Score</span>
                  <span>{riskAssessment.score}/100</span>
                </div>
                <Progress value={riskAssessment.score} />
              </div>

              {riskAssessment.recommendations.length > 0 && (
                <div className="text-sm space-y-1">
                  <span className="font-medium">Recommendations:</span>
                  {riskAssessment.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Types Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Type Multipliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Each revenue type has a different multiplier based on industry standards. 
                Higher multipliers reflect more stable and valuable revenue streams.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {sortedMultipliers.map((multiplier) => (
                <div 
                  key={multiplier.type}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIcon(multiplier.type)}
                      <h4 className="font-semibold">{multiplier.label}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {multiplier.multiplier}x multiplier
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${getRiskColor(multiplier.riskLevel)} text-white`}
                      >
                        {multiplier.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {multiplier.description}
                  </p>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Examples:</span>
                    <div className="flex flex-wrap gap-1">
                      {multiplier.examples.map((example, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Valuation Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enhanced Valuation Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">70%</div>
                <div className="text-sm text-muted-foreground">Base Valuation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  From Spotify streaming data
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">30%</div>
                <div className="text-sm text-muted-foreground">Additional Revenue</div>
                <div className="text-xs text-muted-foreground mt-1">
                  From imported revenue sources
                </div>
              </div>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <span className="font-medium">Valuation Formula:</span>
                  <div className="text-sm space-y-1">
                    <div>Enhanced Value = (Base Valuation × 0.7) + (Additional Revenue Value × 0.3)</div>
                    <div>Final Value = Enhanced Value × (1 + Diversification Bonus)</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Diversification bonus up to 20% based on number of revenue types
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <span className="text-sm font-medium">Confidence Adjustments:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded"></div>
                  <span>High: +10%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                  <span>Medium: 0%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded"></div>
                  <span>Low: -20%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Recurring Revenue:</span>
              <div className="text-xs text-muted-foreground">
                One-time revenue sources receive a 40% reduction in valuation multiplier
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};