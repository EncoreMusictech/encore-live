import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  Calculator,
  CreditCard,
  Download,
  RefreshCw
} from "lucide-react";
import { RevenueChart } from "../RevenueChart";
import { BusinessIntelligenceDashboard } from "../BusinessIntelligenceDashboard";
import { PredictiveForecastingEngine } from "../PredictiveForecastingEngine";
import { FinancialKPIDashboard } from "../financial/FinancialKPIDashboard";
import { CashFlowProjectionChart } from "../financial/CashFlowProjectionChart";
import { useEnhancedOperationsData } from "@/hooks/useEnhancedOperationsData";

interface FinancialTabProps {
  metrics: any;
}

export function FinancialTab({ metrics }: FinancialTabProps) {
  const { 
    financialMetrics, 
    quarterlyData, 
    revenueEvents,
    loading, 
    refreshData 
  } = useEnhancedOperationsData();

  const handleExportReport = () => {
    // Export executive summary - placeholder for now
    console.log('Exporting executive financial report...');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Financial Performance Dashboard</CardTitle>
              <CardDescription>
                Real-time KPIs tracking toward $324K Year 1 target with 68% profit margins
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
              <Button size="sm" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Financial Dashboard */}
      <FinancialTab metrics={metrics} />

      {/* Executive Export Report */}
      <ExecutiveExportReport 
        financialMetrics={financialMetrics}
        customerMetrics={metrics}
        supportMetrics={metrics}
      />

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Revenue Trends Analysis
          </CardTitle>
          <CardDescription>
            Monthly revenue and customer acquisition trends with growth projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>

      {/* Business Intelligence */}
      <BusinessIntelligenceDashboard />

      {/* Predictive Forecasting */}
      <PredictiveForecastingEngine />
    </div>
  );
}