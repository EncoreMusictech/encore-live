import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, DollarSign, Users, TrendingUp } from "lucide-react";
import { usePayouts } from "@/hooks/usePayouts";
import { useExpenses } from "@/hooks/useExpenses";
import { EnhancedPayoutForm } from "@/components/royalties/EnhancedPayoutForm";
import { PayoutList } from "@/components/royalties/PayoutList";
import { PayoutListDemo } from "@/components/royalties/PayoutListDemo";
import { PayeesTable } from "@/components/royalties/PayeesTable";
import { ExpensesTable } from "@/components/royalties/ExpensesTable";
import { AccountBalancesTable } from "@/components/royalties/AccountBalancesTable";
import { RoyaltiesModuleNav } from "@/components/royalties/RoyaltiesModuleNav";

export default function PayoutsPage() {
  const [showForm, setShowForm] = useState(false);
  const { payouts, loading } = usePayouts();
  const { expenses } = useExpenses();

  useEffect(() => {
    updatePageMetadata('payouts');
  }, []);

  const totalPayouts = payouts.reduce((sum, payout) => sum + payout.net_payable, 0);
  const pendingPayouts = payouts.filter(payout => payout.workflow_stage === 'pending_review').length;
  const processingPayouts = payouts.filter(payout => payout.workflow_stage === 'processing').length;
  const paidPayouts = payouts.filter(payout => payout.workflow_stage === 'paid').length;
  const approvedPayouts = payouts.filter(payout => payout.workflow_stage === 'approved').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.expense_status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <RoyaltiesModuleNav />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payouts & Client Accounting</h1>
            <p className="text-muted-foreground mt-2">
              Handle periodic statements and payments for clients
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Payout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{approvedPayouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{processingPayouts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayouts.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {pendingExpenses} pending approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Payout</CardTitle>
                <CardDescription>
                  Generate a new payout statement for a client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedPayoutForm onCancel={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payouts Management</CardTitle>
              <CardDescription>
                Comprehensive oversight of payees, expenses, account balances, and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payouts" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="payees">Payees</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="balances">Account Balances</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payees" className="mt-6">
                  <PayeesTable />
                </TabsContent>
                
                <TabsContent value="expenses" className="mt-6">
                  <ExpensesTable />
                </TabsContent>
                
                <TabsContent value="balances" className="mt-6">
                  <AccountBalancesTable />
                </TabsContent>
                
                <TabsContent value="payouts" className="mt-6">
                  <PayoutList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}