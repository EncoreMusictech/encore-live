import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useOperationsData } from "@/hooks/useOperationsData";
import { useMemo } from "react";

export function RevenueChart() {
  const { revenueEvents } = useOperationsData();

  const chartData = useMemo(() => {
    // Group revenue events by month
    const monthlyData = new Map<string, { month: string; revenue: number; customers: number; churn: number; }>();
    
    revenueEvents.forEach(event => {
      const date = new Date(event.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { month: monthLabel, revenue: 0, customers: 0, churn: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      
      if (event.event_type === 'signup' || event.event_type === 'upgrade' || event.event_type === 'payment_success') {
        data.revenue += event.revenue_amount;
      }
      
      if (event.event_type === 'signup') {
        data.customers += 1;
      }
      
      if (event.event_type === 'churn') {
        data.churn += 1;
      }
    });
    
    // Convert to array and sort by month
    const sortedData = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, data]) => data)
      .slice(-6); // Last 6 months
    
    return sortedData;
  }, [revenueEvents]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1">
            <p className="text-primary">
              Revenue: ${payload.find((p: any) => p.dataKey === 'revenue')?.value?.toLocaleString() || 0}
            </p>
            <p className="text-success">
              New Customers: {payload.find((p: any) => p.dataKey === 'customers')?.value || 0}
            </p>
            <p className="text-destructive">
              Churn: {payload.find((p: any) => p.dataKey === 'churn')?.value || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-muted-foreground"
              fontSize={12}
            />
            <YAxis 
              className="text-muted-foreground"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Growth Line Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-muted-foreground"
              fontSize={12}
            />
            <YAxis 
              className="text-muted-foreground"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="customers" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              name="New Customers"
            />
            <Line 
              type="monotone" 
              dataKey="churn" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              name="Churned"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}