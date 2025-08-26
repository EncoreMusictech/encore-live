import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TerritoryData {
  name: string;
  value: number;
}

interface TerritoryWorldMapProps {
  territoryData: TerritoryData[];
}

const TerritoryWorldMap: React.FC<TerritoryWorldMapProps> = ({ territoryData }) => {
  // Territory color mapping for donut chart
  const continentColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
  ];

  // Prepare data for the donut chart
  const chartData = territoryData.map((territory, index) => ({
    name: territory.name,
    value: territory.value,
    fill: continentColors[index % continentColors.length],
  }));

  // Chart configuration
  const chartConfig = {
    value: {
      label: "Revenue",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Royalties x Territory</CardTitle>
        <CardDescription>Revenue distribution by territory (donut chart)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value, name) => [
                `$${Number(value).toLocaleString()}`,
                name
              ]}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TerritoryWorldMap;