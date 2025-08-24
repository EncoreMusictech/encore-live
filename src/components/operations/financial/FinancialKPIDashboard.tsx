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
  metrics: {
    mrr: number;
    arr: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    growthRate: number;
    targetRevenue: number;
    targetProfitMargin: number;
  };
}

export function FinancialKPIDashboard({ metrics }: FinancialKPIProps) {
  const kpis = [
    {
      title: "Monthly Recurring Revenue",
      value: metrics.mrr,
      format: "currency",
      icon: DollarSign,
      trend: metrics.growthRate > 0 ? "up" : "down",
      trendValue: `+${metrics.growthRate.toFixed(1)}%`,
      subtitle: "Current MRR"
    },
    {
      title: "Annual Recurring Revenue", 
      value: metrics.arr,
      format: "currency",
      icon: BarChart3,
      trend: "up",
      trendValue: `$${(metrics.targetRevenue / 1000).toFixed(0)}K target`,
      subtitle: "Projected ARR",
      progress: (metrics.arr / metrics.targetRevenue) * 100
    },
    {
      title: "Gross Profit",
      value: metrics.grossProfit,
      format: "currency", 
      icon: TrendingUp,
      trend: "up",
      trendValue: `${((metrics.grossProfit / (metrics.mrr * 12)) * 100).toFixed(1)}%`,
      subtitle: "Revenue - Direct Costs"
    },
    {
      title: "Net Profit",
      value: metrics.netProfit,
      format: "currency",
      icon: Target,
      trend: metrics.netProfit > 0 ? "up" : "down", 
      trendValue: `${((metrics.netProfit / (metrics.mrr * 12)) * 100).toFixed(1)}%`,
      subtitle: "After All Expenses"
    },
    {
      title: "Profit Margin %",
      value: metrics.profitMargin,
      format: "percentage",
      icon: Calculator,
      trend: metrics.profitMargin >= metrics.targetProfitMargin ? "up" : "down",
      trendValue: `${metrics.targetProfitMargin}% target`,
      subtitle: "Net Profit / Revenue",
      progress: (metrics.profitMargin / metrics.targetProfitMargin) * 100
    },
    {
      title: "Growth Rate",
      value: metrics.growthRate,
      format: "percentage",
      icon: PieChart,
      trend: metrics.growthRate > 50 ? "up" : "neutral",
      trendValue: "99% target",
      subtitle: "Year-over-Year",
      progress: metrics.growthRate > 0 ? (metrics.growthRate / 99) * 100 : 0
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return value >= 1000000 
          ? `$${(value / 1000000).toFixed(1)}M`
          : value >= 1000
          ? `$${(value / 1000).toFixed(0)}K`
          : `$${value.toLocaleString()}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
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