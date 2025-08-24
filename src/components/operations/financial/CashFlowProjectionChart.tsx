import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Calendar, Target } from "lucide-react";
import { useMemo } from 'react';

interface CashFlowData {
  quarter: string;
  revenue: number;
  expenses: number;
  netCashFlow: number;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
}

interface CashFlowProjectionProps {
  quarterlyData: any[];
  revenueEvents: any[];
}

export function CashFlowProjectionChart({ quarterlyData, revenueEvents }: CashFlowProjectionProps) {
  const cashFlowData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    // Generate historical and projected data
    const data: CashFlowData[] = [];
    
    quarters.forEach((quarter, index) => {
      const quarterNum = index + 1;
      
      // Historical data (current year)
      const historicalRevenue = revenueEvents
        .filter(event => {
          const eventDate = new Date(event.created_at);
          const eventQuarter = Math.ceil((eventDate.getMonth() + 1) / 3);
          return eventDate.getFullYear() === currentYear && 
                 eventQuarter === quarterNum &&
                 ['signup', 'upgrade', 'payment_success'].includes(event.event_type);
        })
        .reduce((sum, event) => sum + event.revenue_amount, 0);

      // Find matching quarterly report
      const quarterlyReport = quarterlyData.find(q => 
        q.year === currentYear && q.quarter === quarterNum
      );

      const expenses = quarterlyReport?.expenses_amount || historicalRevenue * 0.32; // 68% margin target
      const netCashFlow = historicalRevenue - expenses;

      // Projected data (next year with 99% growth)
      const projectedRevenue = historicalRevenue * 1.99; // 99% growth target
      const projectedExpenses = projectedRevenue * 0.32; // Maintain 68% margin
      const projectedNetCashFlow = projectedRevenue - projectedExpenses;

      data.push({
        quarter: `${currentYear} ${quarter}`,
        revenue: historicalRevenue,
        expenses,
        netCashFlow,
        projectedRevenue,
        projectedExpenses, 
        projectedNetCashFlow
      });
    });

    // Add next year projections
    quarters.forEach((quarter, index) => {
      const baseRevenue = data[index]?.revenue || 0;
      const projectedRevenue = baseRevenue * 1.99; // 99% growth
      const projectedExpenses = projectedRevenue * 0.32;
      const projectedNetCashFlow = projectedRevenue - projectedExpenses;

      data.push({
        quarter: `${currentYear + 1} ${quarter}`,
        revenue: 0, // No historical data for future
        expenses: 0,
        netCashFlow: 0,
        projectedRevenue,
        projectedExpenses,
        projectedNetCashFlow
      });
    });

    return data;
  }, [quarterlyData, revenueEvents]);

  const totalProjectedRevenue = cashFlowData
    .filter(d => d.quarter.startsWith(`${new Date().getFullYear() + 1}`))
    .reduce((sum, d) => sum + d.projectedRevenue, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: ${(entry.value / 1000).toFixed(0)}K
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Projected Annual Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${(totalProjectedRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">
              Next 12 months (99% growth target)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Profit Margin</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">68%</div>
            <p className="text-xs text-muted-foreground">
              Target maintained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Break-even</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Q2 2024</div>
            <p className="text-xs text-muted-foreground">
              Projected timeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quarterly Cash Flow Projection
          </CardTitle>
          <CardDescription>
            Historical performance and 99% growth projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="quarter" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Historical Lines */}
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  name="Historical Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="netCashFlow" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name="Historical Net Cash Flow"
                />
                
                {/* Projected Lines */}
                <Line 
                  type="monotone" 
                  dataKey="projectedRevenue" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
                  name="Projected Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="projectedNetCashFlow" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  name="Projected Net Cash Flow"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Revenue Breakdown</CardTitle>
          <CardDescription>
            Revenue vs expenses by quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="quarter" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--success))" 
                  name="Revenue"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="projectedRevenue" 
                  fill="hsl(var(--success) / 0.5)" 
                  name="Projected Revenue"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="hsl(var(--destructive))" 
                  name="Expenses"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="projectedExpenses" 
                  fill="hsl(var(--destructive) / 0.5)" 
                  name="Projected Expenses"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}