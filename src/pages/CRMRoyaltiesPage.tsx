import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Music, DollarSign, Users, AlertTriangle, FileText, TrendingUp, Calculator, Clock, Percent } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { usePayouts } from "@/hooks/usePayouts";
import { useExpenses } from "@/hooks/useExpenses";
import { useCRMTabPersistence } from "@/hooks/useCRMTabPersistence";
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
import { PayoutListDemo } from "@/components/royalties/PayoutListDemo";
import { PayoutForm } from "@/components/royalties/PayoutForm";
import { AccountBalancesTable } from "@/components/royalties/AccountBalancesTable";
import { PayeesTable } from "@/components/royalties/PayeesTable";
import { ExpensesTable } from "@/components/royalties/ExpensesTable";
import { TerritoryNormalizer } from "@/components/admin/TerritoryNormalizer";
import { useDemoAccess } from "@/hooks/useDemoAccess";

export default function CRMRoyaltiesPage() {
  const { isDemo } = useDemoAccess();
  const [showForm, setShowForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const { activeTab, setActiveTab } = useCRMTabPersistence('/dashboard/royalties', 'analytics');
  
  const {
    allocations,
    loading
  } = useRoyaltyAllocations();
  
  const { payouts, loading: payoutsLoading } = usePayouts();
  const { expenses, loading: expensesLoading } = useExpenses();
  
  // Calculate real metrics from payouts data
  const grossRoyalties = payouts.reduce((sum, payout) => sum + (payout.gross_royalties || 0), 0);
  const totalExpensesAmount = expenses
    .filter(expense => expense.expense_status === 'approved')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netPayable = payouts.reduce((sum, payout) => sum + (payout.net_payable || 0), 0);
  
  // Calculate company earnings including commissions from agreements
  const adminFees = payouts.reduce((sum, payout) => sum + (payout.admin_fee_amount || 0), 0);
  const processingFees = payouts.reduce((sum, payout) => sum + (payout.processing_fee_amount || 0), 0);
  const commissionEarnings = payouts.reduce((sum, payout) => {
    // Use the new commissions_amount field directly
    return sum + (payout.commissions_amount || 0);
  }, 0);
  const companyEarnings = adminFees + processingFees + commissionEarnings;

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

      

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Analytics
          </TabsTrigger>
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

          <TerritoryNormalizer />
          
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
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Royalties</p>
                    <p className="text-xl font-bold">${grossRoyalties.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total royalties collected</p>
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
                    <p className="text-xl font-bold text-red-600">${totalExpensesAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Remaining expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded">
                    <Calculator className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Payable</p>
                    <p className="text-xl font-bold">${netPayable.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total royalties due</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded">
                    <Percent className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Earnings</p>
                    <p className="text-xl font-bold">${companyEarnings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Admin fees & commissions</p>
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
                  {isDemo ? <PayoutListDemo /> : <PayoutList />}
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