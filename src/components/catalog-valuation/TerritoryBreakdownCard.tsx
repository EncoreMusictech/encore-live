import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Globe, DollarSign, TrendingUp, ChevronDown } from "lucide-react";

interface TerritoryBreakdownProps {
  territory: 'global' | 'us-only' | 'international';
  territoryMultiplier: number;
  totalValuation: number;
  domesticShare?: number;
  internationalShare?: number;
}

export function TerritoryBreakdownCard({ 
  territory, 
  territoryMultiplier, 
  totalValuation,
  domesticShare = 0.7,
  internationalShare = 0.3
}: TerritoryBreakdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMarketCharacteristicsOpen, setIsMarketCharacteristicsOpen] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTerritoryInfo = () => {
    switch (territory) {
      case 'us-only':
        return {
          title: '🇺🇸 US Market Focus',
          description: 'Valuation based on domestic market performance only',
          color: 'bg-blue-500',
          domesticValue: totalValuation,
          internationalValue: 0,
          note: 'Higher revenue per stream but smaller addressable market'
        };
      case 'international':
        return {
          title: '🌐 International Markets',
          description: 'Valuation excluding US market performance',
          color: 'bg-green-500',
          domesticValue: 0,
          internationalValue: totalValuation,
          note: 'Lower revenue per stream but larger growth potential'
        };
      default:
        return {
          title: '🌍 Global Markets',
          description: 'Comprehensive worldwide market valuation',
          color: 'bg-purple-500',
          domesticValue: totalValuation * domesticShare,
          internationalValue: totalValuation * internationalShare,
          note: 'Blended approach with territory-specific weightings'
        };
    }
  };

  const territoryInfo = getTerritoryInfo();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-secondary/30 transition-colors cursor-pointer">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Territory Analysis
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription className="text-left">
              Market-specific valuation breakdown and revenue distribution
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Territory Focus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{territoryInfo.title}</h4>
                <Badge variant="secondary">
                  {(territoryMultiplier * 100).toFixed(0)}% Multiplier
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {territoryInfo.description}
              </p>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">
                  {territoryInfo.note}
                </p>
              </div>
            </div>

            {/* Revenue Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Distribution
              </h4>
              
              {territory === 'global' && (
                <>
                  {/* Domestic Market */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">🇺🇸 Domestic (US)</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(territoryInfo.domesticValue)}
                      </span>
                    </div>
                    <Progress value={domesticShare * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {(domesticShare * 100).toFixed(0)}% of total valuation
                    </p>
                  </div>

                  {/* International Markets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">🌐 International</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(territoryInfo.internationalValue)}
                      </span>
                    </div>
                    <Progress value={internationalShare * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {(internationalShare * 100).toFixed(0)}% of total valuation
                    </p>
                  </div>
                </>
              )}

              {territory !== 'global' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {territory === 'us-only' ? '🇺🇸 US Market' : '🌐 International Markets'}
                    </span>
                    <span className="text-sm font-bold">
                      {formatCurrency(totalValuation)}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    100% focused valuation
                  </p>
                </div>
              )}
            </div>

            {/* Market Characteristics */}
            <Collapsible open={isMarketCharacteristicsOpen} onOpenChange={setIsMarketCharacteristicsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Characteristics
                  </h4>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMarketCharacteristicsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Revenue Per Stream</p>
                    <p className="text-xs text-muted-foreground">
                      {territory === 'us-only' ? 'Higher ($0.003-0.004)' : 
                       territory === 'international' ? 'Lower ($0.002-0.003)' : 
                       'Blended ($0.003 avg)'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Market Growth</p>
                    <p className="text-xs text-muted-foreground">
                      {territory === 'us-only' ? 'Mature (3-5%)' : 
                       territory === 'international' ? 'Emerging (5-8%)' : 
                       'Mixed (4-6%)'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Collection Lag</p>
                    <p className="text-xs text-muted-foreground">
                      {territory === 'us-only' ? '3-4 months' : 
                       territory === 'international' ? '6-8 months' : 
                       '4-6 months avg'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Risk Profile</p>
                    <p className="text-xs text-muted-foreground">
                      {territory === 'us-only' ? 'Lower risk' : 
                       territory === 'international' ? 'Higher risk' : 
                       'Diversified risk'}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}