import React from "react";
import { SavedScenario } from "@/hooks/useSavedScenarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';
import { DollarSign, Target, BarChart3, TrendingUp, Users, Music, Calendar } from "lucide-react";

interface ScenarioComparisonViewProps {
  scenarios: SavedScenario[];
  onClose: () => void;
}

export const ScenarioComparisonView: React.FC<ScenarioComparisonViewProps> = ({
  scenarios,
  onClose,
}) => {
  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Prepare chart data
  const valuationChartData = scenarios.map((scenario, index) => ({
    name: scenario.artist_name,
    scenario_name: scenario.scenario_name,
    valuation: scenario.risk_adjusted_value || scenario.valuation_amount || 0,
    dcf_valuation: scenario.dcf_valuation || 0,
    multiple_valuation: scenario.multiple_valuation || 0,
    confidence: scenario.confidence_score || 0,
    index,
  }));

  const confidenceChartData = scenarios.map((scenario, index) => ({
    name: scenario.artist_name,
    confidence: scenario.confidence_score || 0,
    fill: `hsl(${120 + (index * 60)}, 70%, 50%)`,
  }));

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Scenario Comparison
            <Badge variant="secondary">{scenarios.length} scenarios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario, index) => (
              <div key={scenario.id} className="text-center p-4 border rounded-lg">
                <div className="space-y-2">
                  <div 
                    className="w-4 h-4 rounded-full mx-auto"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <h3 className="font-medium">{scenario.scenario_name}</h3>
                  <Badge variant="outline">{scenario.artist_name}</Badge>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(scenario.risk_adjusted_value || scenario.valuation_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Valuation Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valuation Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valuationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(label, payload) => {
                    const scenario = payload?.[0]?.payload;
                    return scenario ? scenario.scenario_name : label;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="valuation" 
                  name="Primary Valuation" 
                  fill="#8884d8" 
                />
                {scenarios.some(s => s.dcf_valuation) && (
                  <Bar 
                    dataKey="dcf_valuation" 
                    name="DCF Valuation" 
                    fill="#82ca9d" 
                  />
                )}
                {scenarios.some(s => s.multiple_valuation) && (
                  <Bar 
                    dataKey="multiple_valuation" 
                    name="Multiple Valuation" 
                    fill="#ffc658" 
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Confidence Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Confidence Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={confidenceChartData}
                >
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    dataKey="confidence"
                  />
                  <Legend />
                  <Tooltip formatter={(value: any) => [`${value}/100`, 'Confidence']} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Average Values */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Avg Valuation</div>
                  <div className="font-bold text-green-600">
                    {formatCurrency(
                      scenarios.reduce((acc, s) => acc + (s.risk_adjusted_value || s.valuation_amount || 0), 0) / scenarios.length
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  <div className="font-bold text-blue-600">
                    {Math.round(
                      scenarios.reduce((acc, s) => acc + (s.confidence_score || 0), 0) / scenarios.length
                    )}/100
                  </div>
                </div>
              </div>

              {/* Range Information */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valuation Range:</span>
                  <span>
                    {formatCurrency(Math.min(...scenarios.map(s => s.risk_adjusted_value || s.valuation_amount || 0)))} - {formatCurrency(Math.max(...scenarios.map(s => s.risk_adjusted_value || s.valuation_amount || 0)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue Sources:</span>
                  <span>{scenarios.reduce((acc, s) => acc + (s.revenue_sources_count || 0), 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  {scenarios.map((scenario, index) => (
                    <th key={scenario.id} className="text-left p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div>
                          <div className="font-medium">{scenario.artist_name}</div>
                          <div className="text-xs text-muted-foreground">{scenario.scenario_name}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Primary Valuation</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2 font-semibold text-green-600">
                      {formatCurrency(scenario.risk_adjusted_value || scenario.valuation_amount)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Confidence Score</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {scenario.confidence_score || 0}/100
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Total Streams</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {formatNumber(scenario.total_streams)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Monthly Listeners</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {formatNumber(scenario.monthly_listeners)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Revenue Sources</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {scenario.revenue_sources_count || 0}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Genre</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {scenario.genre ? (
                        <Badge variant="outline" className="text-xs">{scenario.genre}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Created Date</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2 text-muted-foreground">
                      {formatDate(scenario.created_at)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Additional Revenue</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="p-2">
                      {scenario.has_additional_revenue ? (
                        <span className="text-green-600">{formatCurrency(scenario.total_additional_revenue)}</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};