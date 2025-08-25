import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, DollarSign } from "lucide-react";

export const BlockchainAnalytics = () => {
  const metrics = [
    {
      title: "Total Portfolio Value",
      value: "$0.00",
      change: "+0%",
      trend: "neutral" as const,
      description: "Combined value of all tokenized assets"
    },
    {
      title: "Monthly Trading Volume", 
      value: "$0.00",
      change: "+0%",
      trend: "neutral" as const,
      description: "Total trading activity this month"
    },
    {
      title: "Royalty Earnings",
      value: "$0.00", 
      change: "+0%",
      trend: "neutral" as const,
      description: "Smart contract royalty distributions"
    },
    {
      title: "Gas Fees Paid",
      value: "$0.00",
      change: "+0%", 
      trend: "neutral" as const,
      description: "Total blockchain transaction costs"
    }
  ];

  const assetBreakdown = [
    { type: "Copyright NFTs", count: 0, percentage: 0, color: "bg-blue-500" },
    { type: "Contract NFTs", count: 0, percentage: 0, color: "bg-green-500" },
    { type: "Royalty NFTs", count: 0, percentage: 0, color: "bg-purple-500" }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                  {metric.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of your tokenized assets by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assetBreakdown.every(asset => asset.count === 0) ? (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No assets minted yet</p>
                <p className="text-sm text-muted-foreground">Start minting to see your asset distribution</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assetBreakdown.map(asset => (
                  <div key={asset.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${asset.color}`} />
                        <span>{asset.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.count}</span>
                        <Badge variant="outline">{asset.percentage}%</Badge>
                      </div>
                    </div>
                    <Progress value={asset.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Analytics
            </CardTitle>
            <CardDescription>
              Track earnings from your tokenized assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No revenue data available</p>
              <p className="text-sm text-muted-foreground">Start earning royalties to see analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Blockchain Activity
          </CardTitle>
          <CardDescription>
            Latest transactions and smart contract interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No blockchain activity yet</p>
            <p className="text-sm text-muted-foreground">Your transactions will appear here once you start using the blockchain features</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};