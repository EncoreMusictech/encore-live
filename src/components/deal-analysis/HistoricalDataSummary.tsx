import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Edit, Trash2 } from 'lucide-react';
import { useHistoricalStatements } from '@/hooks/useHistoricalStatements';

interface HistoricalDataSummaryProps {
  artistName: string;
  onEdit?: () => void;
}

export default function HistoricalDataSummary({ artistName, onEdit }: HistoricalDataSummaryProps) {
  const { statements, calculateMetrics, deleteStatement, loading } = useHistoricalStatements(artistName);
  const metrics = calculateMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading historical data...</div>;
  }

  if (statements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          No historical data available for {artistName}
        </p>
        <Button onClick={onEdit}>Add Historical Data</Button>
      </div>
    );
  }

  const TrendIcon = metrics?.trendDirection === 'up' ? TrendingUp :
                    metrics?.trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Quarterly Revenue</p>
                <p className="text-2xl font-bold">
                  ${metrics.averageRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Revenue Trend</p>
                <div className="flex items-center gap-2">
                  <TrendIcon className={`h-5 w-5 ${
                    metrics.trendDirection === 'up' ? 'text-green-600' :
                    metrics.trendDirection === 'down' ? 'text-red-600' : 'text-muted-foreground'
                  }`} />
                  <p className="text-2xl font-bold">
                    {metrics.quarterOverQuarterGrowth > 0 ? '+' : ''}
                    {metrics.quarterOverQuarterGrowth.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Quarter-over-quarter</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Data Coverage</p>
                <p className="text-2xl font-bold">{statements.length} Quarters</p>
                <p className="text-xs text-muted-foreground">
                  {statements[0]?.period_label} - {statements[statements.length - 1]?.period_label}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statement List */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Statement History</h4>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Add More
            </Button>
          </div>

          <div className="space-y-2">
            {statements.map((statement) => (
              <div
                key={statement.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{statement.period_label}</p>
                    <Badge variant="secondary" className="text-xs">
                      {statement.statement_type}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="mr-4">
                      Gross: ${statement.gross_revenue.toLocaleString()}
                    </span>
                    <span>Net: ${statement.net_revenue.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => statement.id && deleteStatement(statement.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {statements.length < 8 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              You can add {8 - statements.length} more quarter{8 - statements.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
