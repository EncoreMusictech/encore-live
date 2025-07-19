
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { ReconciliationBatch } from "@/hooks/useReconciliationBatches";
import { RoyaltyAllocation } from "@/hooks/useRoyaltyAllocations";

interface ReconciliationSummaryCardProps {
  batch: ReconciliationBatch;
  allocations: RoyaltyAllocation[];
  onViewDetails?: (batchId: string) => void;
  onViewAllocations?: (batchId: string) => void;
}

export function ReconciliationSummaryCard({ 
  batch, 
  allocations, 
  onViewDetails, 
  onViewAllocations 
}: ReconciliationSummaryCardProps) {
  const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
  const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
  const reconciliationProgress = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
  const remainingAmount = batch.total_gross_amount - allocatedAmount;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processed': return 'bg-green-100 text-green-800';
      case 'Imported': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getReconciliationStatusIcon = (progress: number) => {
    if (progress >= 95) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{batch.batch_id}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{batch.source}</Badge>
              <span>•</span>
              <span>{new Date(batch.date_received).toLocaleDateString()}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getReconciliationStatusIcon(reconciliationProgress)}
            <Badge className={getStatusColor(batch.status)}>
              {batch.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Received</div>
            <div className="text-xl font-semibold">${batch.total_gross_amount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Allocated</div>
            <div className="text-xl font-semibold">${allocatedAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Reconciliation Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Reconciliation Progress</span>
            <span className="text-sm text-muted-foreground">{reconciliationProgress.toFixed(1)}%</span>
          </div>
          <Progress value={reconciliationProgress} className="h-2" />
        </div>

        {/* Status Info */}
        <div className="flex justify-between items-center text-sm">
          <div className="text-muted-foreground">
            {batchAllocations.length} allocation{batchAllocations.length !== 1 ? 's' : ''}
          </div>
          {remainingAmount > 0 && (
            <div className="text-yellow-600 font-medium">
              ${remainingAmount.toLocaleString()} remaining
            </div>
          )}
          {remainingAmount <= 0 && reconciliationProgress >= 95 && (
            <div className="text-green-600 font-medium">
              Fully reconciled
            </div>
          )}
        </div>

        {/* Period Info */}
        {batch.statement_period_start && batch.statement_period_end && (
          <div className="text-sm text-muted-foreground">
            Period: {batch.statement_period_start} to {batch.statement_period_end}
          </div>
        )}

        {/* Notes */}
        {batch.notes && (
          <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
            {batch.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails?.(batch.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewAllocations?.(batch.id)}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Allocations ({batchAllocations.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
