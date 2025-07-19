
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { usePayouts } from "@/hooks/usePayouts";

interface ReconciliationMetrics {
  totalBatches: number;
  totalReceived: number;
  totalAllocated: number;
  totalPaidOut: number;
  reconciliationRate: number;
  pendingAmount: number;
}

export function ReconciliationDashboard() {
  const { batches, loading: batchesLoading } = useReconciliationBatches();
  const { allocations, loading: allocationsLoading } = useRoyaltyAllocations();
  const { payouts, loading: payoutsLoading } = usePayouts();
  const [metrics, setMetrics] = useState<ReconciliationMetrics>({
    totalBatches: 0,
    totalReceived: 0,
    totalAllocated: 0,
    totalPaidOut: 0,
    reconciliationRate: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    if (!batchesLoading && !allocationsLoading && !payoutsLoading) {
      const totalReceived = batches.reduce((sum, batch) => sum + batch.total_gross_amount, 0);
      const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
      const totalPaidOut = payouts.reduce((sum, payout) => sum + payout.net_payable, 0);
      const reconciliationRate = totalReceived > 0 ? (totalAllocated / totalReceived) * 100 : 0;
      const pendingAmount = totalReceived - totalAllocated;

      setMetrics({
        totalBatches: batches.length,
        totalReceived,
        totalAllocated,
        totalPaidOut,
        reconciliationRate,
        pendingAmount,
      });
    }
  }, [batches, allocations, payouts, batchesLoading, allocationsLoading, payoutsLoading]);

  const getReconciliationStatus = (rate: number) => {
    if (rate >= 95) return { status: "excellent", color: "bg-green-500", icon: CheckCircle };
    if (rate >= 80) return { status: "good", color: "bg-blue-500", icon: TrendingUp };
    if (rate >= 60) return { status: "needs-attention", color: "bg-yellow-500", icon: Clock };
    return { status: "critical", color: "bg-red-500", icon: AlertCircle };
  };

  const reconciliationStatus = getReconciliationStatus(metrics.reconciliationRate);
  const StatusIcon = reconciliationStatus.icon;

  if (batchesLoading || allocationsLoading || payoutsLoading) {
    return <div className="p-8 text-center">Loading reconciliation data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {metrics.totalBatches} batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {allocations.length} allocations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciliation Rate</CardTitle>
            <StatusIcon className={`h-4 w-4 text-${reconciliationStatus.status === 'excellent' ? 'green' : reconciliationStatus.status === 'good' ? 'blue' : reconciliationStatus.status === 'needs-attention' ? 'yellow' : 'red'}-600`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reconciliationRate.toFixed(1)}%</div>
            <Progress value={metrics.reconciliationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingAmount > 0 ? 'Needs allocation' : 'Fully reconciled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Progress by Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Reconciliation Progress</CardTitle>
          <CardDescription>Track how much of each batch has been allocated to royalties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batches.map((batch) => {
              const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
              const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
              const reconciliationProgress = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;

              return (
                <div key={batch.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{batch.batch_id}</Badge>
                      <span className="font-medium">{batch.source}</span>
                      <Badge className={batch.status === 'Processed' ? 'bg-green-100 text-green-800' : batch.status === 'Imported' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${allocatedAmount.toLocaleString()} / ${batch.total_gross_amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {reconciliationProgress.toFixed(1)}% reconciled
                      </div>
                    </div>
                  </div>
                  <Progress value={reconciliationProgress} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Tabs defaultValue="recent-batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent-batches">Recent Batches</TabsTrigger>
          <TabsTrigger value="pending-reconciliation">Needs Attention</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-batches">
          <Card>
            <CardHeader>
              <CardTitle>Recent Batches</CardTitle>
              <CardDescription>Latest reconciliation batches requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batches.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{batch.batch_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {batch.source} • {new Date(batch.date_received).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${batch.total_gross_amount.toLocaleString()}</div>
                      <Badge variant="outline">{batch.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <CardDescription>Batches with incomplete reconciliation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batches
                  .filter(batch => {
                    const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
                    const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
                    const reconciliationProgress = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
                    return reconciliationProgress < 95;
                  })
                  .map((batch) => {
                    const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
                    const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
                    const reconciliationProgress = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
                    const pendingAmount = batch.total_gross_amount - allocatedAmount;

                    return (
                      <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <div>
                            <div className="font-medium">{batch.batch_id}</div>
                            <div className="text-sm text-muted-foreground">
                              ${pendingAmount.toLocaleString()} pending reconciliation
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{reconciliationProgress.toFixed(1)}%</div>
                          <Button variant="outline" size="sm">
                            Reconcile
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Reconciliations</CardTitle>
              <CardDescription>Fully reconciled batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batches
                  .filter(batch => {
                    const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
                    const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
                    const reconciliationProgress = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
                    return reconciliationProgress >= 95;
                  })
                  .map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">{batch.batch_id}</div>
                          <div className="text-sm text-muted-foreground">
                            Fully reconciled • {new Date(batch.date_received).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${batch.total_gross_amount.toLocaleString()}</div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Complete</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
