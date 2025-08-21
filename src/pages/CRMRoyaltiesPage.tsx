import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Music, DollarSign, Users, AlertTriangle, FileText, TrendingUp, Calculator, Clock } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useControlledWriters } from "@/hooks/useControlledWriters";
import { RoyaltyAllocationForm } from "@/components/royalties/RoyaltyAllocationForm";
import { RoyaltyAllocationList } from "@/components/royalties/RoyaltyAllocationList";

import { RoyaltiesImportStaging } from "@/components/royalties/RoyaltiesImportStaging";
import { RoyaltiesDiscrepancyReport } from "@/components/royalties/RoyaltiesDiscrepancyReport";
import { RoyaltiesAnalyticsDashboard } from "@/components/royalties/RoyaltiesAnalyticsDashboard";
import { ReconciliationDashboard } from "@/components/royalties/ReconciliationDashboard";
import { ReconciliationBatchList } from "@/components/royalties/ReconciliationBatchList";
import { ReconciliationBatchForm } from "@/components/royalties/ReconciliationBatchForm";
import { ReconciliationAnalytics } from "@/components/royalties/ReconciliationAnalytics";
import { PayoutList } from "@/components/royalties/PayoutList";
import { PayoutForm } from "@/components/royalties/PayoutForm";
import { AccountBalancesTable } from "@/components/royalties/AccountBalancesTable";
import { PayeesTable } from "@/components/royalties/PayeesTable";
import { ExpensesTable } from "@/components/royalties/ExpensesTable";

export default function CRMRoyaltiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [activeTab, setActiveTab] = useState("reconciliation");
  
  const {
    allocations,
    loading
  } = useRoyaltyAllocations();
  
  const { writers: controlledWriters, loading: writersLoading } = useControlledWriters();
  
  // Calculate analytics data for key metrics
  const analyticsData = useMemo(() => {
    // Find top performing song and songwriter
    const songPerformance = allocations.reduce((acc, allocation) => {
      const song = allocation.song_title || 'Unknown';
      acc[song] = (acc[song] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const topSong = Object.entries(songPerformance)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate top performing controlled songwriter
    const songwriterPerformance = allocations.reduce((acc, allocation) => {
      // Find controlled writers associated with this allocation
      const associatedWriters = controlledWriters.filter(writer => 
        allocation.song_title && writer.name
      );
      
      if (associatedWriters.length > 0) {
        associatedWriters.forEach(writer => {
          acc[writer.name] = (acc[writer.name] || 0) + allocation.gross_royalty_amount;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const topSongwriter = Object.entries(songwriterPerformance)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: allocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0),
      topSong,
      topSongwriter
    };
  }, [allocations, controlledWriters]);
  
  const totalRoyalties = allocations.reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
  const controlledWorks = allocations.filter(allocation => allocation.controlled_status === 'Controlled').length;
  const recoupableWorks = allocations.filter(allocation => allocation.recoupable_expenses).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Royalties Management</h1>
          <p className="text-muted-foreground">
            Import statements, manage allocations, and process royalty distributions
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all royalties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Song</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.topSong || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Highest earning track</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Songwriter</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.topSongwriter || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Highest earning artist</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reconciliation
          </TabsTrigger>
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statements
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Royalties
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Discrepancies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Reconciliation Management</h2>
              <p className="text-muted-foreground">
                Track and reconcile incoming royalty payments with your allocation records
              </p>
            </div>
            <Button onClick={() => setShowBatchForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Batch
            </Button>
          </div>

          <Tabs defaultValue="batches" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batches" className="gap-2">
                <FileText className="h-4 w-4" />
                Batches
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batches">
              {showBatchForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Create New Reconciliation Batch</CardTitle>
                    <CardDescription>
                      Add a new batch to track incoming royalty payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReconciliationBatchForm onCancel={() => setShowBatchForm(false)} />
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Reconciliation Batches</CardTitle>
                  <CardDescription>
                    Manage your incoming royalty payment batches and track reconciliation progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReconciliationBatchList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <ReconciliationAnalytics />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Statements</h2>
              <p className="text-muted-foreground">
                Import statements, map sources for auto-detection, and review data for approval and allocation
              </p>
            </div>
          </div>

          <RoyaltiesImportStaging />
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Royalties</h2>
              <p className="text-muted-foreground">
                Map works and their rightsholders to reconciled revenue
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Royalty
            </Button>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Royalty</CardTitle>
                  <CardDescription>
                    Map a work to its rightsholders and reconciled revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoyaltyAllocationForm onCancel={() => setShowForm(false)} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Royalties</CardTitle>
                <CardDescription>
                  Manage work-to-rightholder mappings and revenue distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoyaltyAllocationList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RoyaltiesAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Payouts & Client Accounting</h2>
              <p className="text-muted-foreground">
                Handle periodic statements and payments for clients
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                Create Demo Data
              </Button>
              <Button onClick={() => setShowPayoutForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Payout
              </Button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payouts</p>
                    <p className="text-xl font-bold">11</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-xl font-bold">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-xl font-bold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">$2,622,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">$1,000,000</p>
                    <p className="text-xs text-muted-foreground">1 pending approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payouts Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payouts Management</CardTitle>
              <CardDescription>
                Comprehensive oversight of payees, expenses, account balances, and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payouts" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="payees">Payees</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="account-balances">Account Balances</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>

                <TabsContent value="payees">
                  <PayeesTable />
                </TabsContent>

                <TabsContent value="expenses">
                  <ExpensesTable />
                </TabsContent>

                <TabsContent value="account-balances">
                  <AccountBalancesTable />
                </TabsContent>

                <TabsContent value="payouts">
                  <PayoutList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {showPayoutForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Payout</CardTitle>
                <CardDescription>
                  Generate payout statements for writers and publishers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayoutForm onCancel={() => setShowPayoutForm(false)} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Discrepancy Report</h2>
              <p className="text-muted-foreground">
                Track unmatched songs, low confidence matches, and potential duplicates
              </p>
            </div>
          </div>

          <RoyaltiesDiscrepancyReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}