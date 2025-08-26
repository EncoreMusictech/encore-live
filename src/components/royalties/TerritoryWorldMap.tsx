import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface TerritoryData {
  name: string;
  value: number;
}

interface TerritoryWorldMapProps {
  territoryData: TerritoryData[];
}

const TerritoryWorldMap: React.FC<TerritoryWorldMapProps> = ({ territoryData }) => {
  // Prepare data for the bar chart
  const chartData = territoryData.map((territory) => ({
    territory: territory.name,
    amount: territory.value,
  }));

  // Chart configuration
  const chartConfig = {
    amount: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Royalties x Territory</CardTitle>
        <CardDescription>Revenue distribution by territory (bar chart)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[400px] w-full"
        >
          <BarChart data={chartData}>
            <XAxis 
              dataKey="territory" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent />}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TerritoryWorldMap;