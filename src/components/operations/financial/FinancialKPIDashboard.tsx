import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp,
  Target,
  BarChart3,
  Calculator,
  PieChart
} from "lucide-react";

interface FinancialKPIProps {
  metrics: any; // Accept any metrics structure from unified operations hook
}

export function FinancialKPIDashboard({ metrics }: FinancialKPIProps) {
  // Safely extract values from unified metrics with defaults
  const mrr = metrics?.monthlyRecurringRevenue || 0;
  const arr = metrics?.annualRecurringRevenue || 0;
  const profitMargin = metrics?.profitMargin || 0;
  const growthRate = metrics?.growthRate || 0;
  const customerLifetimeValue = metrics?.customerLifetimeValue || 0;
  const customerAcquisitionCost = metrics?.customerAcquisitionCost || 0;
  
  // Calculate derived values safely
  const targetRevenue = 324000; // $324K target
  const targetProfitMargin = 68; // 68% target
  const grossProfit = (arr * profitMargin) / 100;
  const netProfit = grossProfit * 0.85; // Estimate net after taxes/fees

  const kpis = [
    {
      title: "Monthly Recurring Revenue",
      value: mrr,
      format: "currency",
      icon: DollarSign,
      trend: growthRate > 0 ? "up" : "down",
      trendValue: `+${growthRate.toFixed(1)}%`,
      subtitle: "Current MRR"
    },
    {
      title: "Annual Recurring Revenue", 
      value: arr,
      format: "currency",
      icon: BarChart3,
      trend: "up",
      trendValue: `$${(targetRevenue / 1000).toFixed(0)}K target`,
      subtitle: "Projected ARR",
      progress: targetRevenue > 0 ? (arr / targetRevenue) * 100 : 0
    },
    {
      title: "Customer Lifetime Value",
      value: customerLifetimeValue,
      format: "currency", 
      icon: TrendingUp,
      trend: "up",
      trendValue: `${customerAcquisitionCost > 0 ? (customerLifetimeValue / customerAcquisitionCost).toFixed(1) : '0'}x ROI`,
      subtitle: "LTV per Customer"
    },
    {
      title: "Customer Acquisition Cost",
      value: customerAcquisitionCost,
      format: "currency",
      icon: Target,
      trend: customerAcquisitionCost < 200 ? "up" : "down", 
      trendValue: `$200 target`,
      subtitle: "Cost per Customer"
    },
    {
      title: "Profit Margin %",
      value: profitMargin,
      format: "percentage",
      icon: Calculator,
      trend: profitMargin >= targetProfitMargin ? "up" : "down",
      trendValue: `${targetProfitMargin}% target`,
      subtitle: "Net Profit / Revenue",
      progress: targetProfitMargin > 0 ? (profitMargin / targetProfitMargin) * 100 : 0
    },
    {
      title: "Growth Rate",
      value: growthRate,
      format: "percentage",
      icon: PieChart,
      trend: growthRate > 10 ? "up" : "neutral",
      trendValue: "15% target",
      subtitle: "Year-over-Year",
      progress: growthRate > 0 ? (growthRate / 15) * 100 : 0
    }
  ];

  const formatValue = (value: number | undefined, format: string) => {
    // Handle undefined/null values safely
    const safeValue = value || 0;
    
    switch (format) {
      case "currency":
        return safeValue >= 1000000 
          ? `$${(safeValue / 1000000).toFixed(1)}M`
          : safeValue >= 1000
          ? `$${(safeValue / 1000).toFixed(0)}K`
          : `$${safeValue.toLocaleString()}`;
      case "percentage":
        return `${safeValue.toFixed(1)}%`;
      default:
        return safeValue.toLocaleString();
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-success";
      case "down": return "text-destructive"; 
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <IconComponent className="h-5 w-5 text-primary" />
                <Badge 
                  variant={kpi.trend === "up" ? "default" : kpi.trend === "down" ? "destructive" : "secondary"}
                  className={getTrendColor(kpi.trend)}
                >
                  {kpi.trendValue}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {formatValue(kpi.value, kpi.format)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{kpi.title}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {kpi.subtitle}
              </p>
              {kpi.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Target Progress</span>
                    <span>{Math.min(kpi.progress, 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(kpi.progress, 100)} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}