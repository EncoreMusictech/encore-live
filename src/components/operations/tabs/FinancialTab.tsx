import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  Calculator,
  CreditCard
} from "lucide-react";
import { RevenueChart } from "../RevenueChart";
import { BusinessIntelligenceDashboard } from "../BusinessIntelligenceDashboard";
import { PredictiveForecastingEngine } from "../PredictiveForecastingEngine";

interface FinancialTabProps {
  metrics: any;
}

export function FinancialTab({ metrics }: FinancialTabProps) {
  return (
    <div className="space-y-6">
      {/* Financial Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">
                +MRR
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              ${metrics.monthlyRecurringRevenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Monthly Recurring Revenue</p>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">+12%</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              $847K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Revenue</p>
            <p className="text-xs text-muted-foreground">
              Year to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Calculator className="h-5 w-5 text-primary" />
              <Badge variant="secondary">ARPU</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">$2,340</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Revenue Per User</p>
            <p className="text-xs text-muted-foreground">
              Monthly average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CreditCard className="h-5 w-5 text-primary" />
              <Badge variant="secondary">LTV</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">$28K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Customer Lifetime Value</p>
            <p className="text-xs text-muted-foreground">
              Average LTV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Revenue Trends
          </CardTitle>
          <CardDescription>
            Monthly revenue and customer acquisition trends
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